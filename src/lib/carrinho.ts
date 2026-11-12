import { ESTOQUE_BAIXO, TiposEntrega, type TipoEntrega } from "~/lib/constants"

/** O mínimo de uma variação que as regras abaixo precisam. */
export type VariacaoPreco = {
    rotulo: string
    preco: number
    preco_de: number | null
    estoque: number | null
}

/** `null` = sem controle de estoque: sempre disponível. */
export function isVariacaoDisponivel(variacao: Pick<VariacaoPreco, "estoque">) {
    return variacao.estoque === null || variacao.estoque > 0
}

/** Sem variação ativa ou com todas zeradas. */
export function isEsgotado(variacoes: Pick<VariacaoPreco, "estoque">[]) {
    return !variacoes.some(isVariacaoDisponivel)
}

/** "Restam 2": só quando acabando, para não expor o estoque inteiro. */
export function isEstoqueBaixo(estoque: number | null) {
    return estoque !== null && estoque > 0 && estoque <= ESTOQUE_BAIXO
}

/** Produto de variação única (rótulo vazio) não mostra o seletor. */
export function temEscolha(variacoes: Pick<VariacaoPreco, "rotulo">[]) {
    return variacoes.length > 1 || (variacoes[0]?.rotulo ?? "") !== ""
}

/**
 * O "a partir de" do card: a variação disponível mais barata (ou a mais barata de todas, se
 * o produto esgotou), com o preço "de" dela.
 */
export function precoVitrine(variacoes: VariacaoPreco[]) {
    const disponiveis = variacoes.filter(isVariacaoDisponivel)
    const base = disponiveis.length ? disponiveis : variacoes

    if (!base.length) return null

    const maisBarata = base.reduce((menor, atual) => (atual.preco < menor.preco ? atual : menor))
    const variaPreco = base.some((variacao) => variacao.preco !== maisBarata.preco)

    return { preco: maisBarata.preco, precoDe: maisBarata.preco_de, aPartirDe: variaPreco }
}

export type RegrasEntrega = {
    taxa_entrega: number
    frete_gratis_acima: number | null
    pedido_minimo: number
}

/**
 * Prévia do que o `pedidos_criar` (schema.sql) vai cobrar. Quem decide é o banco: mudou a
 * regra lá, muda aqui, senão o cliente vê um total e recebe outro.
 */
export function resumoCarrinho(subtotal: number, tipoEntrega: TipoEntrega | null, regras: RegrasEntrega) {
    const freteGratis = regras.frete_gratis_acima !== null && subtotal >= regras.frete_gratis_acima
    const taxa = tipoEntrega === TiposEntrega.ENTREGA && !freteGratis ? regras.taxa_entrega : 0

    return {
        subtotal,
        taxa,
        total: subtotal + taxa,
        freteGratis,
        faltaParaMinimo: Math.max(0, regras.pedido_minimo - subtotal),
        faltaParaFreteGratis:
            regras.frete_gratis_acima !== null && regras.taxa_entrega > 0 && !freteGratis
                ? regras.frete_gratis_acima - subtotal
                : null,
    }
}
