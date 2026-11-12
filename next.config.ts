import path from "node:path"
import type { NextConfig } from "next"

/** Nada de iframe nem sniffing. O HSTS fica por conta da Vercel. */
const SECURITY_HEADERS = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
]

const nextConfig: NextConfig = {
    /**
     * Desligado de propósito: o dado vem do navegador (React Query + RLS), então o shell
     * estático não ganha nada, e o `<Activity>` do Cache Components manteria montados os
     * formulários e diálogos entre navegações (o checkout voltaria com os dados do pedido
     * anterior). Rever quando o Next tornar obrigatório.
     */
    cacheComponents: false,
    poweredByHeader: false,
    turbopack: {
        // A pasta do app é a raiz, mesmo que haja outro package-lock.json acima dela.
        root: path.resolve(__dirname),
        rules: {
            "*.css": {
                loaders: ["@tailwindcss/turbopack"],
                as: "*.css",
            },
        },
    },
    async headers() {
        return [{ source: "/:path*", headers: SECURITY_HEADERS }]
    },
}

export default nextConfig
