import { PAGE_SIZE, ProdutoFiltroStatuses, type ProdutoFiltroStatus } from "~/lib/constants"
import { ApiError, assertAffected, throwIfError } from "~/lib/errors"
import { PastasCatalogo } from "~/lib/fotos"
import { supabase } from "~/lib/supabase"
import { sanitizeSearch } from "~/lib/utils"
import type { PaginatedResponse } from "~/typings"
import type { Database } from "~/typings/database"
import { removeFiles, uploadImage } from "~/services/storage"

export type Produto = Database["public"]["Tables"]["produtos"]["Row"]
export type Variacao = Database["public"]["Tables"]["produto_variacoes"]["Row"]

export type VariacaoCatalogo = Pick<Variacao, "id" | "rotulo" | "preco" | "preco_de" | "estoque" | "ordem">

export type ProdutoCatalogo = Pick<
    Produto,
    "id" | "nome" | "slug" | "descricao" | "fotos" | "rotulo_variacao" | "destaque" | "ordem" | "categoria_id"
> & {
    /** Só as ativas, na ordem do admin. */
    variacoes: VariacaoCatalogo[]
}

const CATALOGO_SELECT =
    "id, nome, slug, descricao, fotos, rotulo_variacao, destaque, ordem, categoria_id, produto_variacoes(id, rotulo, preco, preco_de, estoque, ordem)"

type ProdutoCatalogoRow = Omit<ProdutoCatalogo, "variacoes"> & {
    produto_variacoes: VariacaoCatalogo[]
}

function toProdutoCatalogo({ produto_variacoes, ...produto }: ProdutoCatalogoRow): ProdutoCatalogo {
    return { ...produto, variacoes: [...produto_variacoes].sort((a, b) => a.ordem - b.ordem) }
}

export type ListCatalogoOutput = ProdutoCatalogo[]

/**
 * A vitrine inteira de uma vez: busca e filtro de categoria rodam no navegador, na hora. Os
 * filtros de `ativo` repetem o RLS de propósito: para o admin, o RLS libera também os
 * inativos. Produto sem variação ativa não tem o que vender e fica de fora.
 */
export async function listCatalogo(): Promise<ListCatalogoOutput> {
    const { data, error } = await supabase
        .from("produtos")
        .select(CATALOGO_SELECT)
        .eq("ativo", true)
        .eq("produto_variacoes.ativo", true)
        .order("destaque", { ascending: false })
        .order("ordem")
        .order("nome")
        .limit(500)

    throwIfError(error)

    return (data ?? [])
        .map((row) => toProdutoCatalogo(row as ProdutoCatalogoRow))
        .filter((produto) => produto.variacoes.length > 0)
}

type GetProdutoBySlugInput = {
    slug: string
}

export type GetProdutoBySlugOutput = ProdutoCatalogo

export async function getProdutoBySlug({ slug }: GetProdutoBySlugInput): Promise<GetProdutoBySlugOutput> {
    const { data, error } = await supabase
        .from("produtos")
        .select(CATALOGO_SELECT)
        .eq("slug", slug)
        .eq("ativo", true)
        .eq("produto_variacoes.ativo", true)
        .maybeSingle()

    throwIfError(error)

    const produto = data ? toProdutoCatalogo(data as ProdutoCatalogoRow) : null

    if (!produto?.variacoes.length) throw new ApiError("Produto não encontrado.", { status: 404 })

    return produto
}

export type VariacaoCarrinho = VariacaoCatalogo & {
    produto: Pick<Produto, "id" | "nome" | "slug" | "fotos">
}

type VariacaoCarrinhoRow = VariacaoCatalogo & {
    ativo: boolean
    produtos: Pick<Produto, "id" | "nome" | "slug" | "fotos" | "ativo"> | null
}

type ListVariacoesCarrinhoInput = {
    ids: string[]
}

export type ListVariacoesCarrinhoOutput = VariacaoCarrinho[]

/**
 * Preço, nome e estoque do que está no carrinho, sempre do banco: o carrinho guarda só
 * `variacaoId` e quantidade. Variação que saiu do ar não volta (o carrinho a remove).
 */
export async function listVariacoesCarrinho({ ids }: ListVariacoesCarrinhoInput): Promise<ListVariacoesCarrinhoOutput> {
    if (!ids.length) return []

    const { data, error } = await supabase
        .from("produto_variacoes")
        .select("id, rotulo, preco, preco_de, estoque, ordem, ativo, produtos(id, nome, slug, fotos, ativo)")
        .in("id", ids)

    throwIfError(error)

    return ((data ?? []) as VariacaoCarrinhoRow[])
        .filter((row) => row.ativo && row.produtos?.ativo)
        .map(({ produtos, ...variacao }) => ({
            id: variacao.id,
            rotulo: variacao.rotulo,
            preco: variacao.preco,
            preco_de: variacao.preco_de,
            estoque: variacao.estoque,
            ordem: variacao.ordem,
            produto: { id: produtos!.id, nome: produtos!.nome, slug: produtos!.slug, fotos: produtos!.fotos },
        }))
}

// ------------------------------------------------------------------ painel (admin)

export type ProdutoResumo = Pick<Produto, "id" | "nome" | "slug" | "fotos" | "ativo" | "destaque" | "categoria_id"> & {
    categoria: string | null
    variacoes: Pick<Variacao, "id" | "preco" | "estoque" | "ativo">[]
}

type ProdutoResumoRow = Omit<ProdutoResumo, "categoria" | "variacoes"> & {
    categorias: { nome: string } | null
    produto_variacoes: Pick<Variacao, "id" | "preco" | "estoque" | "ativo">[]
}

type ListProdutosInput = {
    page: number
    search: string
    categoriaId: string | null
    status: ProdutoFiltroStatus
}

export type ListProdutosOutput = PaginatedResponse<ProdutoResumo>

export async function listProdutos({ page, search, categoriaId, status }: ListProdutosInput): Promise<ListProdutosOutput> {
    const from = (page - 1) * PAGE_SIZE
    const term = sanitizeSearch(search)

    let query = supabase
        .from("produtos")
        .select(
            "id, nome, slug, fotos, ativo, destaque, categoria_id, categorias(nome), produto_variacoes(id, preco, estoque, ativo)",
            { count: "exact" }
        )
        .order("ativo", { ascending: false })
        .order("ordem")
        .order("nome")
        .range(from, from + PAGE_SIZE - 1)

    if (term) query = query.ilike("nome", `%${term}%`)
    if (categoriaId) query = query.eq("categoria_id", categoriaId)
    if (status === ProdutoFiltroStatuses.ATIVOS) query = query.eq("ativo", true)
    if (status === ProdutoFiltroStatuses.INATIVOS) query = query.eq("ativo", false)

    const { data, count, error } = await query

    throwIfError(error)

    const total = count ?? 0

    return {
        data: ((data ?? []) as ProdutoResumoRow[]).map(({ categorias, produto_variacoes, ...produto }) => ({
            ...produto,
            categoria: categorias?.nome ?? null,
            variacoes: produto_variacoes,
        })),
        total,
        page,
        total_pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    }
}

export type ProdutoCompleto = Produto & {
    variacoes: Variacao[]
}

type GetProdutoInput = {
    produtoId: string
}

export type GetProdutoOutput = ProdutoCompleto

export async function getProduto({ produtoId }: GetProdutoInput): Promise<GetProdutoOutput> {
    const { data, error } = await supabase
        .from("produtos")
        .select(
            "id, categoria_id, nome, slug, descricao, fotos, rotulo_variacao, destaque, ativo, ordem, criado_em, atualizado_em, produto_variacoes(id, produto_id, rotulo, preco, preco_de, estoque, ativo, ordem)"
        )
        .eq("id", produtoId)
        .single()

    throwIfError(error)

    const { produto_variacoes, ...produto } = data as Produto & { produto_variacoes: Variacao[] }

    return { ...produto, variacoes: [...produto_variacoes].sort((a, b) => a.ordem - b.ordem) }
}

/** Foto já no bucket (`path`) ou nova, ainda no navegador (`blob`). A ordem é a da tela. */
export type FotoInput = { path: string } | { blob: Blob }

export type VariacaoInput = {
    /** Sem id, a variação é nova. */
    id?: string
    rotulo: string
    preco: number
    precoDe: number | null
    estoque: number | null
    ativo: boolean
}

type ProdutoDadosInput = {
    nome: string
    slug: string
    categoriaId: string | null
    descricao: string | null
    rotuloVariacao: string | null
    destaque: boolean
    ativo: boolean
    ordem: number
    fotos: FotoInput[]
    variacoes: VariacaoInput[]
}

async function uploadFotos(fotos: FotoInput[]) {
    const enviadas: string[] = []

    try {
        const paths: string[] = []

        for (const foto of fotos) {
            if ("path" in foto) {
                paths.push(foto.path)
                continue
            }

            const path = await uploadImage({ folder: PastasCatalogo.PRODUTOS, blob: foto.blob })

            enviadas.push(path)
            paths.push(path)
        }

        return { paths, enviadas }
    } catch (error) {
        await removeFiles({ paths: enviadas })
        throw error
    }
}

function toProdutoRow(input: ProdutoDadosInput, fotos: string[]) {
    return {
        nome: input.nome,
        slug: input.slug,
        categoria_id: input.categoriaId,
        descricao: input.descricao,
        rotulo_variacao: input.rotuloVariacao,
        destaque: input.destaque,
        ativo: input.ativo,
        ordem: input.ordem,
        fotos,
    }
}

function toVariacaoRows(produtoId: string, variacoes: VariacaoInput[]) {
    return variacoes.map((variacao, index) => ({
        // Id gerado aqui para que novas e existentes vão no mesmo upsert.
        id: variacao.id ?? crypto.randomUUID(),
        produto_id: produtoId,
        rotulo: variacao.rotulo,
        preco: variacao.preco,
        preco_de: variacao.precoDe,
        estoque: variacao.estoque,
        ativo: variacao.ativo,
        ordem: index,
    }))
}

export type CreateProdutoOutput = Pick<Produto, "id" | "nome">

/**
 * Fotos sobem antes; produto e variações vão em seguida. Se as variações falharem, o produto
 * recém-criado é apagado junto com as fotos, para não sobrar produto sem preço.
 */
export async function createProduto(input: ProdutoDadosInput): Promise<CreateProdutoOutput> {
    const { paths, enviadas } = await uploadFotos(input.fotos)
    let produtoId: string | null = null

    try {
        const { data, error } = await supabase
            .from("produtos")
            .insert(toProdutoRow(input, paths))
            .select("id, nome")
            .single()

        throwIfError(error)
        produtoId = data!.id

        const { error: variacoesError } = await supabase
            .from("produto_variacoes")
            .insert(toVariacaoRows(produtoId, input.variacoes))
            .select("id")

        throwIfError(variacoesError)

        return data!
    } catch (error) {
        if (produtoId) await supabase.from("produtos").delete().eq("id", produtoId)
        await removeFiles({ paths: enviadas })
        throw error
    }
}

type UpdateProdutoInput = ProdutoDadosInput & {
    produtoId: string
    /** Como estava antes de editar: o que saiu da lista é apagado do bucket no fim. */
    fotosAtuais: string[]
    variacoesAtuais: string[]
}

/**
 * Fotos novas sobem antes e saem se o produto não salvar; as que foram tiradas só saem do
 * bucket depois de tudo salvo. Variação tirada da lista é apagada: os pedidos guardam cópia
 * do nome e do preço, então nada se perde.
 */
export async function updateProduto({
    produtoId,
    fotosAtuais,
    variacoesAtuais,
    ...input
}: UpdateProdutoInput): Promise<void> {
    const { paths, enviadas } = await uploadFotos(input.fotos)

    try {
        const { data, error } = await supabase
            .from("produtos")
            .update(toProdutoRow(input, paths))
            .eq("id", produtoId)
            .select("id")

        throwIfError(error)
        assertAffected(data)
    } catch (error) {
        await removeFiles({ paths: enviadas })
        throw error
    }

    const rows = toVariacaoRows(produtoId, input.variacoes)
    const { error: upsertError } = await supabase.from("produto_variacoes").upsert(rows).select("id")

    throwIfError(upsertError)

    const removidas = variacoesAtuais.filter((id) => !rows.some((row) => row.id === id))

    if (removidas.length) {
        const { error: deleteError } = await supabase.from("produto_variacoes").delete().in("id", removidas)

        throwIfError(deleteError)
    }

    await removeFiles({ paths: fotosAtuais.filter((path) => !paths.includes(path)) })
}

type UpdateProdutoAtivoInput = {
    produtoId: string
    ativo: boolean
}

/** Tirar do ar sem apagar: some da vitrine, mas continua no painel. */
export async function updateProdutoAtivo({ produtoId, ativo }: UpdateProdutoAtivoInput): Promise<void> {
    const { data, error } = await supabase.from("produtos").update({ ativo }).eq("id", produtoId).select("id")

    throwIfError(error)
    assertAffected(data)
}

type DeleteProdutoInput = {
    produtoId: string
    fotos: string[]
}

/** Apaga o produto, as variações (cascade) e as fotos. Os pedidos guardam cópia dos itens. */
export async function deleteProduto({ produtoId, fotos }: DeleteProdutoInput): Promise<void> {
    const { data, error } = await supabase.from("produtos").delete().eq("id", produtoId).select("id")

    throwIfError(error)
    assertAffected(data)

    await removeFiles({ paths: fotos })
}
