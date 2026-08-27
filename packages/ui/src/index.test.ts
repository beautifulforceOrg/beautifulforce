import { describe, expect, it } from "vitest";
import { PACKAGE_NAME } from "./index";

describe("@storeforge/ui skeleton", () => {
  it("exists and exports a package name", () => {
    expect(PACKAGE_NAME).toBe("@storeforge/ui");
  });
});
