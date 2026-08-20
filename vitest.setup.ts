import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// RTL's auto-cleanup needs a global afterEach (vitest `globals: true`), which
// this project doesn't enable — register cleanup explicitly so React roots are
// unmounted before jsdom tears down.
afterEach(() => {
  cleanup();
});
