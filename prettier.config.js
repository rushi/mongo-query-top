export default {
    semi: true,
    printWidth: 120,
    trailingComma: "all",
    singleQuote: false,
    bracketSpacing: true,
    useTabs: false,
    arrowParens: "always",
    tabWidth: 4,
    importOrder: ["^[./]", "^@/(.*)$"],
    "tailwindStylesheet": "apps/web/src/styles.css",
    "tailwindFunctions": [
        "cn",
        "clsx",
        "cva"
    ],
    "plugins": [
        "@ianvs/prettier-plugin-sort-imports",
        "prettier-plugin-tailwindcss"
    ]
};
