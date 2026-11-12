"use client"

import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { describeProdutoError } from "~/lib/errors"
import { QUERIES, invalidateProdutos } from "~/lib/queries"
import { listCategorias } from "~/services/categorias"
import { createProduto } from "~/services/produtos"
import { Skeleton } from "~/components/ui/skeleton"
import { PRODUTO_VAZIO, ProdutoForm, toProdutoInput, type ProdutoFormValues } from "~/components/forms/produto-form"

export function NovoProduto() {
    const router = useRouter()
    const queryClient = useQueryClient()

    const { data: categorias } = useQuery({
        queryKey: [QUERIES.LIST_CATEGORIAS],
        queryFn: () => listCategorias(),
    })

    const { mutateAsync, isPending } = useMutation({
        mutationFn: async (values: ProdutoFormValues) => createProduto(await toProdutoInput(values)),
        onSuccess: () => {
            invalidateProdutos(queryClient)
            router.push("/painel/produtos")
        },
    })

    function handleSubmit(values: ProdutoFormValues) {
        if (isPending) return

        toast.promise(mutateAsync(values), {
            loading: "Salvando produto...",
            success: `${values.nome.trim()} cadastrado.`,
            error: (error: unknown) => describeProdutoError(error),
        })
    }

    if (!categorias) return <Skeleton className="h-96 w-full rounded-2xl" />

    return (
        <ProdutoForm
            defaultValues={PRODUTO_VAZIO}
            categorias={categorias}
            isNovo
            isPending={isPending}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/painel/produtos")}
        />
    )
}
