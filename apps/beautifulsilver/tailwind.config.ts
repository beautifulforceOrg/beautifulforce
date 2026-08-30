import type { Config } from "tailwindcss";
import preset from "@storeforge/config/tailwind.preset.js";

const config: Config = {
  presets: [preset],
  content: ["./app/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
};

export default config;
