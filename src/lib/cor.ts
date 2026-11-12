import { COR_PADRAO } from "~/lib/constants"

const HEX = /^#[0-9a-fA-F]{6}$/

function luminancia(hex: string) {
    const [r, g, b] = [1, 3, 5].map((inicio) => {
        const canal = Number.parseInt(hex.slice(inicio, inicio + 2), 16) / 255

        return canal <= 0.03928 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4
    })

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contraste(a: number, b: number) {
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/**
 * Texto por cima da cor da marca: branco ou quase preto, o que tiver mais contraste. A loja
 * escolhe qualquer cor, e um amarelo-claro com texto branco ficaria ilegível.
 */
export function foregroundFor(hex: string) {
    const fundo = luminancia(hex)
    const branco = 1
    const escuro = luminancia("#111827")

    return contraste(fundo, branco) >= contraste(fundo, escuro) ? "#ffffff" : "#111827"
}

/** Variáveis do tema com a cor da loja, aplicadas no layout do site e do painel. */
export function brandStyle(cor: string | null | undefined): React.CSSProperties {
    const primary = cor && HEX.test(cor) ? cor : COR_PADRAO

    return {
        "--primary": primary,
        "--primary-foreground": foregroundFor(primary),
        "--ring": primary,
        "--sidebar-primary": primary,
        "--sidebar-primary-foreground": foregroundFor(primary),
        "--sidebar-ring": primary,
    } as React.CSSProperties
}
