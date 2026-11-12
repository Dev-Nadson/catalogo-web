"use client"

import { useState } from "react"
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoaderCircle, Plus, Trash2 } from "lucide-react"
import z from "zod"

import { LIMITS, type SelectOption } from "~/lib/constants"
import { dataUrlToBlob } from "~/lib/image"
import { parseCurrency, slugify } from "~/lib/utils"
import type { Categoria } from "~/services/categorias"
import { Button } from "~/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import { Switch } from "~/components/ui/switch"
import { Textarea } from "~/components/ui/textarea"
import { CurrencyInput } from "~/components/currency-input"
import { Section } from "~/components/detail-section"
import { FotosUploadField, type FotoValue } from "~/components/fotos-upload-field"

const variacaoSchema = z
    .object({
        id: z.string().optional(),
        rotulo: z.string().trim().max(LIMITS.VARIACAO_ROTULO, `No máximo ${LIMITS.VARIACAO_ROTULO} caracteres.`),
        preco: z.string().refine((value) => parseCurrency(value) > 0, "Informe o preço."),
        precoDe: z.string(),
        estoque: z.string().refine((value) => value.trim() === "" || /^\d{1,6}$/.test(value.trim()), "Número inteiro."),
        ativo: z.boolean(),
    })
    .superRefine((variacao, ctx) => {
        if (variacao.precoDe && !(parseCurrency(variacao.precoDe) > parseCurrency(variacao.preco))) {
            ctx.addIssue({ code: "custom", path: ["precoDe"], message: "Maior que o preço." })
        }
    })

/** Espelha os `check` de `produtos` e `produto_variacoes` no `schema.sql`. */
const produtoSchema = z
    .object({
        nome: z
            .string()
            .trim()
            .min(2, "Informe o nome.")
            .max(LIMITS.PRODUTO_NOME, `No máximo ${LIMITS.PRODUTO_NOME} caracteres.`),
        slug: z
            .string()
            .trim()
            .min(1, "Informe o endereço.")
            .max(90, "No máximo 90 caracteres.")
            .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Só letras minúsculas, números e hífen."),
        categoriaId: z.string().nullable(),
        descricao: z.string().trim().max(LIMITS.PRODUTO_DESCRICAO, `No máximo ${LIMITS.PRODUTO_DESCRICAO} caracteres.`),
        rotuloVariacao: z.string().trim().max(LIMITS.ROTULO_VARIACAO, `No máximo ${LIMITS.ROTULO_VARIACAO} caracteres.`),
        destaque: z.boolean(),
        ativo: z.boolean(),
        fotos: z.array(z.custom<FotoValue>()).max(LIMITS.PRODUTO_FOTOS),
        variacoes: z
            .array(variacaoSchema)
            .min(1, "Cadastre pelo menos um preço.")
            .max(LIMITS.VARIACOES, `No máximo ${LIMITS.VARIACOES} opções.`),
    })
    .superRefine((values, ctx) => {
        if (values.variacoes.length < 2) return

        const vistos = new Set<string>()

        values.variacoes.forEach((variacao, index) => {
            const rotulo = variacao.rotulo.trim().toLowerCase()

            if (!rotulo) {
                ctx.addIssue({ code: "custom", path: ["variacoes", index, "rotulo"], message: "Dê um nome à opção." })
            } else if (vistos.has(rotulo)) {
                ctx.addIssue({ code: "custom", path: ["variacoes", index, "rotulo"], message: "Opção repetida." })
            }
            vistos.add(rotulo)
        })

        if (!values.rotuloVariacao) {
            ctx.addIssue({ code: "custom", path: ["rotuloVariacao"], message: "Ex.: Tamanho, Cor, Sabor." })
        }
    })

export type ProdutoFormValues = z.infer<typeof produtoSchema>

export const VARIACAO_VAZIA: ProdutoFormValues["variacoes"][number] = {
    rotulo: "",
    preco: "",
    precoDe: "",
    estoque: "",
    ativo: true,
}

export const PRODUTO_VAZIO: ProdutoFormValues = {
    nome: "",
    slug: "",
    categoriaId: null,
    descricao: "",
    rotuloVariacao: "",
    destaque: false,
    ativo: true,
    fotos: [],
    variacoes: [VARIACAO_VAZIA],
}

type ProdutoFormProps = {
    defaultValues: ProdutoFormValues
    categorias: Categoria[]
    /** Produto novo: o endereço acompanha o nome até ser editado à mão. */
    isNovo: boolean
    isPending: boolean
    onSubmit: (values: ProdutoFormValues) => void
    onCancel: () => void
}

export function ProdutoForm({ defaultValues, categorias, isNovo, isPending, onSubmit, onCancel }: ProdutoFormProps) {
    const [slugManual, setSlugManual] = useState(!isNovo)

    const form = useForm<ProdutoFormValues>({
        resolver: zodResolver(produtoSchema),
        defaultValues,
    })

    const variacoes = useFieldArray({ control: form.control, name: "variacoes", keyName: "fieldKey" })
    const quantasVariacoes = useWatch({ control: form.control, name: "variacoes" }).length

    const categoriaItems: SelectOption<string | null>[] = [
        { value: null, label: "Sem categoria" },
        ...categorias.map((categoria) => ({ value: categoria.id, label: categoria.nome })),
    ]

    return (
        <form id="produto-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <Section title="Produto">
                <div className="grid gap-5 sm:grid-cols-2">
                    <Controller
                        name="nome"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                                <FieldLabel htmlFor="produto-nome">Nome</FieldLabel>
                                <Input
                                    {...field}
                                    id="produto-nome"
                                    size="xl"
                                    maxLength={LIMITS.PRODUTO_NOME}
                                    disabled={isPending}
                                    onChange={(event) => {
                                        field.onChange(event)
                                        if (!slugManual) form.setValue("slug", slugify(event.target.value))
                                    }}
                                    aria-invalid={fieldState.invalid}
                                />
                                <FieldError errors={[fieldState.error]} />
                            </Field>
                        )}
                    />

                    <Controller
                        name="slug"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="produto-slug">Endereço na loja</FieldLabel>
                                <div className="flex items-center rounded-lg border bg-muted/50 pl-3 text-sm text-muted-foreground focus-within:ring-3 focus-within:ring-ring/30">
                                    <span className="shrink-0">/produto/</span>
                                    <Input
                                        {...field}
                                        id="produto-slug"
                                        size="xl"
                                        className="border-0 bg-transparent pl-0.5 shadow-none focus-visible:ring-0"
                                        disabled={isPending}
                                        onChange={(event) => {
                                            setSlugManual(true)
                                            field.onChange(event.target.value.toLowerCase())
                                        }}
                                        aria-invalid={fieldState.invalid}
                                    />
                                </div>
                                {fieldState.error ? (
                                    <FieldError errors={[fieldState.error]} />
                                ) : (
                                    <FieldDescription>
                                        {isNovo ? "Sai do nome." : "Mudar quebra os links já compartilhados."}
                                    </FieldDescription>
                                )}
                            </Field>
                        )}
                    />

                    <Controller
                        name="categoriaId"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="produto-categoria">Categoria</FieldLabel>
                                <Select
                                    items={categoriaItems}
                                    value={field.value}
                                    onValueChange={(value) => field.onChange(value)}
                                    disabled={isPending}
                                >
                                    <SelectTrigger id="produto-categoria" size="xl" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categoriaItems.map((item) => (
                                            <SelectItem key={String(item.value)} value={item.value}>
                                                {item.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FieldError errors={[fieldState.error]} />
                            </Field>
                        )}
                    />

                    <Controller
                        name="descricao"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                                <FieldLabel htmlFor="produto-descricao">Descrição</FieldLabel>
                                <Textarea
                                    {...field}
                                    id="produto-descricao"
                                    rows={4}
                                    maxLength={LIMITS.PRODUTO_DESCRICAO}
                                    placeholder="Material, medidas, o que vem no pacote..."
                                    disabled={isPending}
                                    aria-invalid={fieldState.invalid}
                                />
                                <FieldError errors={[fieldState.error]} />
                            </Field>
                        )}
                    />

                    <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:gap-8">
                        <Controller
                            name="ativo"
                            control={form.control}
                            render={({ field }) => (
                                <Field orientation="horizontal" className="w-auto">
                                    <Switch
                                        id="produto-ativo"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        disabled={isPending}
                                    />
                                    <FieldLabel htmlFor="produto-ativo" className="font-normal">
                                        À venda na vitrine
                                    </FieldLabel>
                                </Field>
                            )}
                        />
                        <Controller
                            name="destaque"
                            control={form.control}
                            render={({ field }) => (
                                <Field orientation="horizontal" className="w-auto">
                                    <Switch
                                        id="produto-destaque"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        disabled={isPending}
                                    />
                                    <FieldLabel htmlFor="produto-destaque" className="font-normal">
                                        Destaque (aparece no topo)
                                    </FieldLabel>
                                </Field>
                            )}
                        />
                    </div>
                </div>
            </Section>

            <Section title="Fotos" description="A primeira é a capa: aparece na vitrine e na prévia do link no WhatsApp.">
                <Controller
                    name="fotos"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FotosUploadField
                                id="produto-fotos"
                                value={field.value}
                                onChange={field.onChange}
                                disabled={isPending}
                            />
                            <FieldError errors={[fieldState.error]} />
                        </Field>
                    )}
                />
            </Section>

            <Section
                title="Preço e estoque"
                description="Uma linha por opção que o cliente escolhe (tamanho, cor...). Produto sem opções fica com uma linha só. Estoque vazio = sem controle."
            >
                {quantasVariacoes > 1 && (
                    <Controller
                        name="rotuloVariacao"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid} className="sm:max-w-xs">
                                <FieldLabel htmlFor="produto-rotulo-variacao">Nome da escolha</FieldLabel>
                                <Input
                                    {...field}
                                    id="produto-rotulo-variacao"
                                    size="xl"
                                    placeholder="Tamanho, Cor, Sabor..."
                                    maxLength={LIMITS.ROTULO_VARIACAO}
                                    disabled={isPending}
                                    aria-invalid={fieldState.invalid}
                                />
                                <FieldError errors={[fieldState.error]} />
                            </Field>
                        )}
                    />
                )}

                <ul className="flex flex-col gap-3">
                    {variacoes.fields.map((variacao, index) => (
                        <li
                            key={variacao.fieldKey}
                            className="grid grid-cols-2 items-start gap-3 rounded-xl border bg-background-muted p-3 sm:grid-cols-[1.4fr_1fr_1fr_0.8fr_auto_auto]"
                        >
                            <Controller
                                name={`variacoes.${index}.rotulo`}
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid} className="col-span-2 sm:col-span-1">
                                        <FieldLabel htmlFor={`produto-variacao-${index}-rotulo`}>Opção</FieldLabel>
                                        <Input
                                            {...field}
                                            id={`produto-variacao-${index}-rotulo`}
                                            placeholder={quantasVariacoes > 1 ? "Ex.: M, Azul" : "Opcional"}
                                            maxLength={LIMITS.VARIACAO_ROTULO}
                                            disabled={isPending}
                                            className="bg-background"
                                            aria-invalid={fieldState.invalid}
                                        />
                                        <FieldError errors={[fieldState.error]} />
                                    </Field>
                                )}
                            />
                            <Controller
                                name={`variacoes.${index}.preco`}
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor={`produto-variacao-${index}-preco`}>Preço</FieldLabel>
                                        <CurrencyInput
                                            {...field}
                                            id={`produto-variacao-${index}-preco`}
                                            placeholder="R$ 0,00"
                                            disabled={isPending}
                                            className="bg-background"
                                            aria-invalid={fieldState.invalid}
                                        />
                                        <FieldError errors={[fieldState.error]} />
                                    </Field>
                                )}
                            />
                            <Controller
                                name={`variacoes.${index}.precoDe`}
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor={`produto-variacao-${index}-preco-de`}>Preço “de”</FieldLabel>
                                        <CurrencyInput
                                            {...field}
                                            id={`produto-variacao-${index}-preco-de`}
                                            placeholder="Opcional"
                                            disabled={isPending}
                                            className="bg-background"
                                            aria-invalid={fieldState.invalid}
                                        />
                                        <FieldError errors={[fieldState.error]} />
                                    </Field>
                                )}
                            />
                            <Controller
                                name={`variacoes.${index}.estoque`}
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor={`produto-variacao-${index}-estoque`}>Estoque</FieldLabel>
                                        <Input
                                            {...field}
                                            id={`produto-variacao-${index}-estoque`}
                                            inputMode="numeric"
                                            placeholder="—"
                                            disabled={isPending}
                                            className="bg-background tabular-nums"
                                            aria-invalid={fieldState.invalid}
                                        />
                                        <FieldError errors={[fieldState.error]} />
                                    </Field>
                                )}
                            />
                            <Controller
                                name={`variacoes.${index}.ativo`}
                                control={form.control}
                                render={({ field }) => (
                                    <Field className="items-start">
                                        <FieldLabel htmlFor={`produto-variacao-${index}-ativo`}>À venda</FieldLabel>
                                        <Switch
                                            id={`produto-variacao-${index}-ativo`}
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={isPending}
                                            className="mt-1.5"
                                        />
                                    </Field>
                                )}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="self-end justify-self-end text-muted-foreground hover:text-destructive sm:mb-0.5"
                                aria-label={`Remover opção ${index + 1}`}
                                disabled={isPending || variacoes.fields.length === 1}
                                onClick={() => variacoes.remove(index)}
                            >
                                <Trash2 />
                            </Button>
                        </li>
                    ))}
                </ul>

                <FieldError errors={[form.formState.errors.variacoes?.root ?? form.formState.errors.variacoes]} />

                {variacoes.fields.length < LIMITS.VARIACOES && (
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="w-fit"
                        disabled={isPending}
                        onClick={() => variacoes.append(VARIACAO_VAZIA)}
                    >
                        <Plus />
                        Adicionar opção
                    </Button>
                )}
            </Section>

            <div className="sticky bottom-0 -mx-4 flex flex-col-reverse gap-2 border-t bg-background/90 p-4 backdrop-blur-md sm:flex-row sm:justify-end lg:-mx-8 lg:px-8">
                <Button type="button" variant="ghost" size="lg" disabled={isPending} onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" size="lg" disabled={isPending}>
                    {isPending && <LoaderCircle className="animate-spin" />}
                    Salvar produto
                </Button>
            </div>
        </form>
    )
}

/** Valores do form → entrada do service: dinheiro em número, vazio em null, fotos novas em Blob. */
export async function toProdutoInput(values: ProdutoFormValues) {
    const fotos = await Promise.all(
        values.fotos.map(async (foto) =>
            foto.path ? { path: foto.path } : { blob: await dataUrlToBlob(foto.dataUrl!) }
        )
    )
    const unica = values.variacoes.length === 1

    return {
        nome: values.nome.trim(),
        slug: values.slug.trim(),
        categoriaId: values.categoriaId,
        descricao: values.descricao.trim() || null,
        rotuloVariacao: unica ? null : values.rotuloVariacao.trim() || null,
        destaque: values.destaque,
        ativo: values.ativo,
        ordem: 0,
        fotos,
        variacoes: values.variacoes.map((variacao) => ({
            id: variacao.id,
            rotulo: variacao.rotulo.trim(),
            preco: parseCurrency(variacao.preco),
            precoDe: variacao.precoDe ? parseCurrency(variacao.precoDe) : null,
            estoque: variacao.estoque.trim() === "" ? null : Number(variacao.estoque),
            ativo: variacao.ativo,
        })),
    }
}
