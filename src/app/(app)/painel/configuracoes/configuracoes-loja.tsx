"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Store } from "lucide-react"
import { toast } from "sonner"

import { useConfiguracao } from "~/hooks/use-configuracao"
import { describeMutationError } from "~/lib/errors"
import { fotoUrl } from "~/lib/fotos"
import { dataUrlToBlob } from "~/lib/image"
import { invalidateConfiguracao } from "~/lib/queries"
import { maskPhoneInput, onlyDigits, toNullable } from "~/lib/utils"
import { updateLoja, type Configuracao } from "~/services/configuracoes"
import { Skeleton } from "~/components/ui/skeleton"
import { Section } from "~/components/detail-section"
import { LojaForm, type LojaFormValues } from "~/components/forms/loja-form"

function toFormValues(configuracao: Configuracao): LojaFormValues {
    return {
        nome: configuracao.nome,
        slogan: configuracao.slogan ?? "",
        cor: configuracao.cor,
        // O banco guarda com o 55; a tela mostra só DDD + número.
        whatsapp: configuracao.whatsapp ? maskPhoneInput(configuracao.whatsapp.slice(2)) : "",
        instagram: configuracao.instagram ? `@${configuracao.instagram}` : "",
        endereco: configuracao.endereco ?? "",
        horario: configuracao.horario ?? "",
        aviso: configuracao.aviso ?? "",
        logo: null,
        removerLogo: false,
    }
}

export function ConfiguracoesLoja() {
    const queryClient = useQueryClient()
    const { data: configuracao } = useConfiguracao()

    const { mutateAsync, isPending } = useMutation({
        mutationFn: async (values: LojaFormValues) =>
            updateLoja({
                nome: values.nome.trim(),
                slogan: toNullable(values.slogan),
                cor: values.cor.toLowerCase(),
                whatsapp: values.whatsapp ? `55${onlyDigits(values.whatsapp)}` : null,
                instagram: toNullable(values.instagram.replace(/^@/, "")),
                endereco: toNullable(values.endereco),
                horario: toNullable(values.horario),
                aviso: toNullable(values.aviso),
                logo: values.logo ? await dataUrlToBlob(values.logo) : values.removerLogo ? null : undefined,
                logoPathAtual: configuracao?.logo_path ?? null,
            }),
        onSuccess: () => invalidateConfiguracao(queryClient),
    })

    function handleSubmit(values: LojaFormValues) {
        if (isPending) return

        toast.promise(mutateAsync(values), {
            loading: "Salvando a loja...",
            success: "Loja salva. O site já mostra as mudanças.",
            error: (error: unknown) => describeMutationError(error),
        })
    }

    return (
        <Section
            title="Loja"
            description="Nome, marca e contato: aparecem no site inteiro e na prévia dos links."
            icon={<Store className="size-4 text-primary" />}
        >
            {configuracao ? (
                <LojaForm
                    key={configuracao.atualizado_em}
                    defaultValues={toFormValues(configuracao)}
                    logoUrl={fotoUrl(configuracao.logo_path)}
                    isPending={isPending}
                    onSubmit={handleSubmit}
                />
            ) : (
                <Skeleton className="h-96 w-full" />
            )}
        </Section>
    )
}
