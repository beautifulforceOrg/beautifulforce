// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";

/**
 * Shared ESLint flat config for every Storeforge package and app.
 * Consume it with: `export { default } from "@storeforge/config/eslint.js";`
 */
export default tseslint.config(
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/.next/**", "**/coverage/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Prisma parameterizes queries by default; raw interpolated SQL bypasses that.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.property.name='$queryRawUnsafe'] TemplateLiteral[expressions.length>0]",
          message:
            "$queryRawUnsafe with interpolated input is banned -- use $queryRaw with tagged-template parameters instead.",
        },
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message:
            "dangerouslySetInnerHTML is banned without explicit review -- add an eslint-disable-next-line with a reviewer's justification if this is intentional.",
        },
      ],
    },
  }
);
