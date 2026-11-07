/**
 * Google refuses sign-in inside apps' built-in browsers ("disallowed_useragent"),
 * so the sign-in page spots them and explains what to do instead. It matches
 * Facebook-family and other common apps plus Android's generic WebView marker.
 * It can't catch every app, so a few people may still reach Google's error page.
 */
const EMBEDDED_BROWSER =
  /FBAN|FBAV|FB_IAB|FBIOS|Messenger|Instagram|\bLine\/|TikTok|musical_ly|BytedanceWebview|Snapchat|Twitter|; ?wv\)/i;

export function isEmbeddedBrowser(userAgent: string | null): boolean {
  return userAgent !== null && EMBEDDED_BROWSER.test(userAgent);
}
