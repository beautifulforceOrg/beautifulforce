import { describe, expect, it } from "vitest";
import { PACKAGE_NAME } from "./index";

describe("@storeforge/db skeleton", () => {
  it("exists and exports a package name", () => {
    expect(PACKAGE_NAME).toBe("@storeforge/db");
  });
});
