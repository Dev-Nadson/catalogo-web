import { assertAffected, throwIfError } from "~/lib/errors"
import { supabase } from "~/lib/supabase"
import type { Database } from "~/typings/database"

export type Categoria = Database["public"]["Tables"]["categorias"]["Row"]

export type ListCategoriasOutput = Categoria[]

/** Poucas e públicas: vem tudo, na ordem que o admin definiu. */
export async function listCategorias(): Promise<ListCategoriasOutput> {
    const { data, error } = await supabase
        .from("categorias")
        .select("id, nome, slug, ordem, criado_em")
        .order("ordem")
        .order("nome")

    throwIfError(error)

    return data ?? []
}

type CreateCategoriaInput = {
    nome: string
    slug: string
    ordem: number
}

export async function createCategoria({ nome, slug, ordem }: CreateCategoriaInput): Promise<void> {
    const { data, error } = await supabase.from("categorias").insert({ nome, slug, ordem }).select("id")

    throwIfError(error)
    assertAffected(data)
}

type UpdateCategoriaInput = CreateCategoriaInput & {
    categoriaId: string
}

export async function updateCategoria({ categoriaId, nome, slug, ordem }: UpdateCategoriaInput): Promise<void> {
    const { data, error } = await supabase
        .from("categorias")
        .update({ nome, slug, ordem })
        .eq("id", categoriaId)
        .select("id")

    throwIfError(error)
    assertAffected(data)
}

type DeleteCategoriaInput = {
    categoriaId: string
}

/** Os produtos da categoria ficam sem categoria (`on delete set null`), não somem. */
export async function deleteCategoria({ categoriaId }: DeleteCategoriaInput): Promise<void> {
    const { data, error } = await supabase.from("categorias").delete().eq("id", categoriaId).select("id")

    throwIfError(error)
    assertAffected(data)
}
