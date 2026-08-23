import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["docs/js/**/*.mjs", "test/**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        globalThis: "readonly",
        crypto: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        document: "readonly",
        window: "readonly",
        addEventListener: "readonly",
        setTimeout: "readonly",
        ImageData: "readonly",
        console: "readonly",
        Buffer: "readonly",
        Uint8Array: "readonly",
        Uint8ClampedArray: "readonly",
        Map: "readonly",
        Set: "readonly",
        Promise: "readonly",
        Error: "readonly",
        URLSearchParams: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
    },
  },
  { ignores: ["node_modules/", "docs/diagrams/", "reviews/", "scripts/"] },
];
