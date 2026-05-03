/**
 * Safe JSON parsing for fetch responses (avoids empty body / HTML error pages breaking response.json()).
 */
export async function safeParseResponseJson<T extends Record<string, unknown>>(
  response: Response
): Promise<T & { error?: string }> {
  const text = await response.text();
  if (!text.trim()) {
    return { error: "התקבלה תשובה ריקה מהשרת" } as T & { error?: string };
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return { error: "תשובת השרת לא בפורמט צפוי" } as T & { error?: string };
  }
}
