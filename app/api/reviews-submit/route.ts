import { NextResponse } from "next/server";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
const REVIEW_SUBMIT_WINDOW_MS = 15 * 60 * 1000;
const REVIEW_SUBMIT_MAX_PER_WINDOW = 5;
const submitAttemptsByClient = new Map<string, { count: number; windowStartedAt: number }>();

type PendingReview = {
  name: string;
  area: string;
  review: string;
  rating: number;
  approved: "no";
  date: string;
  id?: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const PENDING_FILE = path.join(DATA_DIR, "reviews-pending.json");

function getClientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ip = (forwarded.split(",")[0] || request.headers.get("x-real-ip") || "unknown").trim();
  const userAgent = (request.headers.get("user-agent") || "unknown").slice(0, 180);
  return `${ip}::${userAgent}`;
}

function registerSubmitAttempt(clientKey: string) {
  const now = Date.now();
  const state = submitAttemptsByClient.get(clientKey);
  if (!state || now - state.windowStartedAt > REVIEW_SUBMIT_WINDOW_MS) {
    submitAttemptsByClient.set(clientKey, { count: 1, windowStartedAt: now });
    return { blocked: false, remainingMs: REVIEW_SUBMIT_WINDOW_MS };
  }
  const nextCount = state.count + 1;
  submitAttemptsByClient.set(clientKey, { count: nextCount, windowStartedAt: state.windowStartedAt });
  const remainingMs = REVIEW_SUBMIT_WINDOW_MS - (now - state.windowStartedAt);
  return { blocked: nextCount > REVIEW_SUBMIT_MAX_PER_WINDOW, remainingMs };
}

async function fetchWithTimeout(input: string, init: RequestInit = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  try {
    const clientKey = getClientKey(request);
    const rate = registerSubmitAttempt(clientKey);
    if (rate.blocked) {
      const minutesLeft = Math.ceil(rate.remainingMs / 60000);
      return NextResponse.json(
        { error: `נשלחו יותר מדי ביקורות בזמן קצר. נסו שוב בעוד כ-${minutesLeft} דקות` },
        { status: 429 }
      );
    }

    const scriptUrl = process.env.GOOGLE_REVIEWS_SCRIPT_URL;

    const body = (await request.json()) as Partial<PendingReview>;

    const name = String(body.name ?? "").trim();
    const area = String(body.area ?? "").trim();
    const review = String(body.review ?? "").trim();
    const ratingNum = Number(body.rating ?? 0);
    const rating = Number.isFinite(ratingNum) ? Math.max(1, Math.min(5, Math.round(ratingNum))) : 5;
    if (!name || !area || !review) {
      return NextResponse.json({ error: "יש למלא שם, אזור ותוכן ביקורת" }, { status: 400 });
    }

    const nextEntry: PendingReview = {
      name,
      area,
      review,
      rating,
      approved: "no",
      date: new Date().toISOString().slice(0, 10)
    };

    if (!existsSync(DATA_DIR)) {
      await mkdir(DATA_DIR, { recursive: true });
    }
    let current: PendingReview[] = [];
    if (existsSync(PENDING_FILE)) {
      try {
        const raw = await readFile(PENDING_FILE, "utf8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) current = parsed as PendingReview[];
      } catch {
        current = [];
      }
    }
    current.unshift({
      ...nextEntry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    });
    await writeFile(PENDING_FILE, JSON.stringify(current, null, 2), "utf8");

    if (scriptUrl) {
      const upstreamResponse = await fetchWithTimeout(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submitReview",
          ...nextEntry
        })
      });
      await upstreamResponse.json().catch(() => ({}));
    }

    return NextResponse.json({ ok: true, message: "הביקורת נשלחה וממתינה לאישור" });
  } catch {
    return NextResponse.json({ error: "שליחת הביקורת נכשלה, נסו שוב" }, { status: 500 });
  }
}
