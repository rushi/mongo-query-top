export default {
    semi: true,
    printWidth: 120,
    trailingComma: "all",
    singleQuote: false,
    bracketSpacing: true,
    useTabs: false,
    arrowParens: "always",
    tabWidth: 4,
    plugins: ["@ianvs/prettier-plugin-sort-imports"],
    importOrder: ["^[./]", "^@/(.*)$"],
};
