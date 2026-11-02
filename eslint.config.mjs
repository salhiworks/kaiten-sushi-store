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
    ".next-demo/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Verbatim copy of the supplied component, kept for reference only.
    "reference/**",
  ]),
  {
    // The conveyor is integrated unchanged from the supplied source. It drives its animation
    // through refs and plain <img> tags on purpose, which these rules would flag.
    files: ["src/components/ui/sushi-conveyor-menu.tsx"],
    rules: {
      "@next/next/no-img-element": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/purity": "off",
    },
  },
]);

export default eslintConfig;
