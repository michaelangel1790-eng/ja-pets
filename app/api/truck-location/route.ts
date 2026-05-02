import { NextResponse } from "next/server";
import truckLocationData from "@/data/truck-location.json";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHmac, timingSafeEqual } from "node:crypto";
import path from "node:path";
import { getAdminCode } from "@/lib/admin-env";
import { resolveAdminSessionSecret } from "@/lib/admin-session-secret";

export const runtime = "nodejs";
const DATA_DIR = path.join(process.cwd(), "data");
const TRUCK_LOCATION_FILE = path.join(DATA_DIR, "truck-location.json");
const TRUCK_LOCATION_BACKUP_FILE = path.join(DATA_DIR, "truck-location.backup.json");
const MAX_FAILED_ATTEMPTS = 10;
const BLOCK_DURATION_MS = 48 * 60 * 60 * 1000;
const failedAttemptsByClient = new Map<string, { count: number; blockedUntil: number }>();
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

type TruckLocation = {
  date: string;
  area: string;
  address: string;
  hours: string;
};

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

function isAuthorizedRequest(request: Request, codeFromBody: string | undefined, adminCode: string) {
  const sessionToken = request.headers.get("x-admin-session");
  if (verifyAdminSessionToken(sessionToken, "truck-location-admin")) {
    return true;
  }
  return (codeFromBody || "").trim() === adminCode;
}

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

function fallbackLocations(): TruckLocation[] {
  const rows = (truckLocationData as TruckLocation[]).filter(
    (row) => row?.date || row?.area || row?.address || row?.hours
  );

  if (rows.length > 0) {
    return rows;
  }

  return [
    {
      date: "",
      area: "",
      address: "",
      hours: ""
    }
  ];
}

function normalizeRow(row: string[]): TruckLocation | null {
  const [date = "", area = "", address = "", hours = ""] = row.map((cell) => cell.trim());
  if (!date && !area && !address && !hours) {
    return null;
  }
  return { date, area, address, hours };
}

function parseCsv(csv: string) {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) return [];

  return lines
    .slice(1)
    .map((line) => {
      const cols = line
        .split(",")
        .map((cell) => cell.replace(/^"|"$/g, "").replace(/""/g, '"'));
      return normalizeRow(cols);
    })
    .filter((row): row is TruckLocation => row !== null);
}

function normalizeFromObject(raw: unknown): TruckLocation | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;

  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value.trim();
      if (typeof value === "number") return String(value);
    }
    return "";
  };

  // Supports both English and Hebrew headers from Google Sheets / Apps Script.
  const date = pick("date", "Date", "dates", "Dates", "תאריכים", "בין תאריכים", "שבוע", "week");
  const area = pick("area", "Area", "אזור", "שכונה", "location", "Location");
  const address = pick("address", "Address", "כתובת", "מיקום", "locationAddress");
  const hours = pick("hours", "Hours", "שעות", "שעות פעילות", "זמינות");

  if (!date && !area && !address && !hours) return null;
  return { date, area, address, hours };
}

function normalizeMany(raw: unknown): TruckLocation[] {
  if (Array.isArray(raw)) {
    return raw.map((row) => normalizeFromObject(row)).filter((row): row is TruckLocation => row !== null);
  }

  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>;

    if (Array.isArray(record.locations)) {
      return record.locations
        .map((row) => normalizeFromObject(row))
        .filter((row): row is TruckLocation => row !== null);
    }

    const single = normalizeFromObject(raw);
    return single ? [single] : [];
  }

  return [];
}

function normalizeInputRows(raw: unknown): TruckLocation[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((row) => normalizeFromObject(row))
    .filter((row): row is TruckLocation => row !== null)
    .map((row) => ({
      date: row.date.trim(),
      area: row.area.trim(),
      address: row.address.trim(),
      hours: row.hours.trim()
    }))
    .filter((row) => row.date || row.area || row.address || row.hours);
}

function validateLocations(locations: TruckLocation[]) {
  for (let index = 0; index < locations.length; index += 1) {
    const row = locations[index];
    if (!row.date || !row.area || !row.address || !row.hours) {
      return `בשורה ${index + 1} יש להשלים תאריך, אזור, כתובת ושעות פעילות`;
    }
  }
  return null;
}

async function writeLocationsWithBackup(locations: TruckLocation[]) {
  await ensureDataDir();
  if (existsSync(TRUCK_LOCATION_FILE)) {
    await copyFile(TRUCK_LOCATION_FILE, TRUCK_LOCATION_BACKUP_FILE);
  }
  await writeFile(TRUCK_LOCATION_FILE, JSON.stringify(locations, null, 2), "utf8");
}

async function readLocalManagedLocations(): Promise<TruckLocation[]> {
  if (!existsSync(TRUCK_LOCATION_FILE)) return [];
  try {
    const raw = await readFile(TRUCK_LOCATION_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return normalizeInputRows(parsed);
  } catch {
    return [];
  }
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

export async function GET() {
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const gid = process.env.GOOGLE_SHEET_GID || "0";

  try {
    // Always prefer locally managed data so manual updates/deletes are reflected immediately.
    const localManaged = await readLocalManagedLocations();
    if (localManaged.length > 0) {
      return NextResponse.json({ location: localManaged[0], locations: localManaged, source: "local-file" });
    }

    if (scriptUrl) {
      const response = await fetchWithTimeout(scriptUrl, { cache: "no-store" });
      if (response.ok) {
        const payload = (await response.json()) as unknown;
        const locations = normalizeMany(payload);
        if (locations.length > 0) {
          return NextResponse.json({ location: locations[0], locations, source: "google-apps-script" });
        }
      }
    }

    if (sheetId) {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
      const response = await fetchWithTimeout(csvUrl, { cache: "no-store" });

      if (response.ok) {
        const csv = await response.text();
        const rows = parseCsv(csv);
        if (rows.length > 0) {
          return NextResponse.json({ location: rows[0], locations: rows, source: "google-sheet" });
        }
      }
    }

    const fallback = fallbackLocations();
    return NextResponse.json({ location: fallback[0], locations: fallback, source: "fallback" });
  } catch {
    const fallback = fallbackLocations();
    return NextResponse.json({ location: fallback[0], locations: fallback, source: "fallback" });
  }
}

export async function POST(request: Request) {
  const clientKey = getClientKey(request);
  const blockedUntil = getBlockedUntil(clientKey);
  if (blockedUntil > 0) {
    const minutesLeft = Math.ceil((blockedUntil - Date.now()) / 60000);
    return NextResponse.json(
      { error: `נחסמת זמנית אחרי יותר מדי ניסיונות שגויים. נסה שוב בעוד כ-${minutesLeft} דקות` },
      { status: 429 }
    );
  }
  const body = (await request.json()) as {
    code?: string;
    locations?: unknown;
    action?: "verify-code" | "save" | "restore-last";
  };
  const code = (body.code || "").trim();
  const configuredAdminCode = getAdminCode();
  if (!configuredAdminCode) {
    return NextResponse.json({ error: "קוד מנהל לא הוגדר בשרת" }, { status: 500 });
  }
  if (!isAuthorizedRequest(request, code, configuredAdminCode)) {
    registerFailedAttempt(clientKey);
    return NextResponse.json({ error: "קוד מנהל שגוי" }, { status: 401 });
  }
  clearFailedAttempts(clientKey);

  if (body.action === "verify-code") {
    const sessionToken = createAdminSessionToken("truck-location-admin");
    if (!sessionToken) {
      return NextResponse.json({ error: "לא ניתן ליצור סשן מנהל - בדקו את תצורת השרת" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, sessionToken });
  }

  if (body.action === "restore-last") {
    if (!existsSync(TRUCK_LOCATION_BACKUP_FILE)) {
      return NextResponse.json({ error: "לא נמצאה גרסה קודמת לשחזור" }, { status: 404 });
    }
    const backupRaw = await readFile(TRUCK_LOCATION_BACKUP_FILE, "utf8");
    const backupParsed = JSON.parse(backupRaw) as unknown;
    const backupLocations = normalizeInputRows(backupParsed);
    const validationError = validateLocations(backupLocations);
    if (backupLocations.length === 0 || validationError) {
      return NextResponse.json({ error: "הגרסה הקודמת לא תקינה לשחזור" }, { status: 400 });
    }
    await writeFile(TRUCK_LOCATION_FILE, JSON.stringify(backupLocations, null, 2), "utf8");
    return NextResponse.json({ ok: true, location: backupLocations[0], locations: backupLocations, source: "restored-backup" });
  }

  const locations = normalizeInputRows(body.locations);
  if (locations.length === 0) {
    return NextResponse.json({ error: "יש להזין לפחות מיקום אחד תקין" }, { status: 400 });
  }
  const validationError = validateLocations(locations);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  await writeLocationsWithBackup(locations);

  return NextResponse.json({ ok: true, location: locations[0], locations, source: "local-admin" });
}
