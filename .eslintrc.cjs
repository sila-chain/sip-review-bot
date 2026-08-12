const js = require("@eslint/js");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const { defineConfig } = require("eslint/config");
const eslintConfigPrettier = require("eslint-config-prettier/flat");

module.exports = defineConfig(
    {
        ignores: ["**/node_modules/**", "**/dist/**", ".eslintrc.cjs"],
    },

    {
        files: ["src/**/*.ts"],

        extends: [
            js.configs.recommended,
            tsPlugin.configs["flat/recommended"],
            tsPlugin.configs["flat/recommended-type-checked"],
            tsPlugin.configs["flat/strict"],
            eslintConfigPrettier,
        ],

        languageOptions: {
            parserOptions: {
                project: true,
                tsconfigRootDir: __dirname,
            },
        },

        rules: {
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                },
            ],
        },
    },

    {
        files: ["src/__tests__/**/*.ts", "src/rules/__tests__/**/*.ts"],

        rules: {
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
        },
    },

    {
        files: ["jest.config.js"],

        extends: [js.configs.recommended, eslintConfigPrettier],
    },
);
