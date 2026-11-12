import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function toNullable(value: string | null | undefined) {
    if (value === null || value === undefined) return null

    return value.trim() === "" ? null : value.trim()
}

export function onlyDigits(value: string) {
    return value.replace(/\D/g, "")
}

function pad(value: number) {
    return String(value).padStart(2, "0")
}

/** Data local → `YYYY-MM-DD` (o formato das colunas `date` e do `<input type="date">`). */
export function toDateKey(date: Date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function today() {
    return toDateKey(new Date())
}

/** Soma dias a uma data `YYYY-MM-DD`, no calendário local. */
export function addDays(dateKey: string, amount: number) {
    const [year, month, day] = dateKey.split("-").map(Number)

    return toDateKey(new Date(year, month - 1, day + amount))
}

/** "Ana Maria Souza" → "Ana", para as saudações. */
export function firstName(value: string | null | undefined) {
    return value?.trim().split(/\s+/)[0] ?? ""
}

/** `pluralize(1, "cupom", "cupons")` → "1 cupom"; `pluralize(3, ...)` → "3 cupons". */
export function pluralize(count: number, singular: string, plural: string) {
    return `${count} ${count === 1 ? singular : plural}`
}

/**
 * `YYYY-MM-DD` (coluna `date`) → `DD/MM/AAAA`. Separa a string em vez de usar `new Date`, que
 * leria a data como meia-noite UTC e mostraria o dia anterior no Brasil.
 */
export function formatDay(value: string | null | undefined) {
    if (!value) return "—"

    const [year, month, day] = value.slice(0, 10).split("-")

    if (!year || !month || !day) return value

    return `${day}/${month}/${year}`
}

/** ISO 8601 com hora (`criado_em` e afins) → data e hora no fuso do usuário. */
export function formatTimestamp(value: string | null | undefined) {
    if (!value) return "—"

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return value

    return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
}

/** Só a hora quando foi hoje ("14:32"); data e hora quando foi antes ("03/10, 14:32"). */
export function formatSince(value: string | null | undefined) {
    if (!value) return null

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return null

    const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

    if (date.toDateString() === new Date().toDateString()) return time

    return `${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}, ${time}`
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
})

export function formatCurrency(value: number | null | undefined) {
    if (value === null || value === undefined) return "—"

    return currencyFormatter.format(value)
}

/**
 * Aceita "1.234,56", "1234,56", "1234.56" e "R$ 10". Com vírgula, o ponto é separador de
 * milhar; sem vírgula, o ponto é decimal.
 */
export function parseCurrency(value: string) {
    let normalized = value.trim().replace(/[R$\s]/g, "")

    if (normalized.includes(",")) {
        normalized = normalized.replace(/\./g, "").replace(",", ".")
    }

    const parsed = Number.parseFloat(normalized)

    return Number.isFinite(parsed) ? parsed : Number.NaN
}

/** Só aceita caminhos internos, para o `?redirect=` não virar redirecionamento aberto. */
export function sanitizeRedirect(value: string | null | undefined, fallback: string) {
    if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback

    return value
}

/** Tira o que quebraria o filtro `.or()` do PostgREST (vírgula, parênteses, curingas). */
export function sanitizeSearch(value: string) {
    return value.replace(/[,()*%\\]/g, " ").trim()
}

/** "81991649060" → "(81) 99164-9060". O banco guarda só os dígitos (DDD + número). */
export function formatPhone(value: string | null | undefined) {
    if (!value) return "—"

    const digits = onlyDigits(value)

    if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`

    return value
}

/** Valor do campo de dinheiro enquanto digita: só dígitos, lidos como centavos. */
export function maskCurrencyInput(value: string) {
    const digits = onlyDigits(value).replace(/^0+/, "").slice(0, 11)

    if (!digits) return ""

    return formatCurrency(Number(digits) / 100)
}

/** Número do banco → texto do campo de dinheiro ("R$ 4.500,00"). */
export function toCurrencyInput(value: number | null | undefined) {
    if (value === null || value === undefined) return ""

    return formatCurrency(value)
}

/** Primeira letra de cada nome, para avatares e monogramas. */
export function initials(value: string | null | undefined) {
    const parts = (value ?? "").trim().split(/\s+/).filter(Boolean)

    if (!parts.length) return ""

    return `${parts[0][0]}${parts.length > 1 ? parts.at(-1)![0] : ""}`.toUpperCase()
}

/** "50000000" → "50000-000". */
export function formatCep(value: string | null | undefined) {
    const digits = onlyDigits(value ?? "")

    if (digits.length !== 8) return value ?? ""

    return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

/** Máscara do telefone enquanto digita: "(81) 99999-0000". */
export function maskPhoneInput(value: string) {
    const digits = onlyDigits(value).slice(0, 11)

    if (digits.length <= 2) return digits.length ? `(${digits}` : ""
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`

    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

/** Máscara do CEP enquanto digita: "50000-000". */
export function maskCepInput(value: string) {
    const digits = onlyDigits(value).slice(0, 8)

    return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
}

/** Sem acento e em minúsculas, para a busca da vitrine achar "pão" digitando "pao". */
export function normalizeSearch(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
}

/** "Camiseta Básica (P)" → "camiseta-basica-p". Mesmo formato do `check` de `slug` no banco. */
export function slugify(value: string) {
    return normalizeSearch(value)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80)
        .replace(/-+$/g, "")
}
