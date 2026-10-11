// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "node_modules/*"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "import/no-unresolved": "off",
      "react/no-unescaped-entities": "off",
      "react/display-name": "off",
      "react-hooks/immutability": "off",
      "react-hooks/exhaustive-deps": "warn"
    }
  }
]);
