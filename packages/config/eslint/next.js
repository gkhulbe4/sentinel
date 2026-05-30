import globals from "globals";
import nextPlugin from "@next/eslint-plugin-next";
import base from "./base.js";

/** Base config plus browser globals and Next.js recommended rules. */
export default [
  ...base,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "@next/next": nextPlugin },
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
];
