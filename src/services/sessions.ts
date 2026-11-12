import { Roles, type Role } from "~/lib/constants"
import { throwIfError } from "~/lib/errors"
import { supabase } from "~/lib/supabase"

export type GetSessionMeOutput = {
    user_id: string
    email: string
    nome: string
    /** Sem perfil (ainda sendo criado pelo trigger), conta como cliente. */
    role: Role
}

/** `null` quando não há sessão: o `RequireSession` manda para o login. */
export async function getSessionMe(): Promise<GetSessionMeOutput | null> {
    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (!session) return null

    const { data: profile, error } = await supabase
        .from("profiles")
        .select("nome, role")
        .eq("id", session.user.id)
        .maybeSingle()

    throwIfError(error)

    const email = session.user.email ?? ""

    return {
        user_id: session.user.id,
        email,
        nome: profile?.nome ?? email.split("@")[0],
        role: profile?.role ?? Roles.CLIENTE,
    }
}

type CreateSessionInput = {
    email: string
    password: string
}

export async function createSession({ email, password }: CreateSessionInput): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    throwIfError(error)
}

type CreateAccountInput = {
    nome: string
    telefone: string
    email: string
    password: string
    /** Para onde o link de confirmação leva de volta (ex.: /finalizar). */
    redirect: string | null
}

export type CreateAccountOutput = {
    /** O projeto exige confirmação de e-mail: a conta existe, mas ainda não há sessão. */
    needsConfirmation: boolean
}

/**
 * Toda conta nova é de cliente (`handle_new_user`). Nome e telefone vão no metadado e viram o
 * perfil, que preenche o checkout.
 */
export async function createAccount({
    nome,
    telefone,
    email,
    password,
    redirect,
}: CreateAccountInput): Promise<CreateAccountOutput> {
    const volta = redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { nome, telefone },
            emailRedirectTo: `${window.location.origin}/entrar${volta}`,
        },
    })

    throwIfError(error)

    return { needsConfirmation: !data.session }
}

export async function deleteSession(): Promise<void> {
    const { error } = await supabase.auth.signOut()

    throwIfError(error)
}

type ResendConfirmationInput = {
    email: string
}

export async function resendConfirmation({ email }: ResendConfirmationInput): Promise<void> {
    const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/entrar` },
    })

    throwIfError(error)
}

type SendPasswordResetInput = {
    email: string
}

export async function sendPasswordReset({ email }: SendPasswordResetInput): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
    })

    throwIfError(error)
}

type UpdatePasswordInput = {
    password: string
}

/** Usada na volta do link de recuperação (que já chega com a sessão aberta) e em Minha conta. */
export async function updatePassword({ password }: UpdatePasswordInput): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password })

    throwIfError(error)
}
