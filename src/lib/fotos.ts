/** Bucket público das fotos dos produtos e do logo (`schema.sql`, seção 8). */
export const BUCKET_CATALOGO = "catalogo"

export const PastasCatalogo = {
    PRODUTOS: "produtos",
    MARCA: "marca",
} as const

export type PastaCatalogo = (typeof PastasCatalogo)[keyof typeof PastasCatalogo]

/**
 * Link público de um arquivo do bucket. Montado à mão (sem o cliente do supabase-js) porque
 * vale igual no navegador e no servidor (metadata e prévia do WhatsApp).
 */
export function fotoUrl(path: string | null | undefined) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!path || !base) return null

    return `${base.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET_CATALOGO}/${path}`
}
