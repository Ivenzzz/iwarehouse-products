import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./safe-redirect";

describe("safeRedirectPath", () => {
  it.each([
    ["/products/17-apple-iphone-17-pro"],
    ["/products/17-apple?variant=3#reviews"],
    ["/account"],
  ])("keeps the site path %s", (path) => {
    expect(safeRedirectPath(path)).toBe(path);
  });

  it.each([
    ["https://evil.example/phish"],
    ["//evil.example/phish"],
    ["/\\evil.example/phish"],
    ["/\t/evil.example"],
    ["\\\\evil.example"],
    ["javascript:alert(1)"],
    ["evil.example"],
    [""],
    [null],
    [undefined],
    [42],
  ])("sends %s to the account page instead", (candidate) => {
    expect(safeRedirectPath(candidate)).toBe("/account");
  });
});
