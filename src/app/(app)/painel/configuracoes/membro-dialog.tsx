"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { UserPlus } from "lucide-react"
import { toast } from "sonner"

import { useSession } from "~/hooks/use-session"
import { RoleLabels, isStaff } from "~/lib/constants"
import { describeMutationError } from "~/lib/errors"
import { invalidatePerfil } from "~/lib/queries"
import { findProfileByEmail, updateProfileRole } from "~/services/profiles"
import { Button } from "~/components/ui/button"
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog"
import { MembroForm, type MembroFormValues } from "~/components/forms/membro-form"

/** Erro de regra do formulário, com a mensagem pronta para aparecer embaixo dos campos. */
class MembroError extends Error {}

/** Promove uma conta que já existe (cliente) a atendente ou admin. */
export function MembroDialog() {
    const queryClient = useQueryClient()
    const { data: session } = useSession()
    const [open, setOpen] = useState(false)
    const [rootError, setRootError] = useState<string | null>(null)

    const { mutateAsync, isPending } = useMutation({
        mutationFn: async ({ email, role }: MembroFormValues) => {
            const perfil = await findProfileByEmail({ email })

            if (!perfil) {
                throw new MembroError("Nenhuma conta com esse e-mail. Peça para a pessoa se cadastrar na loja primeiro.")
            }
            if (perfil.id === session?.user_id) throw new MembroError("Você não pode mudar o próprio papel.")
            if (isStaff(perfil.role)) {
                throw new MembroError(`${perfil.nome ?? email} já é ${RoleLabels[perfil.role].toLowerCase()} da equipe.`)
            }

            await updateProfileRole({ profileId: perfil.id, role })

            return perfil.nome ?? email
        },
        onSuccess: () => invalidatePerfil(queryClient),
    })

    function handleSubmit(values: MembroFormValues) {
        if (isPending) return

        setRootError(null)
        mutateAsync(values)
            .then((nome) => {
                toast.success(`${nome} agora é ${RoleLabels[values.role].toLowerCase()}.`)
                setOpen(false)
            })
            .catch((error: unknown) =>
                setRootError(error instanceof MembroError ? error.message : describeMutationError(error))
            )
    }

    function handleOpenChange(aberto: boolean) {
        setOpen(aberto)
        setRootError(null)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger render={<Button size="lg" />}>
                <UserPlus />
                Adicionar à equipe
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Adicionar à equipe</DialogTitle>
                    <DialogDescription>A pessoa entra no painel com o mesmo e-mail e senha da loja.</DialogDescription>
                </DialogHeader>
                <DialogBody className="pb-5">
                    {/* Remonta a cada abertura para começar vazio. */}
                    {open && (
                        <MembroForm
                            isPending={isPending}
                            rootError={rootError}
                            onSubmit={handleSubmit}
                            onCancel={() => handleOpenChange(false)}
                        />
                    )}
                </DialogBody>
            </DialogContent>
        </Dialog>
    )
}
