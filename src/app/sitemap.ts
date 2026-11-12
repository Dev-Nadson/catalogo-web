import type { MetadataRoute } from "next"

import { listSlugsPublicos } from "~/server/catalogo"

/** Lido a cada pedido do buscador: produto novo entra sem novo deploy. */
export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const base = process.env.APP_URL?.replace(/\/$/, "")

    if (!base) return []

    const produtos = await listSlugsPublicos()

    return [
        { url: base, changeFrequency: "daily", priority: 1 },
        ...produtos.map((produto) => ({
            url: `${base}/produto/${produto.slug}`,
            lastModified: produto.atualizado_em,
            changeFrequency: "weekly" as const,
            priority: 0.8,
        })),
    ]
}
