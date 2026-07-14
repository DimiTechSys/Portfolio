import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["src/components/orders/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/supabase/*", "@/lib/queries/*"],
              message:
                "Import from '@/features/orders' public API or orders services/hooks, not directly from lib.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/components/tasks/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/supabase/*", "@/lib/queries/*"],
              message:
                "Import from '@/features/tasks' public API or task services/hooks, not directly from lib.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/components/prescriptions/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/supabase/*", "@/lib/queries/*"],
              message:
                "Import from '@/features/prescriptions' public API or prescription services/hooks, not directly from lib.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/components/shortages/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/supabase/*", "@/lib/queries/*"],
              message:
                "Import from '@/features/shortages' public API or shortage services/hooks, not directly from lib.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated Supabase types — maintained by `supabase gen types`, not editable by hand.
    "src/types/database.types.ts",
  ]),
]);

export default eslintConfig;
