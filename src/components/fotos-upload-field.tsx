"use client"

import { useId, useState } from "react"
import { ImagePlus, LoaderCircle, Star, X } from "lucide-react"

import { LIMITS } from "~/lib/constants"
import { fotoUrl } from "~/lib/fotos"
import { compressImage } from "~/lib/image"
import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"

/** Foto já no bucket (`path`) ou recém-escolhida, comprimida no navegador (`dataUrl`). */
export type FotoValue = {
    key: string
    path?: string
    dataUrl?: string
}

type FotosUploadFieldProps = {
    id?: string
    value: FotoValue[]
    onChange: (value: FotoValue[]) => void
    disabled?: boolean
}

/**
 * Até 6 fotos por produto; a primeira é a capa (vitrine, carrinho e prévia do WhatsApp). As
 * fotos são comprimidas aqui (WebP, 1200px) antes de subir.
 */
export function FotosUploadField({ id, value, onChange, disabled }: FotosUploadFieldProps) {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const [lendo, setLendo] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const restantes = LIMITS.PRODUTO_FOTOS - value.length

    async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
        const arquivos = Array.from(event.target.files ?? []).slice(0, restantes)

        setErro(null)
        if (!arquivos.length) return

        setLendo(true)
        try {
            const novas = await Promise.all(
                arquivos.map(async (arquivo) => ({
                    key: crypto.randomUUID(),
                    dataUrl: await compressImage(arquivo, 1200, 0.82),
                }))
            )

            onChange([...value, ...novas])
        } catch {
            setErro("Não foi possível ler uma das imagens.")
        } finally {
            setLendo(false)
            event.target.value = ""
        }
    }

    function tornarCapa(index: number) {
        onChange([value[index], ...value.filter((_, atual) => atual !== index)])
    }

    function remover(index: number) {
        onChange(value.filter((_, atual) => atual !== index))
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {value.map((foto, index) => (
                    <div key={foto.key} className="group relative aspect-square overflow-hidden rounded-xl border bg-muted">
                        <img
                            src={foto.dataUrl ?? fotoUrl(foto.path) ?? undefined}
                            alt={`Foto ${index + 1}`}
                            className="size-full object-cover"
                        />
                        {index === 0 ? (
                            <span className="absolute bottom-1.5 left-1.5 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                                Capa
                            </span>
                        ) : (
                            <Button
                                type="button"
                                size="xs"
                                variant="secondary"
                                className="absolute bottom-1.5 left-1.5 opacity-90"
                                disabled={disabled}
                                onClick={() => tornarCapa(index)}
                            >
                                <Star />
                                Capa
                            </Button>
                        )}
                        <Button
                            type="button"
                            size="icon-xs"
                            variant="secondary"
                            className="absolute top-1.5 right-1.5 rounded-full opacity-90"
                            aria-label={`Remover foto ${index + 1}`}
                            disabled={disabled}
                            onClick={() => remover(index)}
                        >
                            <X />
                        </Button>
                    </div>
                ))}

                {restantes > 0 && (
                    <label
                        htmlFor={inputId}
                        className={cn(
                            "flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed bg-card p-2 text-center text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary",
                            (disabled || lendo) && "pointer-events-none opacity-50"
                        )}
                    >
                        {lendo ? <LoaderCircle className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
                        {lendo ? "Processando..." : "Adicionar fotos"}
                    </label>
                )}
            </div>

            <input
                id={inputId}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                disabled={disabled || lendo}
                onChange={handleFiles}
            />

            {erro && <p className="text-sm text-destructive">{erro}</p>}
        </div>
    )
}
