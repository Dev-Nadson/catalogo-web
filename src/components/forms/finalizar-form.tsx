"use client"

import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Bike, LoaderCircle, Store } from "lucide-react"
import z from "zod"

import {
    FormaPagamentoLabels,
    FormasPagamento,
    LIMITS,
    TiposEntrega,
    type TipoEntrega,
} from "~/lib/constants"
import { cn, formatCurrency, maskPhoneInput, onlyDigits, parseCurrency } from "~/lib/utils"
import type { Configuracao } from "~/services/configuracoes"
import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group"
import { Textarea } from "~/components/ui/textarea"
import { CurrencyInput } from "~/components/currency-input"
import { WhatsAppIcon } from "~/components/whatsapp-icon"
import {
    ENDERECO_VAZIO,
    EnderecoFields,
    enderecoSchema,
    isEnderecoCompleto,
} from "~/components/forms/endereco-fields"

/** Mesmas regras do `pedidos_criar`; o banco confere de novo (e calcula os valores). */
const finalizarSchema = z
    .object({
        nome: z
            .string()
            .trim()
            .min(2, "Informe seu nome.")
            .max(LIMITS.NOME_PESSOA, `No máximo ${LIMITS.NOME_PESSOA} caracteres.`),
        telefone: z
            .string()
            .refine((value) => /^\d{10,11}$/.test(onlyDigits(value)), "Informe o WhatsApp com DDD."),
        tipoEntrega: z.string().pipe(z.enum(TiposEntrega, "Escolha como quer receber.")),
        endereco: enderecoSchema,
        salvarEndereco: z.boolean(),
        formaPagamento: z.string().pipe(z.enum(FormasPagamento, "Escolha a forma de pagamento.")),
        trocoPara: z.string(),
        observacoes: z.string().trim().max(LIMITS.OBSERVACOES, `No máximo ${LIMITS.OBSERVACOES} caracteres.`),
    })
    .superRefine((values, ctx) => {
        if (values.tipoEntrega === TiposEntrega.ENTREGA && !isEnderecoCompleto(values.endereco)) {
            for (const campo of ["logradouro", "numero", "bairro", "cidade"] as const) {
                if (!values.endereco[campo].trim()) {
                    ctx.addIssue({ code: "custom", path: ["endereco", campo], message: "Obrigatório para entrega." })
                }
            }
        }
        if (values.trocoPara && !(parseCurrency(values.trocoPara) > 0)) {
            ctx.addIssue({ code: "custom", path: ["trocoPara"], message: "Informe um valor válido." })
        }
    })

export type FinalizarFormValues = z.output<typeof finalizarSchema>

/** Entrega e pagamento começam vazios ("") quando a loja oferece mais de uma opção. */
export type FinalizarFormDefaults = z.input<typeof finalizarSchema>

export const FINALIZAR_VAZIO: FinalizarFormDefaults = {
    nome: "",
    telefone: "",
    tipoEntrega: "",
    endereco: ENDERECO_VAZIO,
    salvarEndereco: true,
    formaPagamento: "",
    trocoPara: "",
    observacoes: "",
}

function isTipoEntrega(value: string): value is TipoEntrega {
    return (Object.values(TiposEntrega) as string[]).includes(value)
}

type OpcaoCardProps = {
    value: string
    id: string
    titulo: string
    detalhe?: string
    icon?: React.ReactNode
}

function OpcaoCard({ value, id, titulo, detalhe, icon }: OpcaoCardProps) {
    return (
        <FieldLabel
            htmlFor={id}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl border bg-card p-4 transition has-data-checked:border-primary has-data-checked:bg-primary/5 has-data-checked:ring-1 has-data-checked:ring-primary"
        >
            <RadioGroupItem value={value} id={id} />
            {icon}
            <span className="flex flex-col">
                <span className="font-medium">{titulo}</span>
                {detalhe && <span className="text-sm font-normal text-muted-foreground">{detalhe}</span>}
            </span>
        </FieldLabel>
    )
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:p-6">
            <h2 className="text-base font-semibold">{titulo}</h2>
            {children}
        </section>
    )
}

type FinalizarFormProps = {
    defaultValues: FinalizarFormDefaults
    configuracao: Configuracao
    isPending: boolean
    /** Motivo para não deixar enviar (loja fechada, abaixo do mínimo, carrinho vazio). */
    bloqueio: string | null
    onSubmit: (values: FinalizarFormValues) => void
    /** O resumo (itens e totais) depende do tipo de entrega escolhido. */
    resumo: (tipoEntrega: TipoEntrega | undefined) => React.ReactNode
}

export function FinalizarForm({ defaultValues, configuracao, isPending, bloqueio, onSubmit, resumo }: FinalizarFormProps) {
    const form = useForm<FinalizarFormDefaults, unknown, FinalizarFormValues>({
        resolver: zodResolver(finalizarSchema),
        defaultValues,
    })

    const tipoEntrega = useWatch({ control: form.control, name: "tipoEntrega" })
    const formaPagamento = useWatch({ control: form.control, name: "formaPagamento" })

    const taxaTexto =
        configuracao.taxa_entrega === 0
            ? "Grátis"
            : `${formatCurrency(configuracao.taxa_entrega)}${
                  configuracao.frete_gratis_acima ? ` · grátis acima de ${formatCurrency(configuracao.frete_gratis_acima)}` : ""
              }`

    return (
        <form
            id="finalizar-form"
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]"
        >
            <div className="flex flex-col gap-5">
                <Secao titulo="Seus dados">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Controller
                            name="nome"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="finalizar-nome">Nome</FieldLabel>
                                    <Input
                                        {...field}
                                        id="finalizar-nome"
                                        size="xl"
                                        autoComplete="name"
                                        maxLength={LIMITS.NOME_PESSOA}
                                        aria-invalid={fieldState.invalid}
                                    />
                                    <FieldError errors={[fieldState.error]} />
                                </Field>
                            )}
                        />
                        <Controller
                            name="telefone"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="finalizar-telefone">WhatsApp</FieldLabel>
                                    <Input
                                        {...field}
                                        id="finalizar-telefone"
                                        type="tel"
                                        size="xl"
                                        inputMode="tel"
                                        autoComplete="tel-national"
                                        placeholder="(81) 99999-0000"
                                        onChange={(event) => field.onChange(maskPhoneInput(event.target.value))}
                                        aria-invalid={fieldState.invalid}
                                    />
                                    <FieldError errors={[fieldState.error]} />
                                </Field>
                            )}
                        />
                    </div>
                </Secao>

                <Secao titulo="Como você quer receber?">
                    <Controller
                        name="tipoEntrega"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <RadioGroup
                                    value={field.value || null}
                                    onValueChange={(value) => field.onChange(value)}
                                    className="grid gap-3 sm:grid-cols-2"
                                    aria-label="Como você quer receber"
                                >
                                    {configuracao.aceita_entrega && (
                                        <OpcaoCard
                                            id="finalizar-entrega"
                                            value={TiposEntrega.ENTREGA}
                                            titulo="Entrega"
                                            detalhe={taxaTexto}
                                            icon={<Bike className="size-5 text-primary" />}
                                        />
                                    )}
                                    {configuracao.aceita_retirada && (
                                        <OpcaoCard
                                            id="finalizar-retirada"
                                            value={TiposEntrega.RETIRADA}
                                            titulo="Retirar na loja"
                                            detalhe={configuracao.endereco ?? "Sem taxa"}
                                            icon={<Store className="size-5 text-primary" />}
                                        />
                                    )}
                                </RadioGroup>
                                <FieldError errors={[fieldState.error]} />
                            </Field>
                        )}
                    />

                    {tipoEntrega === TiposEntrega.ENTREGA && (
                        <div className="flex animate-fade-in flex-col gap-4 border-t pt-4">
                            <EnderecoFields
                                control={form.control}
                                setValue={form.setValue}
                                name="endereco"
                                idPrefix="finalizar-endereco"
                            />
                            <Controller
                                name="salvarEndereco"
                                control={form.control}
                                render={({ field }) => (
                                    <Field orientation="horizontal">
                                        <Checkbox
                                            id="finalizar-salvar-endereco"
                                            checked={field.value}
                                            onCheckedChange={(checked) => field.onChange(checked === true)}
                                        />
                                        <FieldLabel htmlFor="finalizar-salvar-endereco" className="font-normal">
                                            Salvar como meu endereço para os próximos pedidos
                                        </FieldLabel>
                                    </Field>
                                )}
                            />
                        </div>
                    )}
                </Secao>

                <Secao titulo="Pagamento">
                    <Controller
                        name="formaPagamento"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <RadioGroup
                                    value={field.value || null}
                                    onValueChange={(value) => field.onChange(value)}
                                    className="grid gap-3 sm:grid-cols-2"
                                    aria-label="Forma de pagamento"
                                >
                                    {configuracao.formas_pagamento.map((forma) => (
                                        <OpcaoCard
                                            key={forma}
                                            id={`finalizar-pagamento-${forma}`}
                                            value={forma}
                                            titulo={FormaPagamentoLabels[forma]}
                                            detalhe={
                                                forma === FormasPagamento.PIX
                                                    ? "A chave aparece depois do pedido"
                                                    : forma === FormasPagamento.DINHEIRO
                                                      ? "Na entrega ou na retirada"
                                                      : "Na maquininha"
                                            }
                                        />
                                    ))}
                                </RadioGroup>
                                <FieldDescription>O pagamento é combinado com a loja, não aqui no site.</FieldDescription>
                                <FieldError errors={[fieldState.error]} />
                            </Field>
                        )}
                    />

                    {formaPagamento === FormasPagamento.DINHEIRO && (
                        <Controller
                            name="trocoPara"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid} className="animate-fade-in sm:max-w-xs">
                                    <FieldLabel htmlFor="finalizar-troco">Troco para quanto?</FieldLabel>
                                    <CurrencyInput
                                        {...field}
                                        id="finalizar-troco"
                                        size="xl"
                                        placeholder="R$ 0,00"
                                        aria-invalid={fieldState.invalid}
                                    />
                                    {fieldState.error ? (
                                        <FieldError errors={[fieldState.error]} />
                                    ) : (
                                        <FieldDescription>Deixe em branco se não precisar de troco.</FieldDescription>
                                    )}
                                </Field>
                            )}
                        />
                    )}
                </Secao>

                <Secao titulo="Observações">
                    <Controller
                        name="observacoes"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="finalizar-observacoes" className="sr-only">
                                    Observações
                                </FieldLabel>
                                <Textarea
                                    {...field}
                                    id="finalizar-observacoes"
                                    rows={3}
                                    maxLength={LIMITS.OBSERVACOES}
                                    placeholder="Algum detalhe para a loja? (opcional)"
                                    aria-invalid={fieldState.invalid}
                                />
                                <FieldError errors={[fieldState.error]} />
                            </Field>
                        )}
                    />
                </Secao>
            </div>

            <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
                {resumo(isTipoEntrega(tipoEntrega) ? tipoEntrega : undefined)}

                {bloqueio && (
                    <p className="rounded-xl bg-warning-soft px-3 py-2 text-sm text-warning">{bloqueio}</p>
                )}

                <Button
                    type="submit"
                    size="xl"
                    className={cn("h-13 w-full rounded-full text-base", !bloqueio && "shadow-lg shadow-primary/25")}
                    disabled={isPending || Boolean(bloqueio)}
                >
                    {isPending ? <LoaderCircle className="animate-spin" /> : <WhatsAppIcon />}
                    Enviar pedido pelo WhatsApp
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                    O pedido fica registrado na sua conta e a mensagem abre pronta no WhatsApp da loja.
                </p>
            </aside>
        </form>
    )
}
