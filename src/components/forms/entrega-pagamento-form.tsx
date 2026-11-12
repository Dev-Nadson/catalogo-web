"use client"

import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoaderCircle } from "lucide-react"
import z from "zod"

import { FORMA_PAGAMENTO_OPTIONS, FormasPagamento, LIMITS } from "~/lib/constants"
import { parseCurrency } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { Switch } from "~/components/ui/switch"
import { CurrencyInput } from "~/components/currency-input"

const dinheiroOpcional = z.string().refine((value) => value === "" || parseCurrency(value) >= 0, "Valor inválido.")

/** Espelha os `check` de `configuracoes`: ao menos um jeito de receber e uma forma de pagamento. */
const entregaPagamentoSchema = z
    .object({
        aceitaEntrega: z.boolean(),
        taxaEntrega: dinheiroOpcional,
        freteGratisAcima: dinheiroOpcional,
        aceitaRetirada: z.boolean(),
        pedidoMinimo: dinheiroOpcional,
        formasPagamento: z.array(z.enum(FormasPagamento)).min(1, "Escolha ao menos uma forma de pagamento."),
        chavePix: z.string().trim().max(LIMITS.CHAVE_PIX, `No máximo ${LIMITS.CHAVE_PIX} caracteres.`),
    })
    .superRefine((values, ctx) => {
        if (!values.aceitaEntrega && !values.aceitaRetirada) {
            ctx.addIssue({ code: "custom", path: ["aceitaRetirada"], message: "Deixe ao menos entrega ou retirada ligada." })
        }
        if (values.freteGratisAcima && !(parseCurrency(values.freteGratisAcima) > 0)) {
            ctx.addIssue({ code: "custom", path: ["freteGratisAcima"], message: "Maior que zero, ou vazio." })
        }
    })

export type EntregaPagamentoFormValues = z.infer<typeof entregaPagamentoSchema>

type EntregaPagamentoFormProps = {
    defaultValues: EntregaPagamentoFormValues
    isPending: boolean
    onSubmit: (values: EntregaPagamentoFormValues) => void
}

export function EntregaPagamentoForm({ defaultValues, isPending, onSubmit }: EntregaPagamentoFormProps) {
    const form = useForm<EntregaPagamentoFormValues>({
        resolver: zodResolver(entregaPagamentoSchema),
        defaultValues,
    })

    const aceitaEntrega = useWatch({ control: form.control, name: "aceitaEntrega" })
    const formas = useWatch({ control: form.control, name: "formasPagamento" })

    return (
        <form id="entrega-pagamento-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 rounded-xl border p-4">
                <Controller
                    name="aceitaEntrega"
                    control={form.control}
                    render={({ field }) => (
                        <Field orientation="horizontal">
                            <Switch id="entrega-aceita" checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                            <FieldLabel htmlFor="entrega-aceita">Fazer entregas</FieldLabel>
                        </Field>
                    )}
                />
                {aceitaEntrega && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Controller
                            name="taxaEntrega"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="entrega-taxa">Taxa de entrega</FieldLabel>
                                    <CurrencyInput {...field} id="entrega-taxa" size="xl" placeholder="R$ 0,00 = grátis" disabled={isPending} aria-invalid={fieldState.invalid} />
                                    <FieldError errors={[fieldState.error]} />
                                </Field>
                            )}
                        />
                        <Controller
                            name="freteGratisAcima"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="entrega-frete-gratis">Frete grátis a partir de</FieldLabel>
                                    <CurrencyInput {...field} id="entrega-frete-gratis" size="xl" placeholder="Opcional" disabled={isPending} aria-invalid={fieldState.invalid} />
                                    {fieldState.error ? (
                                        <FieldError errors={[fieldState.error]} />
                                    ) : (
                                        <FieldDescription>O carrinho mostra quanto falta.</FieldDescription>
                                    )}
                                </Field>
                            )}
                        />
                    </div>
                )}
            </div>

            <div className="rounded-xl border p-4">
                <Controller
                    name="aceitaRetirada"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                            <Switch id="entrega-retirada" checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                            <FieldLabel htmlFor="entrega-retirada">Retirada na loja (sem taxa)</FieldLabel>
                            <FieldError errors={[fieldState.error]} />
                        </Field>
                    )}
                />
            </div>

            <Controller
                name="pedidoMinimo"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="sm:max-w-xs">
                        <FieldLabel htmlFor="entrega-minimo">Pedido mínimo</FieldLabel>
                        <CurrencyInput {...field} id="entrega-minimo" size="xl" placeholder="Sem mínimo" disabled={isPending} aria-invalid={fieldState.invalid} />
                        <FieldError errors={[fieldState.error]} />
                    </Field>
                )}
            />

            <Controller
                name="formasPagamento"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Formas de pagamento aceitas</FieldLabel>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {FORMA_PAGAMENTO_OPTIONS.map((opcao) => {
                                const marcado = field.value.includes(opcao.value)

                                return (
                                    <Field key={opcao.value} orientation="horizontal" className="rounded-lg border px-3 py-2.5">
                                        <Checkbox
                                            id={`entrega-pagamento-${opcao.value}`}
                                            checked={marcado}
                                            disabled={isPending}
                                            onCheckedChange={(checked) =>
                                                field.onChange(
                                                    checked
                                                        ? FORMA_PAGAMENTO_OPTIONS.map((item) => item.value).filter(
                                                              (valor) => valor === opcao.value || field.value.includes(valor)
                                                          )
                                                        : field.value.filter((valor) => valor !== opcao.value)
                                                )
                                            }
                                        />
                                        <FieldLabel htmlFor={`entrega-pagamento-${opcao.value}`} className="font-normal">
                                            {opcao.label}
                                        </FieldLabel>
                                    </Field>
                                )
                            })}
                        </div>
                        <FieldError errors={[fieldState.error]} />
                    </Field>
                )}
            />

            {formas.includes(FormasPagamento.PIX) && (
                <Controller
                    name="chavePix"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} className="sm:max-w-md">
                            <FieldLabel htmlFor="entrega-chave-pix">Chave Pix</FieldLabel>
                            <Input {...field} id="entrega-chave-pix" size="xl" maxLength={LIMITS.CHAVE_PIX} disabled={isPending} aria-invalid={fieldState.invalid} />
                            {fieldState.error ? (
                                <FieldError errors={[fieldState.error]} />
                            ) : (
                                <FieldDescription>
                                    Aparece para o cliente, com botão de copiar, depois que ele faz o pedido. É pública.
                                </FieldDescription>
                            )}
                        </Field>
                    )}
                />
            )}

            <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={isPending}>
                    {isPending && <LoaderCircle className="animate-spin" />}
                    Salvar
                </Button>
            </div>
        </form>
    )
}
