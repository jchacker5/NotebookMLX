import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import jsxA11Y from "eslint-plugin-jsx-a11y";
import _import from "eslint-plugin-import";
import prettier from "eslint-plugin-prettier";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [
  {
    ignores: [
      "**/dist/",
      "**/build/",
      "**/node_modules/",
      "**/*.config.js",
      "**/*.config.ts",
      "**/vite.config.ts",
      "**/tailwind.config.js",
      "**/postcss.config.js",
    ]
  },
  js.configs.recommended,
  ...fixupConfigRules(compat.extends(
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier",
  )),
  {
    files: ["**/*.ts", "**/*.tsx"],

    plugins: {
        react: fixupPluginRules(react),
        "react-hooks": fixupPluginRules(reactHooks),
        "@typescript-eslint": typescriptEslint,
        "jsx-a11y": fixupPluginRules(jsxA11Y),
        import: fixupPluginRules(_import),
        prettier,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
        },

        parser: tsParser,
        ecmaVersion: "latest",
        sourceType: "module",

        parserOptions: {
            ecmaFeatures: {
                jsx: true,
            },

            project: ["./tsconfig.json", "./tsconfig.node.json"],
        },
    },

    settings: {
        react: {
            version: "detect",
        },

        "import/resolver": {
            typescript: {
                alwaysTryTypes: true,
                project: "./tsconfig.json",
            },

            node: {
                extensions: [".js", ".jsx", ".ts", ".tsx"],
            },
        },
    },

    rules: {
        // TypeScript recommended rules (manually specified for flat config)
        "@typescript-eslint/no-unused-vars": ["error", {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
        }],
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-non-null-assertion": "warn",
        "@typescript-eslint/consistent-type-imports": ["error", {
            prefer: "type-imports",
        }],
        "@typescript-eslint/no-unnecessary-type-assertion": "error",
        "@typescript-eslint/prefer-nullish-coalescing": "error",
        "@typescript-eslint/prefer-optional-chain": "error",
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-misused-promises": "error",
        "@typescript-eslint/await-thenable": "error",

        // React specific rules
        "react/react-in-jsx-scope": "off",
        "react/prop-types": "off",
        "react/jsx-uses-react": "off",
        "react/jsx-uses-vars": "error",
        "react/jsx-key": "error",
        "react/jsx-no-duplicate-props": "error",
        "react/jsx-no-undef": "error",
        "react/no-unescaped-entities": "warn",
        "react/display-name": "warn",
        "react/jsx-pascal-case": "error",
        "react/jsx-curly-brace-presence": ["error", {
            props: "never",
            children: "never",
        }],
        "react/self-closing-comp": "error",
        "react/jsx-boolean-value": ["error", "never"],

        // React Hooks rules
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",

        // Import/Export rules
        "import/order": ["error", {
            groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
            "newlines-between": "always",
            alphabetize: {
                order: "asc",
                caseInsensitive: true,
            },
        }],
        "import/no-unresolved": "error",
        "import/no-cycle": "error",
        "import/no-self-import": "error",
        "import/no-useless-path-segments": "error",
        "import/newline-after-import": "error",
        "import/no-duplicates": "error",

        // Accessibility rules
        "jsx-a11y/alt-text": "error",
        "jsx-a11y/aria-props": "error",
        "jsx-a11y/aria-proptypes": "error",
        "jsx-a11y/aria-unsupported-elements": "error",
        "jsx-a11y/role-has-required-aria-props": "error",
        "jsx-a11y/role-supports-aria-props": "error",
        "jsx-a11y/click-events-have-key-events": "warn",
        "jsx-a11y/no-static-element-interactions": "warn",

        // General code quality rules
        "no-console": ["warn", {
            allow: ["warn", "error"],
        }],
        "no-debugger": "error",
        "no-alert": "error",
        "no-var": "error",
        "prefer-const": "error",
        "no-duplicate-imports": "error",
        "no-unused-expressions": "error",
        "no-unreachable": "error",
        "no-empty-function": "warn",
        curly: ["error", "all"],
        eqeqeq: ["error", "always"],
        "no-eval": "error",
        "no-implied-eval": "error",
        "no-new-func": "error",
        "no-new-wrappers": "error",
        "no-return-await": "error",
        "prefer-promise-reject-errors": "error",

        // Styling
        "max-len": ["warn", {
            code: 100,
            ignoreUrls: true,
            ignoreStrings: true,
            ignoreTemplateLiterals: true,
            ignoreComments: true,
        }],
        complexity: ["warn", 15],
        "max-depth": ["warn", 4],
        "max-params": ["warn", 5],
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],

    languageOptions: {
        globals: {
            ...globals.jest,
        },
    },

    rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  {
    files: ["**/*.config.ts", "**/*.config.js"],

    rules: {
        "import/no-default-export": "off",
    },
  }
];
