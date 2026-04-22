import tsPlugin from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"
import { fixupPluginRules } from "@eslint/compat"
import reactPlugin from "eslint-plugin-react"
import reactHooksPlugin from "eslint-plugin-react-hooks"
import importPlugin from "eslint-plugin-import"
import jsxA11yPlugin from "eslint-plugin-jsx-a11y"
import prettierConfig from "eslint-config-prettier"

/** @type {import("eslint").Linter.Config[]} */
const config = [
  // ── Ignores ──────────────────────────────────────────────────────────
  {
    ignores: [
      "node_modules/**",
      "public/**",
      ".cache/**",
      "worker/**",
      "*.config.*",
    ],
  },

  // ── @typescript-eslint flat/recommended (ESLint 10 native) ───────────
  // Spread the 3-config array: registers plugin + recommended rules
  ...tsPlugin.configs["flat/recommended"],

  // ── Main config: all other plugins + rules ────────────────────────────
  {
    files: ["src/**/*.{ts,tsx,js,jsx}"],

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        console: "readonly",
        HTMLElement: "readonly",
        HTMLInputElement: "readonly",
        KeyboardEvent: "readonly",
        IntersectionObserver: "readonly",
        IntersectionObserverEntry: "readonly",
        MutationObserver: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        Element: "readonly",
        // Node globals
        process: "readonly",
        __dirname: "readonly",
        NodeJS: "readonly",
      },
    },

    settings: {
      react: { version: "detect" },
    },

    // All legacy plugins wrapped with fixupPluginRules for ESLint 10 compat
    plugins: {
      react: fixupPluginRules(reactPlugin),
      "react-hooks": reactHooksPlugin,
      import: fixupPluginRules(importPlugin),
      "jsx-a11y": fixupPluginRules(jsxA11yPlugin),
    },

    rules: {
      // ── TypeScript ───────────────────────────────────────────────────
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "off",

      // ── React ────────────────────────────────────────────────────────
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/jsx-key": "error",
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-no-target-blank": "error",
      "react/no-children-prop": "error",
      "react/no-danger-with-children": "error",

      // ── React Hooks ──────────────────────────────────────────────────
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // ── Import order ─────────────────────────────────────────────────
      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "never",
        },
      ],

      // ── a11y (key rules from recommended) ────────────────────────────
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/anchor-has-content": "warn",
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/heading-has-content": "warn",
      "jsx-a11y/img-redundant-alt": "warn",
      "jsx-a11y/interactive-supports-focus": "warn",
      "jsx-a11y/label-has-associated-control": "warn",
      "jsx-a11y/no-access-key": "warn",
      "jsx-a11y/no-autofocus": "warn",
      "jsx-a11y/no-distracting-elements": "error",
      "jsx-a11y/no-interactive-element-to-noninteractive-role": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "jsx-a11y/no-noninteractive-element-to-interactive-role": "warn",
      "jsx-a11y/no-redundant-roles": "warn",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
      "jsx-a11y/tabindex-no-positive": "warn",

      // ── General ──────────────────────────────────────────────────────
      "no-unused-vars": "off", // deferred to @typescript-eslint/no-unused-vars
      "no-undef": "off",       // TypeScript handles undefined references
    },
  },

  // ── Prettier: disable formatting rules (must be last) ────────────────
  prettierConfig,
]

export default config
