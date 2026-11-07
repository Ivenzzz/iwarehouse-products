import { describe, expect, it } from "vitest";
import { isEmbeddedBrowser } from "./embedded-browser";

describe("isEmbeddedBrowser", () => {
  it.each([
    ["Facebook on Android", "Mozilla/5.0 (Linux; Android 14; SM-A546E; wv) AppleWebKit/537.36 Chrome/128.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/482.0.0.40.81;]"],
    ["Facebook on iPhone", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 [FBAN/FBIOS;FBAV/482.0;]"],
    ["Messenger on Android", "Mozilla/5.0 (Linux; Android 13; wv) AppleWebKit/537.36 Chrome/127.0 Mobile Safari/537.36 [FB_IAB/Orca-Android;FBAV/476.0;]"],
    ["Messenger on iPhone", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 LightSpeed [FBAN/MessengerLiteForiOS;FBAV/470.0;]"],
    ["Instagram", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 345.0.0"],
    ["TikTok", "Mozilla/5.0 (Linux; Android 12; wv) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36 musical_ly_2023 BytedanceWebview/d8a21c6"],
    ["a generic Android app", "Mozilla/5.0 (Linux; Android 11; Pixel 5; wv) AppleWebKit/537.36 Version/4.0 Chrome/120.0 Mobile Safari/537.36"],
  ])("spots %s", (_, userAgent) => {
    expect(isEmbeddedBrowser(userAgent)).toBe(true);
  });

  it.each([
    ["Chrome on Android", "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 Chrome/128.0 Mobile Safari/537.36"],
    ["Safari on iPhone", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 Version/17.6 Mobile/15E148 Safari/604.1"],
    ["Chrome on Windows", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0 Safari/537.36"],
    ["Edge on Windows", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0 Safari/537.36 Edg/128.0"],
    ["Samsung Internet", "Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-A546E) AppleWebKit/537.36 SamsungBrowser/25.0 Chrome/121.0 Mobile Safari/537.36"],
    ["no user agent", null],
  ])("leaves %s alone", (_, userAgent) => {
    expect(isEmbeddedBrowser(userAgent)).toBe(false);
  });
});
