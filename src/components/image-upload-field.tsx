"use client"

import { useId, useRef, useState } from "react"
import { Camera, ImagePlus, X } from "lucide-react"

import { compressImage } from "~/lib/image"
import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"

type ImageUploadFieldProps = {
    id?: string
    /** Data URL já comprimida, ou `null`. */
    value: string | null
    onChange: (value: string | null) => void
    /** Imagem atual (link assinado), exibida enquanto nenhuma nova é escolhida. */
    currentUrl?: string | null
    /** Com a imagem atual na tela, mostra o botão de removê-la. */
    onRemoveCurrent?: () => void
    disabled?: boolean
    invalid?: boolean
    maxSize?: number
    quality?: number
    emptyLabel?: string
}

export function ImageUploadField({
    id,
    value,
    onChange,
    currentUrl,
    onRemoveCurrent,
    disabled,
    invalid,
    maxSize,
    quality,
    emptyLabel = "Escolher imagem",
}: ImageUploadFieldProps) {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const inputRef = useRef<HTMLInputElement>(null)
    const [error, setError] = useState<string | null>(null)
    const [isReading, setIsReading] = useState(false)

    const preview = value ?? currentUrl ?? null

    async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]

        setError(null)
        if (!file) return

        setIsReading(true)
        try {
            onChange(await compressImage(file, maxSize, quality))
        } catch {
            setError("Não foi possível ler essa imagem.")
        } finally {
            setIsReading(false)
            event.target.value = ""
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <input
                ref={inputRef}
                id={inputId}
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={disabled}
                onChange={handleFile}
                aria-invalid={invalid}
            />

            {preview ? (
                <div className="relative overflow-hidden rounded-xl border bg-muted">
                    <img src={preview} alt="Prévia" className="max-h-64 w-full object-contain" />
                    <div className="absolute top-2 right-2 flex gap-1.5">
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={disabled || isReading}
                            onClick={() => inputRef.current?.click()}
                        >
                            <Camera />
                            Trocar
                        </Button>
                        {(value || onRemoveCurrent) && (
                            <Button
                                type="button"
                                size="icon-sm"
                                variant="secondary"
                                aria-label={value ? "Remover imagem escolhida" : "Remover imagem"}
                                disabled={disabled}
                                onClick={() => (value ? onChange(null) : onRemoveCurrent?.())}
                            >
                                <X />
                            </Button>
                        )}
                    </div>
                </div>
            ) : (
                <label
                    htmlFor={inputId}
                    className={cn(
                        "flex h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-card text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary",
                        invalid && "border-destructive text-destructive",
                        disabled && "pointer-events-none opacity-50"
                    )}
                >
                    <ImagePlus className="size-6" />
                    {isReading ? "Processando imagem..." : emptyLabel}
                </label>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    )
}
