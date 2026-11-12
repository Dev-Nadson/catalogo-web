import type { Metadata, Viewport } from "next"

import "~/index.css"

import { APP_NAME, COR_PADRAO } from "~/lib/constants"
import { brandStyle } from "~/lib/cor"
import { fotoUrl } from "~/lib/fotos"
import { getConfiguracaoPublica } from "~/server/catalogo"

/**
 * O HTML público (vitrine, produto) é regerado a cada minuto: nome, cor e prévia acompanham a
 * configuração sem precisar de novo deploy, e o Supabase não é consultado a cada visita.
 */
export const revalidate = 60

/**
 * Nome, descrição e logo vêm da configuração da loja, lida no servidor: são eles que aparecem
 * na aba, no Google e na prévia do link no WhatsApp.
 */
export async function generateMetadata(): Promise<Metadata> {
    const configuracao = await getConfiguracaoPublica()
    const nome = configuracao?.nome ?? APP_NAME
    const descricao = configuracao?.slogan ?? `Catálogo de ${nome}: monte seu pedido e envie pelo WhatsApp.`
    const logo = fotoUrl(configuracao?.logo_path)

    return {
        metadataBase: process.env.APP_URL ? new URL(process.env.APP_URL) : undefined,
        title: {
            default: nome,
            template: `%s · ${nome}`,
        },
        description: descricao,
        icons: logo ? { icon: logo, apple: logo } : undefined,
        openGraph: {
            type: "website",
            locale: "pt_BR",
            siteName: nome,
            title: nome,
            description: descricao,
            images: logo ? [{ url: logo }] : undefined,
        },
    }
}

export async function generateViewport(): Promise<Viewport> {
    const configuracao = await getConfiguracaoPublica()

    return { themeColor: configuracao?.cor ?? COR_PADRAO }
}

type RootLayoutProps = {
    children: React.ReactNode
}

/** A cor da loja vai no `<body>` já no HTML do servidor: sem piscar a cor padrão. */
export default async function RootLayout({ children }: RootLayoutProps) {
    const configuracao = await getConfiguracaoPublica()

    return (
        <html lang="pt-BR">
            <body style={brandStyle(configuracao?.cor)}>{children}</body>
        </html>
    )
}
