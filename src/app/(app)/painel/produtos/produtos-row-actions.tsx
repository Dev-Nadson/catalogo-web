"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { describeMutationError } from "~/lib/errors"
import { invalidateProdutos } from "~/lib/queries"
import { deleteProduto, updateProdutoAtivo, type ProdutoResumo } from "~/services/produtos"
import {
    AlertDialog,
    AlertDialogClose,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "~/components/ui/alert-dialog"
import { Button } from "~/components/ui/button"
import { Switch } from "~/components/ui/switch"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "~/components/ui/tooltip"

type ProdutoProps = {
    produto: ProdutoResumo
}

/** Tirar da vitrine sem apagar: o produto some da loja e volta quando religar. */
export function ProdutoAtivoSwitch({ produto }: ProdutoProps) {
    const queryClient = useQueryClient()

    const { mutateAsync, isPending } = useMutation({
        mutationFn: updateProdutoAtivo,
        onSuccess: () => invalidateProdutos(queryClient),
    })

    function handleChange(ativo: boolean) {
        if (isPending) return

        toast.promise(mutateAsync({ produtoId: produto.id, ativo }), {
            loading: ativo ? "Colocando à venda..." : "Tirando da vitrine...",
            success: ativo ? `${produto.nome} à venda.` : `${produto.nome} fora da vitrine.`,
            error: (error: unknown) => describeMutationError(error),
        })
    }

    return (
        <Switch
            checked={produto.ativo}
            disabled={isPending}
            onCheckedChange={handleChange}
            aria-label={produto.ativo ? `Tirar ${produto.nome} da vitrine` : `Colocar ${produto.nome} à venda`}
        />
    )
}

function DeleteProdutoDialog({ produto }: ProdutoProps) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)

    const { mutateAsync, isPending } = useMutation({
        mutationFn: deleteProduto,
        onSuccess: () => invalidateProdutos(queryClient),
    })

    function handleDelete() {
        if (isPending) return

        toast.promise(mutateAsync({ produtoId: produto.id, fotos: produto.fotos }), {
            loading: "Excluindo produto...",
            success: `${produto.nome} excluído.`,
            error: (error: unknown) => describeMutationError(error),
        })
        setOpen(false)
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <Tooltip>
                <TooltipTrigger
                    render={
                        <AlertDialogTrigger
                            render={
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label={`Excluir ${produto.nome}`}
                                    className="text-muted-foreground hover:text-destructive"
                                    disabled={isPending}
                                />
                            }
                        />
                    }
                >
                    <Trash2 />
                </TooltipTrigger>
                <TooltipContent>Excluir</TooltipContent>
            </Tooltip>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir {produto.nome}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        O produto, as opções e as fotos são apagados de vez. Pedidos antigos continuam com o nome e o
                        preço da época. Para só esconder da loja, desligue “À venda”.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogClose render={<Button type="button" variant="ghost" size="lg" />}>Cancelar</AlertDialogClose>
                    <Button type="button" variant="destructive" size="lg" onClick={handleDelete}>
                        Excluir
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export function ProdutosRowActions({ produto }: ProdutoProps) {
    return (
        <div className="flex items-center justify-end gap-1">
            <Tooltip>
                <TooltipTrigger
                    render={
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Editar ${produto.nome}`}
                            render={<Link href={`/painel/produtos/${produto.id}`} />}
                        >
                            <Pencil />
                        </Button>
                    }
                />
                <TooltipContent>Editar</TooltipContent>
            </Tooltip>
            <DeleteProdutoDialog produto={produto} />
        </div>
    )
}
