import shared from "@storeforge/config/eslint.js";

export default [
  ...shared,
  {
    files: ["**/*.cjs"],
    languageOptions: {
      globals: { module: "writable", require: "readonly" },
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
