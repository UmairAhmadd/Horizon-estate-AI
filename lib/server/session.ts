import "server-only";

/**
 * Anonymous session id, used to group a visitor's leads/conversations/saves in
 * the database. Stored in an httpOnly cookie (never readable by client JS).
 * Only used when a database is configured.
 */
export const SESSION_COOKIE = "horizon_sid";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function readSessionId(request: Request): string | undefined {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)horizon_sid=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function newSessionId(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ?? `sid_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
