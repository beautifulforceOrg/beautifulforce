import shared from "@storeforge/config/eslint.js";

export default [
  ...shared,
  { ignores: ["expo-env.d.ts", ".expo/**"] },
  {
    files: ["**/*.cjs"],
    languageOptions: {
      globals: { module: "writable", require: "readonly", jest: "readonly" },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["**/*.test.{ts,tsx}"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        jest: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
      },
    },
  },
];
