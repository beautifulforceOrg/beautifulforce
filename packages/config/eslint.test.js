import { Linter } from "eslint";
import { describe, expect, it } from "vitest";
import config from "./eslint.js";

const linter = new Linter({ configType: "flat" });

describe("shared eslint config", () => {
  it("flags dangerouslySetInnerHTML", () => {
    const code = [
      "export function Bad({ html }) {",
      "  return <div dangerouslySetInnerHTML={{ __html: html }} />;",
      "}",
    ].join("\n");

    const messages = linter.verify(code, config, { filename: "test.tsx" });

    expect(messages.some((m) => m.ruleId === "no-restricted-syntax")).toBe(true);
  });

  it("flags $queryRawUnsafe with interpolated input", () => {
    const code = [
      "declare const db: any;",
      "const id = getUnsafeId();",
      "db.$queryRawUnsafe(`SELECT * FROM users WHERE id = ${id}`);",
      "declare function getUnsafeId(): string;",
    ].join("\n");

    const messages = linter.verify(code, config, { filename: "test.ts" });

    expect(messages.some((m) => m.ruleId === "no-restricted-syntax")).toBe(true);
  });

  it("does not flag ordinary, safe code", () => {
    const code = "export const add = (a: number, b: number) => a + b;";

    const messages = linter.verify(code, config, { filename: "test.ts" });

    expect(messages).toHaveLength(0);
  });
});
