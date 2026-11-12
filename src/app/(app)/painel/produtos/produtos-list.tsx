"use client"

import Link from "next/link"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Star } from "lucide-react"

import { QUERIES } from "~/lib/queries"
import { cn, formatCurrency, pluralize } from "~/lib/utils"
import { listProdutos, type ProdutoResumo } from "~/services/produtos"
import {
    ListBody,
    ListCell,
    ListEmpty,
    ListFooter,
    ListHead,
    ListHeader,
    ListRoot,
    ListRow,
    ListSkeletonRows,
    ListTable,
} from "~/components/ui/list"
import { ProdutoFoto } from "~/components/loja/produto-foto"
import { ProdutoAtivoSwitch, ProdutosRowActions } from "./produtos-row-actions"
import { useProdutos } from "./produtos-store"

const COLUMNS = 6

function faixaDePreco(produto: ProdutoResumo) {
    const precos = produto.variacoes.filter((variacao) => variacao.ativo).map((variacao) => variacao.preco)

    if (!precos.length) return "—"

    const menor = Math.min(...precos)
    const maior = Math.max(...precos)

    return menor === maior ? formatCurrency(menor) : `${formatCurrency(menor)} – ${formatCurrency(maior)}`
}

/** Soma do estoque das opções à venda; "sem controle" se alguma não controla. */
function estoqueTotal(produto: ProdutoResumo) {
    const ativas = produto.variacoes.filter((variacao) => variacao.ativo)

    if (!ativas.length) return { texto: "Sem opção à venda", alerta: true }
    if (ativas.some((variacao) => variacao.estoque === null)) return { texto: "Sem controle", alerta: false }

    const total = ativas.reduce((soma, variacao) => soma + (variacao.estoque ?? 0), 0)

    return { texto: total === 0 ? "Esgotado" : pluralize(total, "unidade", "unidades"), alerta: total === 0 }
}

export function ProdutosList() {
    const { page, search, categoriaId, status, setPage } = useProdutos()

    const { data: produtos, isPending } = useQuery({
        queryKey: [QUERIES.LIST_PRODUTOS, { page, search, categoriaId, status }],
        queryFn: () => listProdutos({ page, search, categoriaId, status }),
        placeholderData: keepPreviousData,
    })

    const hasResults = Boolean(produtos?.data.length)

    return (
        <ListRoot>
            <ListTable>
                <ListHeader>
                    <ListRow className="hover:bg-transparent">
                        <ListHead>Produto</ListHead>
                        <ListHead className="hidden md:table-cell">Categoria</ListHead>
                        <ListHead className="text-right">Preço</ListHead>
                        <ListHead className="hidden sm:table-cell">Estoque</ListHead>
                        <ListHead>À venda</ListHead>
                        <ListHead className="text-right">Ações</ListHead>
                    </ListRow>
                </ListHeader>

                <ListBody>
                    {isPending && <ListSkeletonRows cols={COLUMNS} />}

                    {!isPending && !hasResults && (
                        <ListEmpty cols={COLUMNS}>
                            {search ? "Nenhum produto com esse nome." : "Nenhum produto cadastrado ainda."}
                        </ListEmpty>
                    )}

                    {!isPending &&
                        produtos?.data.map((produto) => {
                            const estoque = estoqueTotal(produto)

                            return (
                                <ListRow key={produto.id} className={cn(!produto.ativo && "opacity-60")}>
                                    <ListCell>
                                        <Link
                                            href={`/painel/produtos/${produto.id}`}
                                            className="flex items-center gap-3 hover:underline"
                                        >
                                            <ProdutoFoto
                                                path={produto.fotos[0]}
                                                alt=""
                                                className="size-11 shrink-0 rounded-lg"
                                            />
                                            <span className="flex max-w-64 items-center gap-1.5 truncate font-medium">
                                                {produto.destaque && (
                                                    <Star className="size-3.5 shrink-0 fill-warning text-warning" aria-label="Destaque" />
                                                )}
                                                <span className="truncate">{produto.nome}</span>
                                            </span>
                                        </Link>
                                    </ListCell>
                                    <ListCell className="hidden text-muted-foreground md:table-cell">
                                        {produto.categoria ?? "—"}
                                    </ListCell>
                                    <ListCell className="text-right whitespace-nowrap tabular-nums">
                                        {faixaDePreco(produto)}
                                    </ListCell>
                                    <ListCell
                                        className={cn(
                                            "hidden tabular-nums sm:table-cell",
                                            estoque.alerta ? "font-medium text-danger" : "text-muted-foreground"
                                        )}
                                    >
                                        {estoque.texto}
                                    </ListCell>
                                    <ListCell>
                                        <ProdutoAtivoSwitch produto={produto} />
                                    </ListCell>
                                    <ListCell>
                                        <ProdutosRowActions produto={produto} />
                                    </ListCell>
                                </ListRow>
                            )
                        })}
                </ListBody>
            </ListTable>

            <ListFooter
                total={produtos?.total}
                page={produtos?.page}
                pages={produtos?.total_pages}
                onPageChange={setPage}
            />
        </ListRoot>
    )
}
