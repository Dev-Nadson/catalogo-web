import "server-only"

import { cache } from "react"
import { createClient } from "@supabase/supabase-js"

import type { Database } from "~/typings/database"
import type { Configuracao } from "~/services/configuracoes"

/**
 * Leituras públicas feitas no servidor, com a chave anônima e sem sessão (o RLS de `anon`):
 * só para o que precisa estar no HTML antes do JavaScript, ou seja, título, descrição e a
 * prévia (Open Graph) que o WhatsApp monta ao colar o link, mais a cor da marca e o
 * sitemap. O resto do app lê do navegador, com React Query.
 *
 * Erro aqui nunca derruba a página: sem dado, a metadata cai no padrão.
 */
function createAnonClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    if (!url || !key) return null

    return createClient<Database>(url, key, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
}

const CONFIGURACAO_SELECT =
    "id, nome, slogan, logo_path, cor, cor_escura, whatsapp, instagram, endereco, horario, aberta, aviso, aceita_entrega, aceita_retirada, taxa_entrega, frete_gratis_acima, pedido_minimo, formas_pagamento, chave_pix, atualizado_em"

/** Uma leitura por requisição, mesmo chamada pelo layout e pela metadata. */
export const getConfiguracaoPublica = cache(async (): Promise<Configuracao | null> => {
    const supabase = createAnonClient()

    if (!supabase) return null

    const { data, error } = await supabase.from("configuracoes").select(CONFIGURACAO_SELECT).eq("id", 1).maybeSingle()

    if (error) console.error("Falha ao ler a configuração da loja:", error.message)

    return data
})

export type ProdutoPublico = {
    nome: string
    descricao: string | null
    fotos: string[]
}

export const getProdutoPublico = cache(async (slug: string): Promise<ProdutoPublico | null> => {
    const supabase = createAnonClient()

    if (!supabase) return null

    const { data, error } = await supabase
        .from("produtos")
        .select("nome, descricao, fotos")
        .eq("slug", slug)
        .eq("ativo", true)
        .maybeSingle()

    if (error) console.error("Falha ao ler o produto:", error.message)

    return data
})

export type SlugPublico = {
    slug: string
    atualizado_em: string
}

export async function listSlugsPublicos(): Promise<SlugPublico[]> {
    const supabase = createAnonClient()

    if (!supabase) return []

    const { data, error } = await supabase
        .from("produtos")
        .select("slug, atualizado_em")
        .eq("ativo", true)
        .order("atualizado_em", { ascending: false })
        .limit(5000)

    if (error) console.error("Falha ao listar os produtos do sitemap:", error.message)

    return data ?? []
}
