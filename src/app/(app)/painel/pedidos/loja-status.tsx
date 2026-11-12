"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useConfiguracao } from "~/hooks/use-configuracao"
import { useSession } from "~/hooks/use-session"
import { isAdmin } from "~/lib/constants"
import { describeMutationError } from "~/lib/errors"
import { invalidateConfiguracao } from "~/lib/queries"
import { cn } from "~/lib/utils"
import { updateLojaAberta } from "~/services/configuracoes"
import { Label } from "~/components/ui/label"
import { Switch } from "~/components/ui/switch"

/**
 * Abrir e fechar a loja sem sair dos pedidos. Fechada, o site continua no ar, mas o
 * `pedidos_criar` recusa pedido novo. Só o admin muda (RLS); o atendente só vê.
 */
export function LojaStatus() {
    const queryClient = useQueryClient()
    const { data: session } = useSession()
    const { data: configuracao } = useConfiguracao()

    const { mutateAsync, isPending } = useMutation({
        mutationFn: updateLojaAberta,
        onSuccess: () => invalidateConfiguracao(queryClient),
    })

    if (!configuracao) return null

    const aberta = configuracao.aberta

    function handleChange(checked: boolean) {
        if (isPending) return

        toast.promise(mutateAsync({ aberta: checked }), {
            loading: checked ? "Abrindo a loja..." : "Fechando a loja...",
            success: checked ? "Loja aberta: pedidos liberados." : "Loja fechada: novos pedidos bloqueados.",
            error: (error: unknown) => describeMutationError(error),
        })
    }

    return (
        <div
            className={cn(
                "flex items-center gap-3 rounded-full border px-4 py-2",
                aberta ? "border-success/30 bg-success-soft" : "border-warning/30 bg-warning-soft"
            )}
        >
            <span className={cn("size-2 rounded-full", aberta ? "bg-success" : "bg-warning")} />
            <Label htmlFor="loja-aberta" className={cn("text-sm font-medium", aberta ? "text-success" : "text-warning")}>
                {aberta ? "Loja aberta" : "Loja fechada"}
            </Label>
            {isAdmin(session?.role) && (
                <Switch id="loja-aberta" checked={aberta} disabled={isPending} onCheckedChange={handleChange} />
            )}
        </div>
    )
}
