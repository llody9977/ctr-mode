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
        URL: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
      // Escaping is the default only if nothing can quietly opt out of it. These
      // two rules make that structural rather than a convention reviewers uphold:
      // markup must be built by the `html` tagged template, whose interpolations
      // escape unless explicitly wrapped in raw().
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "AssignmentExpression[left.property.name='innerHTML'][right.type='TemplateLiteral']",
          message:
            "Assign innerHTML only from the html`` tagged template (docs/js/html.mjs), never from a bare template literal — a bare literal interpolates unescaped.",
        },
        {
          selector:
            "AssignmentExpression[left.property.name='innerHTML'][right.type='BinaryExpression'][right.operator='+'] TemplateLiteral:not(TaggedTemplateExpression > TemplateLiteral)",
          message:
            "Concatenated markup must use the html`` tagged template for every fragment (docs/js/html.mjs); an untagged fragment interpolates unescaped.",
        },
      ],
    },
  },
  { ignores: ["node_modules/", "docs/diagrams/", "reviews/", "scripts/"] },
];
