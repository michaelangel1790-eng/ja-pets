import { NextResponse } from "next/server";
import { getAdminCode } from "@/lib/admin-env";
import { resolveAdminSessionSecret } from "@/lib/admin-session-secret";

/** Admin POST/GET routes must reject early when server env is incomplete (always JSON). */
export function adminConfigurationErrorResponse(): NextResponse | null {
  const code = getAdminCode();
  const secret = resolveAdminSessionSecret();
  if (!code || !secret) {
    return NextResponse.json({ error: "קוד מנהל לא הוגדר בשרת" }, { status: 500 });
  }
  return null;
}
