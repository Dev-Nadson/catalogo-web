"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { KeyRound, UserRound } from "lucide-react"
import { toast } from "sonner"

import { describeMutationError } from "~/lib/errors"
import { QUERIES, invalidatePerfil } from "~/lib/queries"
import { formatCep, maskPhoneInput, onlyDigits } from "~/lib/utils"
import { getMeuPerfil, updateMeuPerfil, type MeuPerfil } from "~/services/profiles"
import { Skeleton } from "~/components/ui/skeleton"
import { Section } from "~/components/detail-section"
import { toEnderecoInput } from "~/components/forms/endereco-fields"
import { MeusDadosForm, type MeusDadosFormValues } from "~/components/forms/meus-dados-form"
import { ResetPasswordForm } from "~/components/forms/reset-password-form"

function toFormValues(perfil: MeuPerfil): MeusDadosFormValues {
    return {
        nome: perfil.nome ?? "",
        telefone: maskPhoneInput(perfil.telefone ?? ""),
        endereco: {
            cep: perfil.cep ? formatCep(perfil.cep) : "",
            logradouro: perfil.logradouro ?? "",
            numero: perfil.numero ?? "",
            complemento: perfil.complemento ?? "",
            bairro: perfil.bairro ?? "",
            cidade: perfil.cidade ?? "",
            uf: perfil.uf ?? "",
        },
    }
}

export function ContaDados() {
    const queryClient = useQueryClient()

    const { data: perfil } = useQuery({
        queryKey: [QUERIES.GET_MEU_PERFIL],
        queryFn: () => getMeuPerfil(),
    })

    const { mutateAsync, isPending } = useMutation({
        mutationFn: (values: MeusDadosFormValues) =>
            updateMeuPerfil({
                nome: values.nome.trim(),
                telefone: onlyDigits(values.telefone),
                endereco: toEnderecoInput(values.endereco),
            }),
        onSuccess: () => invalidatePerfil(queryClient),
    })

    function handleSubmit(values: MeusDadosFormValues) {
        if (isPending) return

        toast.promise(mutateAsync(values), {
            loading: "Salvando seus dados...",
            success: "Dados salvos.",
            error: (error: unknown) => describeMutationError(error),
        })
    }

    return (
        <>
            <Section title="Meus dados" icon={<UserRound className="size-4 text-primary" />}>
                {perfil ? (
                    <MeusDadosForm
                        defaultValues={toFormValues(perfil)}
                        email={perfil.email ?? ""}
                        isPending={isPending}
                        onSubmit={handleSubmit}
                    />
                ) : (
                    <Skeleton className="h-96 w-full" />
                )}
            </Section>

            <Section title="Trocar senha" icon={<KeyRound className="size-4 text-primary" />}>
                <ResetPasswordForm homePath="/conta" className="max-w-md" />
            </Section>
        </>
    )
}
