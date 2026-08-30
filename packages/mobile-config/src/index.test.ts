import { describe, expect, it } from "vitest";
import { PACKAGE_NAME } from "./index";

describe("@storeforge/mobile-config", () => {
  it("exports a package identity placeholder until Phase 7's real per-client config lands", () => {
    expect(PACKAGE_NAME).toBe("@storeforge/mobile-config");
  });
});
