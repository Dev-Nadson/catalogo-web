"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { FolderPlus, Pencil } from "lucide-react"
import { toast } from "sonner"

import { describeMutationError } from "~/lib/errors"
import { invalidateCategorias } from "~/lib/queries"
import { slugify } from "~/lib/utils"
import { createCategoria, updateCategoria, type Categoria } from "~/services/categorias"
import { Button } from "~/components/ui/button"
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "~/components/ui/tooltip"
import { CategoriaForm, type CategoriaFormValues } from "~/components/forms/categoria-form"

type CategoriaDialogProps = {
    /** Sem categoria, o diálogo cadastra uma nova. */
    categoria?: Categoria
}

export function CategoriaDialog({ categoria }: CategoriaDialogProps) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)

    const { mutateAsync, isPending } = useMutation({
        mutationFn: async (values: CategoriaFormValues) => {
            const input = { nome: values.nome.trim(), slug: slugify(values.nome), ordem: Number(values.ordem) }

            if (categoria) {
                await updateCategoria({ categoriaId: categoria.id, ...input })
                return
            }

            await createCategoria(input)
        },
        onSuccess: () => {
            invalidateCategorias(queryClient)
            setOpen(false)
        },
    })

    function handleSubmit(values: CategoriaFormValues) {
        if (isPending) return

        toast.promise(mutateAsync(values), {
            loading: "Salvando categoria...",
            success: `${values.nome.trim()} salva.`,
            error: (error: unknown) => describeMutationError(error),
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {categoria ? (
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <DialogTrigger
                                render={<Button variant="ghost" size="icon-sm" aria-label={`Editar ${categoria.nome}`} />}
                            />
                        }
                    >
                        <Pencil />
                    </TooltipTrigger>
                    <TooltipContent>Editar</TooltipContent>
                </Tooltip>
            ) : (
                <DialogTrigger render={<Button size="lg" />}>
                    <FolderPlus />
                    Nova categoria
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{categoria ? "Editar categoria" : "Nova categoria"}</DialogTitle>
                </DialogHeader>
                <DialogBody className="pb-5">
                    {/* Remonta a cada abertura para começar dos valores atuais. */}
                    {open && (
                        <CategoriaForm
                            defaultValues={categoria && { nome: categoria.nome, ordem: String(categoria.ordem) }}
                            isPending={isPending}
                            onSubmit={handleSubmit}
                            onCancel={() => setOpen(false)}
                        />
                    )}
                </DialogBody>
            </DialogContent>
        </Dialog>
    )
}
