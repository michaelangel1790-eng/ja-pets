/**
 * Admin PIN - only from `process.env.ADMIN_CODE`. Empty if unset (admin routes deny safely).
 */
export function getAdminCode(): string {
  return (process.env.ADMIN_CODE || "").trim();
}
