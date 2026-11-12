"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Truck } from "lucide-react"
import { toast } from "sonner"

import { useConfiguracao } from "~/hooks/use-configuracao"
import { describeMutationError } from "~/lib/errors"
import { invalidateConfiguracao } from "~/lib/queries"
import { parseCurrency, toCurrencyInput, toNullable } from "~/lib/utils"
import { updateEntregaPagamento, type Configuracao } from "~/services/configuracoes"
import { Skeleton } from "~/components/ui/skeleton"
import { Section } from "~/components/detail-section"
import {
    EntregaPagamentoForm,
    type EntregaPagamentoFormValues,
} from "~/components/forms/entrega-pagamento-form"

function toFormValues(configuracao: Configuracao): EntregaPagamentoFormValues {
    return {
        aceitaEntrega: configuracao.aceita_entrega,
        taxaEntrega: configuracao.taxa_entrega > 0 ? toCurrencyInput(configuracao.taxa_entrega) : "",
        freteGratisAcima: toCurrencyInput(configuracao.frete_gratis_acima),
        aceitaRetirada: configuracao.aceita_retirada,
        pedidoMinimo: configuracao.pedido_minimo > 0 ? toCurrencyInput(configuracao.pedido_minimo) : "",
        formasPagamento: configuracao.formas_pagamento,
        chavePix: configuracao.chave_pix ?? "",
    }
}

export function ConfiguracoesEntrega() {
    const queryClient = useQueryClient()
    const { data: configuracao } = useConfiguracao()

    const { mutateAsync, isPending } = useMutation({
        mutationFn: (values: EntregaPagamentoFormValues) =>
            updateEntregaPagamento({
                aceitaEntrega: values.aceitaEntrega,
                aceitaRetirada: values.aceitaRetirada,
                taxaEntrega: values.taxaEntrega ? parseCurrency(values.taxaEntrega) : 0,
                freteGratisAcima: values.freteGratisAcima ? parseCurrency(values.freteGratisAcima) : null,
                pedidoMinimo: values.pedidoMinimo ? parseCurrency(values.pedidoMinimo) : 0,
                formasPagamento: values.formasPagamento,
                chavePix: toNullable(values.chavePix),
            }),
        onSuccess: () => invalidateConfiguracao(queryClient),
    })

    function handleSubmit(values: EntregaPagamentoFormValues) {
        if (isPending) return

        toast.promise(mutateAsync(values), {
            loading: "Salvando entrega e pagamento...",
            success: "Entrega e pagamento salvos. Valem a partir do próximo pedido.",
            error: (error: unknown) => describeMutationError(error),
        })
    }

    return (
        <Section
            title="Entrega e pagamento"
            description="O banco aplica estas regras em todo pedido: taxa, mínimo e formas aceitas."
            icon={<Truck className="size-4 text-primary" />}
        >
            {configuracao ? (
                <EntregaPagamentoForm
                    key={configuracao.atualizado_em}
                    defaultValues={toFormValues(configuracao)}
                    isPending={isPending}
                    onSubmit={handleSubmit}
                />
            ) : (
                <Skeleton className="h-96 w-full" />
            )}
        </Section>
    )
}
