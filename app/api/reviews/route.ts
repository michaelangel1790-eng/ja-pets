import { NextResponse } from "next/server";
import { testimonials } from "@/data/site-data";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

const REVIEWS_GET_WINDOW_MS = 60_000;
const REVIEWS_GET_MAX_PER_WINDOW = 120;

type Review = {
  name: string;
  area: string;
  review: string;
  rating: number;
  image_url?: string;
  date?: string;
};

const APPROVED_LOCAL_FILE = path.join(process.cwd(), "data", "reviews-approved-local.json");

async function fetchWithTimeout(input: string, init: RequestInit = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function getLocalApproved(): Promise<Review[]> {
  if (!existsSync(APPROVED_LOCAL_FILE)) return [];
  try {
    const raw = await readFile(APPROVED_LOCAL_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed.map((item) => normalizeReview(item)).filter((x): x is Review => x !== null)) : [];
  } catch {
    return [];
  }
}

function normalizeReview(raw: unknown): Review | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;

  const name = String(record.name ?? "").trim();
  const area = String(record.area ?? "").trim();
  const review = String(record.review ?? "").trim();
  const ratingNum = Number(record.rating ?? 0);
  const rating = Number.isFinite(ratingNum) ? Math.max(0, Math.min(5, Math.round(ratingNum))) : 0;
  const image_url = String(record.image_url ?? "").trim();
  const date = String(record.date ?? "").trim();

  if (!name && !area && !review) return null;
  return { name, area, review, rating, image_url, date };
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimitResponse(`reviews:get:${ip}`, {
    windowMs: REVIEWS_GET_WINDOW_MS,
    max: REVIEWS_GET_MAX_PER_WINDOW,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "יותר מדי בקשות — נסו שוב בעוד רגע" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
    );
  }

  const scriptUrl = process.env.GOOGLE_REVIEWS_SCRIPT_URL;

  try {
    if (scriptUrl) {
      const response = await fetchWithTimeout(scriptUrl, { cache: "no-store" });
      if (response.ok) {
        const payload = (await response.json()) as { reviews?: unknown[] };
        const normalized = (payload.reviews ?? [])
          .map((item) => normalizeReview(item))
          .filter((item): item is Review => item !== null);
        const localApproved = await getLocalApproved();
        const merged = [...localApproved, ...normalized];
        if (merged.length > 0) {
          return NextResponse.json({ reviews: merged, source: "google-apps-script" });
        }
      }
    }

    const localApproved = await getLocalApproved();
    return NextResponse.json({ reviews: localApproved.length > 0 ? localApproved : testimonials, source: "fallback" });
  } catch {
    const localApproved = await getLocalApproved();
    return NextResponse.json({ reviews: localApproved.length > 0 ? localApproved : testimonials, source: "fallback" });
  }
}
