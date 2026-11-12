import type { FormaPagamento } from "~/lib/constants"
import { assertAffected, throwIfError } from "~/lib/errors"
import { PastasCatalogo } from "~/lib/fotos"
import { supabase } from "~/lib/supabase"
import type { Database } from "~/typings/database"
import { removeFiles, uploadImage } from "~/services/storage"

export type Configuracao = Database["public"]["Tables"]["configuracoes"]["Row"]

export const CONFIGURACAO_SELECT =
    "id, nome, slogan, logo_path, cor, cor_escura, whatsapp, instagram, endereco, horario, aberta, aviso, aceita_entrega, aceita_retirada, taxa_entrega, frete_gratis_acima, pedido_minimo, formas_pagamento, chave_pix, atualizado_em"

export type GetConfiguracaoOutput = Configuracao

/** Pública: o site inteiro lê (nome, cor, WhatsApp, regras de entrega). */
export async function getConfiguracao(): Promise<GetConfiguracaoOutput> {
    const { data, error } = await supabase
        .from("configuracoes")
        .select(CONFIGURACAO_SELECT)
        .eq("id", 1)
        .single()

    throwIfError(error)

    return data!
}

type UpdateLojaInput = {
    nome: string
    slogan: string | null
    cor: string
    corEscura: string
    whatsapp: string | null
    instagram: string | null
    endereco: string | null
    horario: string | null
    aviso: string | null
    /** `Blob` = novo logo; `null` = remover; `undefined` = manter. */
    logo: Blob | null | undefined
    logoPathAtual: string | null
}

/** O logo novo sobe antes; o antigo só sai depois que a linha foi salva. */
export async function updateLoja({ logo, logoPathAtual, corEscura, ...input }: UpdateLojaInput): Promise<void> {
    const novoPath = logo ? await uploadImage({ folder: PastasCatalogo.MARCA, blob: logo }) : null

    try {
        const { data, error } = await supabase
            .from("configuracoes")
            .update({
                ...input,
                cor_escura: corEscura,
                ...(logo !== undefined && { logo_path: novoPath }),
            })
            .eq("id", 1)
            .select("id")

        throwIfError(error)
        assertAffected(data)
    } catch (error) {
        await removeFiles({ paths: [novoPath] })
        throw error
    }

    if (logo !== undefined) await removeFiles({ paths: [logoPathAtual] })
}

type UpdateEntregaPagamentoInput = {
    aceitaEntrega: boolean
    aceitaRetirada: boolean
    taxaEntrega: number
    freteGratisAcima: number | null
    pedidoMinimo: number
    formasPagamento: FormaPagamento[]
    chavePix: string | null
}

export async function updateEntregaPagamento(input: UpdateEntregaPagamentoInput): Promise<void> {
    const { data, error } = await supabase
        .from("configuracoes")
        .update({
            aceita_entrega: input.aceitaEntrega,
            aceita_retirada: input.aceitaRetirada,
            taxa_entrega: input.taxaEntrega,
            frete_gratis_acima: input.freteGratisAcima,
            pedido_minimo: input.pedidoMinimo,
            formas_pagamento: input.formasPagamento,
            chave_pix: input.chavePix,
        })
        .eq("id", 1)
        .select("id")

    throwIfError(error)
    assertAffected(data)
}

type UpdateLojaAbertaInput = {
    aberta: boolean
}

/** Fechada, o site continua no ar, mas o `pedidos_criar` recusa pedido novo. */
export async function updateLojaAberta({ aberta }: UpdateLojaAbertaInput): Promise<void> {
    const { data, error } = await supabase.from("configuracoes").update({ aberta }).eq("id", 1).select("id")

    throwIfError(error)
    assertAffected(data)
}
