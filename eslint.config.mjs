import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      ".claude/**",
      ".codex/**",
      ".astro/**",
      ".worktrees/**",
      "astro.config.mjs",
      "dist/**",
      "eslint.config.js",
      "eslint.config.mjs",
      "node_modules/**",
      "plans/**",
      "tasks/**",
      "vitest.config.ts"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error"
    }
  }
);
