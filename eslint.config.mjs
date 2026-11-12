import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

export default defineConfig([
    ...nextVitals,
    ...nextTs,
    globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "supabase/**"]),
    {
        // Regra da casa: só named exports. O Next exige default nos arquivos especiais.
        files: ["src/**/*.{ts,tsx}"],
        rules: {
            "import/no-default-export": "error",
            // As fotos vêm do bucket público do Supabase (já comprimidas no envio) ou são data
            // URLs da prévia: o otimizador do next/image não ajuda.
            "@next/next/no-img-element": "off",
        },
    },
    {
        files: [
            "src/app/**/page.tsx",
            "src/app/**/layout.tsx",
            "src/app/**/not-found.tsx",
            "src/app/**/error.tsx",
            "src/app/**/global-error.tsx",
            "src/app/**/loading.tsx",
            "src/app/robots.ts",
            "src/app/sitemap.ts",
        ],
        rules: {
            "import/no-default-export": "off",
        },
    },
])
