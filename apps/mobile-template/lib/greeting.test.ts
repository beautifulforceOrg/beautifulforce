import { describe, expect, it } from "vitest";
import { greet } from "./greeting";

describe("greet", () => {
  it("greets by name", () => {
    expect(greet("Beautiful Mess")).toBe("Hello, Beautiful Mess!");
  });
});
