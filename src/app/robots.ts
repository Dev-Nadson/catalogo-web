import type { MetadataRoute } from "next"

/** A vitrine e os produtos vão para buscadores; painel, conta e checkout, não. */
export default function robots(): MetadataRoute.Robots {
    const base = process.env.APP_URL?.replace(/\/$/, "")

    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/painel", "/conta", "/finalizar", "/entrar", "/cadastrar", "/recuperar-senha", "/redefinir-senha"],
        },
        sitemap: base ? `${base}/sitemap.xml` : undefined,
    }
}
