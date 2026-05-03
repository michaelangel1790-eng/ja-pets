/**
 * מחלץ את אובייקט ה־JSON הראשון (סוגריים מאוזנים) — עוזר כשיש טקסט/שגיאת שרת לפני או אחרי ה־JSON.
 */
function extractFirstJsonObject(s: string): string | null {
  let start = -1;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "{") {
      start = i;
      break;
    }
    if (ch !== " " && ch !== "\t" && ch !== "\n" && ch !== "\r") {
      return null;
    }
  }
  if (start < 0) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

/** JSON.parse עם ניסיון שני על אובייקט מחולץ (למשל תשובה חתוכה או עם קידומת). */
export function tryParseJsonLoose(text: string): unknown | null {
  const trimmed = text.replace(/^\uFEFF/, "").trim();
  if (!trimmed || trimmed.startsWith("<")) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const extracted = extractFirstJsonObject(trimmed);
    if (!extracted) return null;
    try {
      return JSON.parse(extracted);
    } catch {
      return null;
    }
  }
}

/**
 * Safe JSON parsing for fetch responses (avoids empty body / HTML error pages breaking response.json()).
 */
export async function safeParseResponseJson<T extends Record<string, unknown>>(
  response: Response
): Promise<T & { error?: string }> {
  const text = await response.text();
  const trimmed = text.replace(/^\uFEFF/, "").trim();
  if (!trimmed) {
    return { error: "התקבלה תשובה ריקה מהשרת" } as T & { error?: string };
  }
  if (trimmed.startsWith("<")) {
    return {
      error:
        "השרת החזיר תשובה שאינה תקינה (HTML במקום JSON). נסה שוב, צמצם מספר תמונות בבת אחת, או בדוק חיבור."
    } as T & { error?: string };
  }
  const parsed = tryParseJsonLoose(text);
  if (parsed === null || typeof parsed !== "object" || parsed === null) {
    return { error: "תשובת השרת לא בפורמט צפוי" } as T & { error?: string };
  }
  return parsed as T & { error?: string };
}
