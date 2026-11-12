"use client"

import { cn, maskCurrencyInput } from "~/lib/utils"
import { Input } from "~/components/ui/input"

type CurrencyInputProps = Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "inputMode"> & {
    value: string
    onChange: (value: string) => void
}

/**
 * Dinheiro digitado como numa maquininha: os dígitos entram pela direita como centavos
 * ("450000" → "R$ 4.500,00"). O form guarda o texto e converte com `parseCurrency`.
 */
export function CurrencyInput({ value, onChange, className, ...props }: CurrencyInputProps) {
    return (
        <Input
            {...props}
            value={value}
            inputMode="numeric"
            autoComplete="off"
            onChange={(event) => onChange(maskCurrencyInput(event.target.value))}
            className={cn("tabular-nums", className)}
        />
    )
}
