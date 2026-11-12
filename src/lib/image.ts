/**
 * Redimensiona e converte antes do upload. Foto de celular chega com 3–8 MB; nos slides,
 * 1600px no lado maior em WebP fica abaixo de 300 KB sem perda visível.
 *
 * O Safari não gera WebP pelo canvas (devolve PNG). Lá, PNG continua PNG (o logo precisa do
 * fundo transparente) e o resto cai para JPEG.
 */
export function compressImage(file: File, maxSize = 1600, quality = 0.85) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()

        reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."))
        reader.onload = () => {
            const image = new Image()

            image.onerror = () => reject(new Error("Arquivo não é uma imagem válida."))
            image.onload = () => {
                const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
                const canvas = document.createElement("canvas")

                canvas.width = Math.round(image.width * scale)
                canvas.height = Math.round(image.height * scale)
                canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height)

                const webp = canvas.toDataURL("image/webp", quality)

                if (webp.startsWith("data:image/webp")) {
                    resolve(webp)
                    return
                }

                resolve(
                    file.type === "image/png"
                        ? canvas.toDataURL("image/png")
                        : canvas.toDataURL("image/jpeg", quality)
                )
            }
            image.src = String(reader.result)
        }

        reader.readAsDataURL(file)
    })
}

export async function dataUrlToBlob(dataUrl: string) {
    const response = await fetch(dataUrl)

    return response.blob()
}

export function imageExtension(blob: Blob) {
    if (blob.type === "image/webp") return "webp"
    if (blob.type === "image/png") return "png"

    return "jpg"
}
