import type { CookieOptions } from "@supabase/ssr";

// Strips persistence attributes so the auth cookie becomes a browser
// "session" cookie: the browser deletes it once every window/tab is
// closed, forcing a fresh login next time instead of staying signed in
// indefinitely off the refresh token.
export function asSessionCookie(options?: CookieOptions): CookieOptions {
  const { maxAge: _maxAge, expires: _expires, ...rest } = options ?? {};
  return rest;
}
