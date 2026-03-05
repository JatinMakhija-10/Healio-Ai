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
  // Block imports from the deprecated legacy chat system.
  // The primary chat system lives at src/app/dashboard/consult/.
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    ignores: ["src/components/chat/**"],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [
          {
            name: "@/components/chat/ChatInterface",
            message: "ChatInterface is deprecated. Use the conversational chat at src/app/dashboard/consult/ instead.",
          },
          {
            name: "@/components/chat/useDiagnosisChat",
            message: "useDiagnosisChat is part of the deprecated legacy chat. Use useChat from src/app/dashboard/consult/hooks/ instead.",
          },
        ],
        patterns: [
          {
            group: ["@/components/chat/*", "!@/components/chat/DiagnosisResultCard"],
            message: "Imports from src/components/chat/ are deprecated. Use src/app/dashboard/consult/ or src/lib/chat/ instead.",
          },
        ],
      }],
    },
  },
]);

export default eslintConfig;
