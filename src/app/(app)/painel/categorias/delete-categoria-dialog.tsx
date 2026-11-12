"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

import { describeMutationError } from "~/lib/errors"
import { invalidateCategorias } from "~/lib/queries"
import { deleteCategoria, type Categoria } from "~/services/categorias"
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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "~/components/ui/tooltip"

type DeleteCategoriaDialogProps = {
    categoria: Categoria
}

export function DeleteCategoriaDialog({ categoria }: DeleteCategoriaDialogProps) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)

    const { mutateAsync, isPending } = useMutation({
        mutationFn: deleteCategoria,
        onSuccess: () => invalidateCategorias(queryClient),
    })

    function handleDelete() {
        if (isPending) return

        toast.promise(mutateAsync({ categoriaId: categoria.id }), {
            loading: "Excluindo categoria...",
            success: `${categoria.nome} excluída.`,
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
                                    aria-label={`Excluir ${categoria.nome}`}
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
                    <AlertDialogTitle>Excluir {categoria.nome}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Os produtos desta categoria não são apagados: ficam sem categoria e aparecem em “Outros” na
                        vitrine.
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
