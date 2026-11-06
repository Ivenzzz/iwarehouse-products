const FALLBACK_PATH = "/account";

/**
 * Sign-in's ?next= only ever returns visitors to a page on this site, so a
 * crafted link can't send them somewhere else after they enter their password.
 */
export function safeRedirectPath(candidate: unknown): string {
  if (typeof candidate !== "string" || !candidate.startsWith("/")) {
    return FALLBACK_PATH;
  }

  // Browsers treat "//host" and "/\host" as other sites, and strip control
  // characters before reading a URL.
  if (candidate.startsWith("//") || /[\\\u0000-\u001f]/.test(candidate)) {
    return FALLBACK_PATH;
  }

  const base = "https://site.invalid";
  const parsed = new URL(candidate, base);

  return parsed.origin === base
    ? `${parsed.pathname}${parsed.search}${parsed.hash}`
    : FALLBACK_PATH;
}
