import { COR_ESCURA_PADRAO, COR_PADRAO } from "~/lib/constants"

const HEX = /^#[0-9a-fA-F]{6}$/

/** Contraste mínimo (WCAG AA) do texto com o fundo branco. */
const CONTRASTE_TEXTO = 4.5

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

/** Contraste mínimo para texto de botão (semibold): o AA de texto grande. */
const CONTRASTE_BOTAO = 3

/**
 * Texto por cima da cor da marca. Branco sempre que dá para ler (≥ 3:1, como o laranja da
 * Noronha); senão, o que tiver mais contraste. A loja escolhe qualquer cor, e um
 * amarelo-claro com texto branco ficaria ilegível.
 */
export function foregroundFor(hex: string) {
    const fundo = luminancia(hex)
    const branco = 1
    const escuro = luminancia(COR_ESCURA_PADRAO)

    if (contraste(fundo, branco) >= CONTRASTE_BOTAO) return "#ffffff"

    return contraste(fundo, branco) >= contraste(fundo, escuro) ? "#ffffff" : COR_ESCURA_PADRAO
}

/**
 * A cor escura vira a cor de todo texto e o fundo do rodapé. Se a loja escolher uma cor clara
 * demais para ler sobre o branco, fica a padrão: a marca não pode custar a leitura.
 */
export function corEscuraLegivel(hex: string | null | undefined) {
    if (!hex || !HEX.test(hex)) return COR_ESCURA_PADRAO

    return contraste(luminancia(hex), 1) >= CONTRASTE_TEXTO ? hex : COR_ESCURA_PADRAO
}

/** Variáveis do tema com as cores da loja, aplicadas no `<body>` (vale também para os portais). */
export function brandStyle(cor: string | null | undefined, corEscura?: string | null): React.CSSProperties {
    const primary = cor && HEX.test(cor) ? cor : COR_PADRAO
    const escura = corEscuraLegivel(corEscura)

    return {
        "--primary": primary,
        "--primary-foreground": foregroundFor(primary),
        "--ring": primary,
        "--sidebar-primary": primary,
        "--sidebar-primary-foreground": foregroundFor(primary),
        "--sidebar-ring": primary,
        "--marca-escura": escura,
        "--foreground": escura,
        "--card-foreground": escura,
        "--popover-foreground": escura,
        "--secondary-foreground": escura,
        "--accent-foreground": escura,
        "--sidebar-foreground": escura,
    } as React.CSSProperties
}
