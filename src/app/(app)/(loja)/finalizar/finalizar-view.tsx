"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, ShoppingBag } from "lucide-react"
import { toast } from "sonner"

import { useCarrinho, useCarrinhoDetalhado } from "~/hooks/use-carrinho"
import { useConfiguracao } from "~/hooks/use-configuracao"
import { useHydrated } from "~/hooks/use-hydrated"
import { TiposEntrega } from "~/lib/constants"
import { describeMutationError } from "~/lib/errors"
import { ABRIR_WHATSAPP_KEY, buildPedidoMensagem, buildWhatsAppUrl } from "~/lib/mensagem"
import { QUERIES, invalidatePedidos, invalidatePerfil, invalidateProdutos } from "~/lib/queries"
import { formatCurrency, maskPhoneInput, onlyDigits, parseCurrency, toNullable } from "~/lib/utils"
import type { Configuracao } from "~/services/configuracoes"
import { getMeuPerfil, updateMeuPerfil, type MeuPerfil } from "~/services/profiles"
import { createPedido } from "~/services/pedidos"
import { Button } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"
import { CarrinhoResumo } from "~/components/loja/carrinho-resumo"
import { toEnderecoInput } from "~/components/forms/endereco-fields"
import {
    FINALIZAR_VAZIO,
    FinalizarForm,
    type FinalizarFormDefaults,
    type FinalizarFormValues,
} from "~/components/forms/finalizar-form"

function toDefaults(perfil: MeuPerfil, configuracao: Configuracao): FinalizarFormDefaults {
    const temEndereco = Boolean(perfil.logradouro)
    const unicoTipo =
        configuracao.aceita_entrega && !configuracao.aceita_retirada
            ? TiposEntrega.ENTREGA
            : !configuracao.aceita_entrega && configuracao.aceita_retirada
              ? TiposEntrega.RETIRADA
              : ""

    return {
        ...FINALIZAR_VAZIO,
        nome: perfil.nome ?? "",
        telefone: maskPhoneInput(perfil.telefone ?? ""),
        tipoEntrega: unicoTipo,
        formaPagamento: configuracao.formas_pagamento.length === 1 ? configuracao.formas_pagamento[0] : "",
        endereco: {
            cep: perfil.cep ? `${perfil.cep.slice(0, 5)}-${perfil.cep.slice(5)}` : "",
            logradouro: perfil.logradouro ?? "",
            numero: perfil.numero ?? "",
            complemento: perfil.complemento ?? "",
            bairro: perfil.bairro ?? "",
            cidade: perfil.cidade ?? "",
            uf: perfil.uf ?? "",
        },
        salvarEndereco: !temEndereco,
    }
}

/** Nome, WhatsApp e (se pedido) o endereço vão para a conta, para o próximo checkout vir pronto. */
async function salvarPerfil(values: FinalizarFormValues, perfil: MeuPerfil) {
    const telefone = onlyDigits(values.telefone)
    const salvarEndereco = values.tipoEntrega === TiposEntrega.ENTREGA && values.salvarEndereco

    if (values.nome === perfil.nome && telefone === perfil.telefone && !salvarEndereco) return

    await updateMeuPerfil({
        nome: values.nome,
        telefone,
        endereco: salvarEndereco ? toEnderecoInput(values.endereco) : undefined,
    })
}

export function FinalizarView() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const hydrated = useHydrated()
    const [enviado, setEnviado] = useState(false)
    const limpar = useCarrinho((state) => state.limpar)
    const { data: configuracao } = useConfiguracao()
    const { itens, linhas, subtotal, isPending: carrinhoPending } = useCarrinhoDetalhado()

    const { data: perfil } = useQuery({
        queryKey: [QUERIES.GET_MEU_PERFIL],
        queryFn: () => getMeuPerfil(),
    })

    const { mutateAsync, isPending } = useMutation({
        mutationFn: (values: FinalizarFormValues) =>
            createPedido({
                tipoEntrega: values.tipoEntrega,
                clienteNome: values.nome.trim(),
                clienteTelefone: onlyDigits(values.telefone),
                endereco: values.tipoEntrega === TiposEntrega.ENTREGA ? toEnderecoInput(values.endereco) : null,
                formaPagamento: values.formaPagamento,
                trocoPara: values.trocoPara ? parseCurrency(values.trocoPara) : null,
                observacoes: toNullable(values.observacoes),
                itens: itens.map((item) => ({ variacao_id: item.variacaoId, quantidade: item.quantidade })),
            }),
        // Pedido feito mexe no estoque do catálogo e no histórico.
        onSettled: () => Promise.all([invalidatePedidos(queryClient), invalidateProdutos(queryClient)]),
    })

    if (!hydrated || !configuracao || !perfil || enviado) {
        return (
            <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_380px]">
                <Skeleton className="h-96 w-full rounded-2xl" />
                <Skeleton className="h-72 w-full rounded-2xl" />
            </div>
        )
    }

    if (!itens.length) {
        return (
            <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
                <div className="grid size-16 place-items-center rounded-full bg-muted">
                    <ShoppingBag className="size-7 text-muted-foreground" />
                </div>
                <h1 className="text-xl font-semibold">Seu carrinho está vazio</h1>
                <p className="text-sm text-muted-foreground">Escolha os produtos e volte aqui para enviar o pedido.</p>
                <Button size="lg" render={<Link href="/" />}>
                    Ver produtos
                </Button>
            </div>
        )
    }

    const loja = configuracao
    const lojaPerfil = perfil
    const bloqueio = !loja.aberta
        ? "A loja está fechada agora. Seu carrinho fica guardado para quando ela abrir."
        : !loja.whatsapp
          ? "A loja ainda não configurou o WhatsApp para receber pedidos."
          : carrinhoPending
            ? "Atualizando os preços do carrinho..."
            : subtotal < loja.pedido_minimo
              ? `O pedido mínimo é ${formatCurrency(loja.pedido_minimo)}. Faltam ${formatCurrency(loja.pedido_minimo - subtotal)}.`
              : null

    async function handleSubmit(values: FinalizarFormValues) {
        if (isPending || !loja.whatsapp) return

        // No computador, a aba do WhatsApp abre já no clique (depois do `await` o navegador
        // bloquearia como pop-up) e recebe o endereço quando o pedido estiver gravado.
        const desktop = window.matchMedia("(pointer: fine)").matches
        const janela = desktop ? window.open("about:blank", "_blank") : null

        if (janela) janela.opener = null

        const promise = mutateAsync(values)

        toast.promise(promise, {
            loading: "Registrando o pedido...",
            success: (pedido) => `Pedido #${pedido.numero} registrado.`,
            error: (error: unknown) => describeMutationError(error),
        })

        try {
            const pedido = await promise
            const url = buildWhatsAppUrl(
                loja.whatsapp,
                buildPedidoMensagem({ pedido, lojaNome: loja.nome, origin: window.location.origin })
            )

            setEnviado(true)
            limpar()
            salvarPerfil(values, lojaPerfil)
                .then(() => invalidatePerfil(queryClient))
                .catch((error: unknown) => console.error("Falha ao salvar os dados da conta:", error))

            if (janela) janela.location.href = url
            else sessionStorage.setItem(ABRIR_WHATSAPP_KEY, pedido.id)

            router.replace(`/conta/pedidos/${pedido.id}?novo=1`)
        } catch {
            janela?.close()
        }
    }

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">
            <Button variant="ghost" size="sm" className="-ml-2 mb-3" render={<Link href="/" />}>
                <ChevronLeft />
                Continuar comprando
            </Button>
            <h1 className="mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">Finalizar pedido</h1>

            <FinalizarForm
                defaultValues={toDefaults(perfil, loja)}
                configuracao={loja}
                isPending={isPending}
                bloqueio={bloqueio}
                onSubmit={handleSubmit}
                resumo={(tipoEntrega) => (
                    <CarrinhoResumo linhas={linhas} subtotal={subtotal} tipoEntrega={tipoEntrega} configuracao={loja} />
                )}
            />
        </div>
    )
}
