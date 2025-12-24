import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Interdire console.log en production (autoriser console.error/warn pour les logs légitimes)
      "no-console": [
        "warn",
        {
          allow: ["error", "warn"], // Autoriser console.error et console.warn pour les logs de debugging/production
        },
      ],
      
      // Forcer les dependency arrays correctes pour les hooks React
      "react-hooks/exhaustive-deps": "error", // Déjà activé par nextTs, mais on le confirme explicitement
      "react-hooks/rules-of-hooks": "error", // Déjà activé par nextTs, mais on le confirme explicitement
      
      // Bonnes pratiques TypeScript
      "@typescript-eslint/no-explicit-any": "warn", // Avertir sur l'utilisation de 'any'
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_", // Ignorer les variables commençant par _
          varsIgnorePattern: "^_",
        },
      ],
      
      // Sécurité
      "no-eval": "error", // Interdire eval()
      "no-implied-eval": "error", // Interdire setTimeout/setInterval avec strings
      "no-script-url": "error", // Interdire javascript: URLs
      
      // Qualité du code
      "prefer-const": "error", // Forcer const quand la variable n'est pas réassignée
      "no-var": "error", // Interdire var (utiliser let/const)
      "object-shorthand": "warn", // Préférer { foo } au lieu de { foo: foo }
    },
  },
]);

export default eslintConfig;
