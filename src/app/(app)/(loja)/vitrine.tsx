"use client"

import { useQuery } from "@tanstack/react-query"
import { PackageSearch, Search, X } from "lucide-react"

import { isEsgotado } from "~/lib/carrinho"
import { QUERIES } from "~/lib/queries"
import { cn, normalizeSearch } from "~/lib/utils"
import { listCategorias } from "~/services/categorias"
import { listCatalogo, type ProdutoCatalogo } from "~/services/produtos"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Skeleton } from "~/components/ui/skeleton"
import { CarrinhoBar } from "~/components/loja/carrinho-bar"
import { ProdutoCard } from "~/components/loja/produto-card"
import { useVitrine } from "./vitrine-store"

type Secao = {
    id: string
    titulo: string | null
    produtos: ProdutoCatalogo[]
}

function Grade({ produtos, priority = false }: { produtos: ProdutoCatalogo[]; priority?: boolean }) {
    return (
        <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
            {produtos.map((produto, index) => (
                <ProdutoCard key={produto.id} produto={produto} priority={priority && index < 4} />
            ))}
        </div>
    )
}

export function Vitrine() {
    const { busca, categoriaId, setBusca, setCategoriaId, reset } = useVitrine()

    const { data: produtos, isPending } = useQuery({
        queryKey: [QUERIES.LIST_CATALOGO],
        queryFn: () => listCatalogo(),
    })

    const { data: categorias } = useQuery({
        queryKey: [QUERIES.LIST_CATEGORIAS],
        queryFn: () => listCategorias(),
    })

    const termo = normalizeSearch(busca)
    // Esgotados vão para o fim (o sort é estável: o resto mantém a ordem do admin).
    const lista = [...(produtos ?? [])].sort(
        (a, b) => Number(isEsgotado(a.variacoes)) - Number(isEsgotado(b.variacoes))
    )
    const categoriasVisiveis = (categorias ?? []).filter((categoria) =>
        lista.some((produto) => produto.categoria_id === categoria.id)
    )

    const filtrados = lista.filter(
        (produto) =>
            (!categoriaId || produto.categoria_id === categoriaId) &&
            (!termo || normalizeSearch(`${produto.nome} ${produto.descricao ?? ""}`).includes(termo))
    )

    // Sem busca nem categoria: destaques no topo e uma seção por categoria, na ordem do admin.
    const agrupar = !termo && !categoriaId && categoriasVisiveis.length > 0
    const secoes: Secao[] = agrupar
        ? [
              { id: "destaques", titulo: "Destaques", produtos: lista.filter((produto) => produto.destaque) },
              ...categoriasVisiveis.map((categoria) => ({
                  id: categoria.id,
                  titulo: categoria.nome,
                  produtos: lista.filter((produto) => produto.categoria_id === categoria.id && !produto.destaque),
              })),
              {
                  id: "outros",
                  titulo: "Outros",
                  produtos: lista.filter((produto) => !produto.categoria_id && !produto.destaque),
              },
          ].filter((secao) => secao.produtos.length > 0)
        : [{ id: "resultado", titulo: null, produtos: filtrados }]

    const chips = [{ id: null, nome: "Todos" }, ...categoriasVisiveis]

    return (
        <>
            <div className="sticky top-16 z-20 border-b bg-background/90 backdrop-blur-md">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3">
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            aria-label="Buscar produtos"
                            placeholder="Buscar produtos..."
                            className="h-11 rounded-full pr-10 pl-10"
                            value={busca}
                            onChange={(event) => setBusca(event.target.value)}
                        />
                        {busca && (
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full"
                                aria-label="Limpar busca"
                                onClick={() => setBusca("")}
                            >
                                <X />
                            </Button>
                        )}
                    </div>

                    {categoriasVisiveis.length > 0 && (
                        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4" role="tablist" aria-label="Categorias">
                            {chips.map((chip) => {
                                const ativo = categoriaId === chip.id

                                return (
                                    <button
                                        key={chip.id ?? "todos"}
                                        type="button"
                                        role="tab"
                                        aria-selected={ativo}
                                        onClick={() => setCategoriaId(chip.id)}
                                        className={cn(
                                            "h-9 shrink-0 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors",
                                            ativo
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : "bg-background hover:bg-muted"
                                        )}
                                    >
                                        {chip.nome}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8">
                {isPending && (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
                        {Array.from({ length: 8 }, (_, index) => (
                            <div key={index} className="flex flex-col gap-3">
                                <Skeleton className="aspect-square w-full rounded-2xl" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/3" />
                            </div>
                        ))}
                    </div>
                )}

                {!isPending && lista.length === 0 && (
                    <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                        <PackageSearch className="size-10" strokeWidth={1.5} />
                        <p>Nenhum produto por aqui ainda. Volte em breve!</p>
                    </div>
                )}

                {!isPending && lista.length > 0 && filtrados.length === 0 && (
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                        <PackageSearch className="size-10 text-muted-foreground" strokeWidth={1.5} />
                        <p className="text-muted-foreground">
                            {termo ? <>Nada encontrado para “{busca}”.</> : "Nenhum produto nesta categoria."}
                        </p>
                        <Button variant="outline" size="lg" onClick={reset}>
                            Ver todos os produtos
                        </Button>
                    </div>
                )}

                {!isPending &&
                    filtrados.length > 0 &&
                    secoes.map((secao, index) => (
                        <section key={secao.id} className="flex flex-col gap-4" aria-label={secao.titulo ?? "Produtos"}>
                            {secao.titulo && <h2 className="text-xl font-semibold tracking-tight">{secao.titulo}</h2>}
                            <Grade produtos={secao.produtos} priority={index === 0} />
                        </section>
                    ))}
            </div>

            <CarrinhoBar />
        </>
    )
}
