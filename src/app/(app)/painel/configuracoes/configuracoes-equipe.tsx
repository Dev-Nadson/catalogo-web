"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { UserMinus, Users } from "lucide-react"
import { toast } from "sonner"

import { useSession } from "~/hooks/use-session"
import { RoleLabels, Roles, STAFF_ROLE_OPTIONS, type Role } from "~/lib/constants"
import { describeMutationError } from "~/lib/errors"
import { QUERIES, invalidatePerfil } from "~/lib/queries"
import { listEquipe, updateProfileRole, type MembroEquipe } from "~/services/profiles"
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import { Skeleton } from "~/components/ui/skeleton"
import { RoleBadge } from "~/components/badges"
import { Section } from "~/components/detail-section"
import { MembroDialog } from "./membro-dialog"

function MembroRow({ membro, isSelf }: { membro: MembroEquipe; isSelf: boolean }) {
    const queryClient = useQueryClient()
    const [confirmar, setConfirmar] = useState(false)
    const nome = membro.nome ?? membro.email ?? "Sem nome"

    const { mutateAsync, isPending } = useMutation({
        mutationFn: updateProfileRole,
        onSuccess: () => invalidatePerfil(queryClient),
    })

    function mudar(role: Role) {
        if (isPending || role === membro.role) return

        toast.promise(mutateAsync({ profileId: membro.id, role }), {
            loading: "Salvando o acesso...",
            success:
                role === Roles.CLIENTE
                    ? `${nome} saiu da equipe.`
                    : `${nome} agora é ${RoleLabels[role].toLowerCase()}.`,
            error: (error: unknown) => describeMutationError(error),
        })
        setConfirmar(false)
    }

    return (
        <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                    {nome}
                    {isSelf && <span className="font-normal text-muted-foreground"> (você)</span>}
                </p>
                <p className="truncate text-sm text-muted-foreground">{membro.email}</p>
            </div>

            {isSelf ? (
                <RoleBadge role={membro.role} />
            ) : (
                <div className="flex items-center gap-2">
                    <Select
                        items={STAFF_ROLE_OPTIONS}
                        value={membro.role}
                        onValueChange={(value) => value && mudar(value)}
                        disabled={isPending}
                    >
                        <SelectTrigger aria-label={`Papel de ${nome}`} className="h-9 w-36">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {STAFF_ROLE_OPTIONS.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
                        <AlertDialogTrigger
                            render={
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Tirar ${nome} da equipe`}
                                    className="text-muted-foreground hover:text-destructive"
                                    disabled={isPending}
                                />
                            }
                        >
                            <UserMinus />
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Tirar {nome} da equipe?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    A conta continua existindo, como cliente: perde o acesso ao painel na hora.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogClose render={<Button type="button" variant="ghost" size="lg" />}>
                                    Cancelar
                                </AlertDialogClose>
                                <Button type="button" variant="destructive" size="lg" onClick={() => mudar(Roles.CLIENTE)}>
                                    Tirar da equipe
                                </Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
        </li>
    )
}

export function ConfiguracoesEquipe() {
    const { data: session } = useSession()

    const { data: equipe } = useQuery({
        queryKey: [QUERIES.LIST_EQUIPE],
        queryFn: () => listEquipe(),
    })

    return (
        <Section
            title="Equipe"
            description="Atendente vê e atende os pedidos. Admin mexe em tudo. Ninguém muda o próprio papel."
            icon={<Users className="size-4 text-primary" />}
            action={<MembroDialog />}
        >
            {equipe ? (
                <ul className="-my-3 divide-y">
                    {equipe.map((membro) => (
                        <MembroRow key={membro.id} membro={membro} isSelf={membro.id === session?.user_id} />
                    ))}
                </ul>
            ) : (
                <Skeleton className="h-32 w-full" />
            )}
        </Section>
    )
}
