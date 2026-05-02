import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHmac, timingSafeEqual } from "node:crypto";
import path from "node:path";
import { NextResponse } from "next/server";
import { getAdminCode } from "@/lib/admin-env";
import { resolveAdminSessionSecret } from "@/lib/admin-session-secret";

export const runtime = "nodejs";
const MAX_FAILED_ATTEMPTS = 10;
const BLOCK_DURATION_MS = 48 * 60 * 60 * 1000;
const failedAttemptsByClient = new Map<string, { count: number; blockedUntil: number }>();
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

type Review = {
  name: string;
  area: string;
  review: string;
  rating: number;
  approved: "no" | "yes";
  date: string;
  id: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const PENDING_FILE = path.join(DATA_DIR, "reviews-pending.json");
const APPROVED_FILE = path.join(DATA_DIR, "reviews-approved-local.json");

function getClientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ip = (forwarded.split(",")[0] || request.headers.get("x-real-ip") || "unknown").trim();
  const userAgent = (request.headers.get("user-agent") || "unknown").slice(0, 180);
  return `${ip}::${userAgent}`;
}

function getBlockedUntil(clientKey: string) {
  const state = failedAttemptsByClient.get(clientKey);
  if (!state) return 0;
  if (state.blockedUntil > Date.now()) return state.blockedUntil;
  if (state.blockedUntil > 0) {
    failedAttemptsByClient.delete(clientKey);
  }
  return 0;
}

function registerFailedAttempt(clientKey: string) {
  const now = Date.now();
  const state = failedAttemptsByClient.get(clientKey) ?? { count: 0, blockedUntil: 0 };
  const nextCount = state.count + 1;
  if (nextCount >= MAX_FAILED_ATTEMPTS) {
    failedAttemptsByClient.set(clientKey, { count: nextCount, blockedUntil: now + BLOCK_DURATION_MS });
    return true;
  }
  failedAttemptsByClient.set(clientKey, { count: nextCount, blockedUntil: 0 });
  return false;
}

function clearFailedAttempts(clientKey: string) {
  failedAttemptsByClient.delete(clientKey);
}

function base64url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function getSessionSecret() {
  return resolveAdminSessionSecret();
}

function createAdminSessionToken(scope: string) {
  const sessionSecret = getSessionSecret();
  if (!sessionSecret) return null;
  const payload = JSON.stringify({ scope, exp: Date.now() + ADMIN_SESSION_TTL_MS });
  const encoded = base64url(payload);
  const signature = createHmac("sha256", sessionSecret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function verifyAdminSessionToken(token: string | null | undefined, scope: string) {
  const sessionSecret = getSessionSecret();
  if (!sessionSecret) return false;
  if (!token || !token.includes(".")) return false;
  const [encoded, providedSig] = token.split(".");
  if (!encoded || !providedSig) return false;
  const expectedSig = createHmac("sha256", sessionSecret).update(encoded).digest("base64url");
  const provided = Buffer.from(providedSig);
  const expected = Buffer.from(expectedSig);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return false;
  try {
    const decoded = Buffer.from(encoded, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as { scope?: string; exp?: number };
    if (parsed.scope !== scope) return false;
    if (typeof parsed.exp !== "number" || parsed.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

async function ensureDataFiles() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
  if (!existsSync(PENDING_FILE)) {
    await writeFile(PENDING_FILE, "[]", "utf8");
  }
  if (!existsSync(APPROVED_FILE)) {
    await writeFile(APPROVED_FILE, "[]", "utf8");
  }
}

async function readReviews(filePath: string): Promise<Review[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Review[]) : [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const adminCode = getAdminCode();
  if (!adminCode) {
    return NextResponse.json({ error: "קוד מנהל לא הוגדר בשרת" }, { status: 500 });
  }
  const clientKey = getClientKey(request);
  const blockedUntil = getBlockedUntil(clientKey);
  if (blockedUntil > 0) {
    const minutesLeft = Math.ceil((blockedUntil - Date.now()) / 60000);
    return NextResponse.json(
      { error: `נחסמת זמנית אחרי יותר מדי ניסיונות שגויים. נסה שוב בעוד כ-${minutesLeft} דקות` },
      { status: 429 }
    );
  }
  const sessionToken = request.headers.get("x-admin-session");
  const code = (request.headers.get("x-admin-code") || "").trim();
  const isAuthorized = verifyAdminSessionToken(sessionToken, "reviews-admin") || code === adminCode;
  if (!isAuthorized) {
    registerFailedAttempt(clientKey);
    return NextResponse.json({ error: "קוד מנהל שגוי" }, { status: 401 });
  }
  clearFailedAttempts(clientKey);

  await ensureDataFiles();
  const pending = await readReviews(PENDING_FILE);
  return NextResponse.json({ pending });
}

export async function POST(request: Request) {
  const adminCode = getAdminCode();
  if (!adminCode) {
    return NextResponse.json({ error: "קוד מנהל לא הוגדר בשרת" }, { status: 500 });
  }
  const clientKey = getClientKey(request);
  const blockedUntil = getBlockedUntil(clientKey);
  if (blockedUntil > 0) {
    const minutesLeft = Math.ceil((blockedUntil - Date.now()) / 60000);
    return NextResponse.json(
      { error: `נחסמת זמנית אחרי יותר מדי ניסיונות שגויים. נסה שוב בעוד כ-${minutesLeft} דקות` },
      { status: 429 }
    );
  }
  const body = (await request.json()) as { code?: string; action?: "approve" | "reject" | "verify-code"; id?: string };
  const sessionToken = request.headers.get("x-admin-session");
  const isAuthorized = verifyAdminSessionToken(sessionToken, "reviews-admin") || (body.code || "") === adminCode;
  if (!isAuthorized) {
    registerFailedAttempt(clientKey);
    return NextResponse.json({ error: "קוד מנהל שגוי" }, { status: 401 });
  }
  clearFailedAttempts(clientKey);
  if (body.action === "verify-code") {
    const sessionToken = createAdminSessionToken("reviews-admin");
    if (!sessionToken) {
      return NextResponse.json({ error: "לא ניתן ליצור סשן מנהל - בדקו את תצורת השרת" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, sessionToken });
  }
  if (!body.id || !body.action) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  await ensureDataFiles();
  const pending = await readReviews(PENDING_FILE);
  const approved = await readReviews(APPROVED_FILE);
  const idx = pending.findIndex((item) => item.id === body.id);
  if (idx < 0) {
    return NextResponse.json({ error: "הביקורת לא נמצאה" }, { status: 404 });
  }

  const [item] = pending.splice(idx, 1);
  if (body.action === "approve") {
    approved.unshift({ ...item, approved: "yes" });
  }

  await writeFile(PENDING_FILE, JSON.stringify(pending, null, 2), "utf8");
  await writeFile(APPROVED_FILE, JSON.stringify(approved, null, 2), "utf8");

  return NextResponse.json({ ok: true });
}
