import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import eslintPluginComments from "eslint-plugin-eslint-comments";
import eslintPluginExtendNative from "eslint-plugin-no-use-extend-native";
import eslintPluginImport from "eslint-plugin-import";
import eslintPluginReact from "eslint-plugin-react";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import eslintPluginUnicorn from "eslint-plugin-unicorn";

export default [
    {
        ignores: ["**/dist/**", "**/node_modules/**", "apps/web/src/routeTree.gen.ts"],
    },
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: "module",
                projectService: true,
            },
        },
        plugins: {
            "@typescript-eslint": tseslint,
            "import": eslintPluginImport,
            "unicorn": eslintPluginUnicorn,
            "eslint-comments": eslintPluginComments,
            "no-use-extend-native": eslintPluginExtendNative,
        },
        rules: {
            ...tseslint.configs.recommended.rules,
            "@typescript-eslint/array-type": "off",
            "@typescript-eslint/consistent-indexed-object-style": "off",
            "@typescript-eslint/naming-convention": "off",
            "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-inferrable-types": "error",
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
            "@typescript-eslint/prefer-as-const": "error",
            "@typescript-eslint/prefer-for-of": "error",
            "@typescript-eslint/prefer-function-type": "error",
            "@typescript-eslint/prefer-includes": "error",
            "@typescript-eslint/prefer-nullish-coalescing": "error",
            "@typescript-eslint/prefer-optional-chain": "error",
            "@typescript-eslint/prefer-readonly": "error",
            "@typescript-eslint/prefer-reduce-type-parameter": "error",
            "@typescript-eslint/prefer-string-starts-ends-with": "error",
            "@typescript-eslint/prefer-ts-expect-error": "error",
            "@typescript-eslint/promise-function-async": "error",
            "@typescript-eslint/restrict-template-expressions": "off",
            "curly": ["error", "all"],
            "complexity": ["warn", { max: 25 }],
            "eqeqeq": ["error", "always", { null: "ignore" }],
            "eslint-comments/disable-enable-pair": ["error", { allowWholeFile: true }],
            "eslint-comments/no-aggregating-enable": "error",
            "import/first": "error",
            "import/newline-after-import": "error",
            "import/no-anonymous-default-export": "error",
            "import/no-cycle": ["error", { ignoreExternal: true }],
            "import/no-duplicates": "error",
            "import/no-useless-path-segments": "error",
            "no-alert": "error",
            "no-await-in-loop": "off",
            "no-else-return": ["error", { allowElseIf: false }],
            "no-empty": ["error", { allowEmptyCatch: true }],
            "no-implicit-coercion": ["error", { boolean: false }],
            "no-lonely-if": "error",
            "no-negated-condition": "error",
            "no-restricted-imports": ["error", {
                patterns: [{
                    group: ["*/index", "*/index.ts", "*/index.tsx"],
                    message: "No barrel imports — import from source.",
                }],
            }],
            "no-unneeded-ternary": "error",
            "no-unused-vars": "off",
            "no-use-extend-native/no-use-extend-native": "error",
            "object-shorthand": ["error", "always"],
            "prefer-arrow-callback": "error",
            "prefer-const": ["error", { destructuring: "all", ignoreReadBeforeAssign: false }],
            "prefer-template": "error",
            "yoda": "error",
            "unicorn/better-regex": ["error", { sortCharacterClasses: false }],
            "unicorn/consistent-destructuring": "off",
            "unicorn/consistent-function-scoping": "error",
            "unicorn/expiring-todo-comments": "off",
            "unicorn/filename-case": "off",
            "unicorn/import-style": "off",
            "unicorn/no-nested-ternary": "off",
            "unicorn/no-null": "off",
            "unicorn/no-thenable": "off",
            "unicorn/no-useless-undefined": "off",
            "unicorn/prefer-ternary": ["error", "only-single-line"],
            "unicorn/prevent-abbreviations": "off",
        },
    },
    {
        files: ["**/*.tsx"],
        plugins: {
            "react": eslintPluginReact,
            "react-hooks": eslintPluginReactHooks,
        },
        settings: {
            react: { version: "19.2" },
        },
        rules: {
            "react/react-in-jsx-scope": "off",
            "react-hooks/exhaustive-deps": "error",
            "react/boolean-prop-naming": "off",
            "react/jsx-boolean-value": ["error", "never"],
            "react/jsx-curly-brace-presence": ["error", { props: "never", children: "never" }],
            "react/jsx-no-useless-fragment": ["error", { allowExpressions: true }],
            "react/jsx-sort-props": ["error", {
                callbacksLast: true,
                shorthandFirst: true,
                multiline: "last",
                noSortAlphabetically: true,
            }],
            "react/self-closing-comp": "error",
        },
    },
];
