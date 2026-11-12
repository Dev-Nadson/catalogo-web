import { throwIfError } from "~/lib/errors"
import { BUCKET_CATALOGO, type PastaCatalogo } from "~/lib/fotos"
import { imageExtension } from "~/lib/image"
import { supabase } from "~/lib/supabase"

type UploadImageInput = {
    folder: PastaCatalogo
    blob: Blob
}

/**
 * Nome novo a cada envio (`produtos/<uuid>.webp`): o bucket é público e fica atrás de uma CDN
 * com cache de um ano, então sobrescrever o mesmo nome continuaria mostrando a foto antiga.
 */
export async function uploadImage({ folder, blob }: UploadImageInput): Promise<string> {
    const path = `${folder}/${crypto.randomUUID()}.${imageExtension(blob)}`
    const { error } = await supabase.storage.from(BUCKET_CATALOGO).upload(path, blob, {
        contentType: blob.type || "image/jpeg",
        cacheControl: "31536000",
        upsert: false,
    })

    throwIfError(error)

    return path
}

type RemoveFilesInput = {
    paths: (string | null | undefined)[]
}

/**
 * Limpeza de arquivo órfão: se falhar, o registro já foi salvo/excluído e o usuário não tem
 * o que fazer, então o erro só vai para o console.
 */
export async function removeFiles({ paths }: RemoveFilesInput): Promise<void> {
    const validPaths = paths.filter((path): path is string => Boolean(path))

    if (!validPaths.length) return

    const { error } = await supabase.storage.from(BUCKET_CATALOGO).remove(validPaths)

    if (error) console.error("Falha ao remover arquivos do catálogo:", error)
}
