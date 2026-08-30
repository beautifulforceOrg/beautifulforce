import { describe, expect, it } from "vitest";
import { PACKAGE_NAME } from "./index";

describe("@storeforge/api-client", () => {
  it("exports a package identity placeholder until Phase 2's real client lands", () => {
    expect(PACKAGE_NAME).toBe("@storeforge/api-client");
  });
});
