"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ExternalLink } from "lucide-react"
import { toast } from "sonner"

import { ApiError, describeProdutoError } from "~/lib/errors"
import { QUERIES, invalidateProdutos } from "~/lib/queries"
import { toCurrencyInput } from "~/lib/utils"
import { listCategorias } from "~/services/categorias"
import { getProduto, updateProduto, type ProdutoCompleto } from "~/services/produtos"
import { Button } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"
import { PageHeader } from "~/components/page-header"
import { ProdutoForm, toProdutoInput, type ProdutoFormValues } from "~/components/forms/produto-form"

function toFormValues(produto: ProdutoCompleto): ProdutoFormValues {
    return {
        nome: produto.nome,
        slug: produto.slug,
        categoriaId: produto.categoria_id,
        descricao: produto.descricao ?? "",
        rotuloVariacao: produto.rotulo_variacao ?? "",
        destaque: produto.destaque,
        ativo: produto.ativo,
        fotos: produto.fotos.map((path) => ({ key: path, path })),
        variacoes: produto.variacoes.map((variacao) => ({
            id: variacao.id,
            rotulo: variacao.rotulo,
            preco: toCurrencyInput(variacao.preco),
            precoDe: toCurrencyInput(variacao.preco_de),
            estoque: variacao.estoque === null ? "" : String(variacao.estoque),
            ativo: variacao.ativo,
        })),
    }
}

type EditarProdutoProps = {
    produtoId: string
}

export function EditarProduto({ produtoId }: EditarProdutoProps) {
    const router = useRouter()
    const queryClient = useQueryClient()

    const { data: produto, error } = useQuery({
        queryKey: [QUERIES.GET_PRODUTO, { produtoId }],
        queryFn: () => getProduto({ produtoId }),
    })

    const { data: categorias } = useQuery({
        queryKey: [QUERIES.LIST_CATEGORIAS],
        queryFn: () => listCategorias(),
    })

    const { mutateAsync, isPending } = useMutation({
        mutationFn: async (values: ProdutoFormValues) =>
            updateProduto({
                produtoId,
                fotosAtuais: produto?.fotos ?? [],
                variacoesAtuais: produto?.variacoes.map((variacao) => variacao.id) ?? [],
                ...(await toProdutoInput(values)),
            }),
        onSuccess: () => {
            invalidateProdutos(queryClient)
            router.push("/painel/produtos")
        },
    })

    function handleSubmit(values: ProdutoFormValues) {
        if (isPending) return

        toast.promise(mutateAsync(values), {
            loading: "Salvando produto...",
            success: `${values.nome.trim()} salvo.`,
            error: (error: unknown) => describeProdutoError(error),
        })
    }

    if (error instanceof ApiError && error.status === 404) {
        return <PageHeader title="Produto não encontrado" description="Ele pode ter sido excluído." />
    }

    if (!produto || !categorias) {
        return (
            <>
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-96 w-full rounded-2xl" />
            </>
        )
    }

    return (
        <>
            <PageHeader
                title={produto.nome}
                action={
                    produto.ativo && (
                        <Button
                            variant="outline"
                            size="lg"
                            render={<Link href={`/produto/${produto.slug}`} target="_blank" rel="noopener" />}
                        >
                            <ExternalLink />
                            Ver na loja
                        </Button>
                    )
                }
            />
            <ProdutoForm
                key={produto.atualizado_em}
                defaultValues={toFormValues(produto)}
                categorias={categorias}
                isNovo={false}
                isPending={isPending}
                onSubmit={handleSubmit}
                onCancel={() => router.push("/painel/produtos")}
            />
        </>
    )
}
