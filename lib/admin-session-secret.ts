/**
 * Secret used to sign `x-admin-session` tokens.
 * Must come only from environment variables.
 */
export function resolveAdminSessionSecret(): string {
  return (process.env.ADMIN_SESSION_SECRET || "").trim();
}
