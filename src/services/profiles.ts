import { STAFF_ROLES, type Role } from "~/lib/constants"
import { ApiError, assertAffected, throwIfError } from "~/lib/errors"
import { supabase } from "~/lib/supabase"
import type { Database } from "~/typings/database"

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export type MeuPerfil = Pick<
    Profile,
    "id" | "nome" | "email" | "telefone" | "cep" | "logradouro" | "numero" | "complemento" | "bairro" | "cidade" | "uf"
>

const MEU_PERFIL_SELECT = "id, nome, email, telefone, cep, logradouro, numero, complemento, bairro, cidade, uf"

export type GetMeuPerfilOutput = MeuPerfil

export async function getMeuPerfil(): Promise<GetMeuPerfilOutput> {
    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (!session) throw new ApiError("Entre na sua conta.", { status: 401 })

    const { data, error } = await supabase
        .from("profiles")
        .select(MEU_PERFIL_SELECT)
        .eq("id", session.user.id)
        .single()

    throwIfError(error)

    return data!
}

type UpdateMeuPerfilInput = {
    nome?: string
    telefone?: string
    endereco?: {
        cep: string | null
        logradouro: string | null
        numero: string | null
        complemento: string | null
        bairro: string | null
        cidade: string | null
        uf: string | null
    }
}

/** Dados e endereço padrão do próprio cliente. O `profiles_protect` barra o resto. */
export async function updateMeuPerfil({ nome, telefone, endereco }: UpdateMeuPerfilInput): Promise<void> {
    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (!session) throw new ApiError("Entre na sua conta.", { status: 401 })

    const { data, error } = await supabase
        .from("profiles")
        .update({ ...(nome !== undefined && { nome }), ...(telefone !== undefined && { telefone }), ...endereco })
        .eq("id", session.user.id)
        .select("id")

    throwIfError(error)
    assertAffected(data)
}

export type MembroEquipe = Pick<Profile, "id" | "nome" | "email" | "role" | "criado_em">

export type ListEquipeOutput = MembroEquipe[]

/** Admins primeiro, depois atendentes, por nome. */
export async function listEquipe(): Promise<ListEquipeOutput> {
    const { data, error } = await supabase
        .from("profiles")
        .select("id, nome, email, role, criado_em")
        .in("role", [...STAFF_ROLES])
        .order("role")
        .order("nome")

    throwIfError(error)

    return data ?? []
}

type FindProfileByEmailInput = {
    email: string
}

export type FindProfileByEmailOutput = MembroEquipe | null

/** Para adicionar alguém à equipe: a pessoa precisa ter criado a conta antes. */
export async function findProfileByEmail({ email }: FindProfileByEmailInput): Promise<FindProfileByEmailOutput> {
    const { data, error } = await supabase
        .from("profiles")
        .select("id, nome, email, role, criado_em")
        .ilike("email", email.trim().replace(/[%_\\]/g, "\\$&"))
        .maybeSingle()

    throwIfError(error)

    return data
}

type UpdateProfileRoleInput = {
    profileId: string
    role: Role
}

/** Só o admin, e nunca o próprio papel (`profiles_protect`). Tirar da equipe = voltar a cliente. */
export async function updateProfileRole({ profileId, role }: UpdateProfileRoleInput): Promise<void> {
    const { data, error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", profileId)
        .select("id")

    throwIfError(error)
    assertAffected(data)
}
