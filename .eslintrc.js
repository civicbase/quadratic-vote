module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      ecmaFeatures: {
        jsx: true,
      },
    },
    plugins: ["react", "react-hooks", "@typescript-eslint", "import", "prettier"],
    extends: [
      "eslint:recommended",
      "plugin:react/recommended",
      "plugin:react-hooks/recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:import/errors",
      "plugin:import/warnings",
      "prettier",
    ],
    rules: {
      "prettier/prettier": "error",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      // Additional rules and overrides can be added here
    },
    settings: {
      react: {
        version: "detect",
      },
      "import/resolver": {
        typescript: {}, // This loads <rootdir>/tsconfig.json to eslint
      },
    },
  };
  