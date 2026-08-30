import { describe, expect, it } from "vitest";
import { PACKAGE_NAME } from "./index";

describe("@storeforge/ui-native", () => {
  it("exports a package identity placeholder until Phase 1's real components land", () => {
    expect(PACKAGE_NAME).toBe("@storeforge/ui-native");
  });
});
