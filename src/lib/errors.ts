export const DEFAULT_ERROR_MESSAGE =
    "Algo deu errado. Tente novamente."

export const NETWORK_ERROR_MESSAGE =
    "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente."

export const RATE_LIMIT_MESSAGE =
    "Muitas tentativas seguidas. Aguarde um minuto e tente de novo."

export const FORBIDDEN_MESSAGE =
    "Você não tem permissão para esta ação."

export const INVALID_CREDENTIALS_MESSAGE =
    "E-mail ou senha incorretos."

export const EMAIL_NOT_CONFIRMED_MESSAGE =
    "Confirme seu e-mail pelo link que enviamos antes de entrar."

export const SESSION_EXPIRED_MESSAGE =
    "Sua sessão expirou. Entre novamente."

export const INVALID_FORM_MESSAGE =
    "Verifique os dados informados e tente novamente."

export const DUPLICATED_MESSAGE =
    "Já existe um registro com esses dados."

export const IN_USE_MESSAGE =
    "Não é possível excluir: ainda há registros ligados a este item."


/**
 * Erro único para PostgREST, Auth e Storage. Os três clientes do supabase-js devolvem formas
 * diferentes (`code` string do Postgres, `status` HTTP, `statusCode` do Storage); os
 * serviços convertem tudo aqui para que as telas tratem um tipo só.
 */
export class ApiError extends Error {
    readonly status?: number
    readonly code?: string
    readonly serverMessage?: string

    constructor(
        message: string,
        options?: {
            status?: number
            code?: string
            serverMessage?: string
            cause?: unknown
        }
    ) {
        super(message, { cause: options?.cause })

        this.name = "ApiError"
        this.status = options?.status
        this.code = options?.code
        this.serverMessage = options?.serverMessage
    }
}

type SupabaseLikeError = {
    message?: string
    code?: string
    status?: number
    statusCode?: string | number
}

/** `PGRST116` é o "nenhuma linha" do `.single()` — para a tela, um 404. */
const NOT_FOUND_CODES = new Set(["PGRST116"])

export function toApiError(error: unknown): ApiError {
    if (error instanceof ApiError) return error

    if (error instanceof TypeError) {
        return new ApiError(NETWORK_ERROR_MESSAGE, { cause: error })
    }

    const source = (error ?? {}) as SupabaseLikeError
    const code = source.code
    let status = source.status ?? (source.statusCode ? Number(source.statusCode) : undefined)

    if (code && NOT_FOUND_CODES.has(code)) status = 404

    return new ApiError(source.message ?? DEFAULT_ERROR_MESSAGE, {
        status,
        code,
        serverMessage: source.message,
        cause: error,
    })
}

/** Lança o erro de uma resposta do supabase-js já convertido. */
export function throwIfError(error: unknown): void {
    if (error) throw toApiError(error)
}

function isForbidden(error: ApiError) {
    return (
        error.code === "42501" ||
        error.status === 403 ||
        /row-level security|permission denied/i.test(error.serverMessage ?? "")
    )
}

/**
 * `raise exception` dos triggers (`pedidos_criar`, `pedidos_protect`) já vem com a mensagem
 * pronta para a tela: "Só restam 2 unidade(s) de...", "A loja está fechada no momento.".
 */
const RAISED_EXCEPTION_CODE = "P0001"

export function describeMutationError(error: unknown) {
    const apiError = toApiError(error)

    if (apiError.message === NETWORK_ERROR_MESSAGE) return NETWORK_ERROR_MESSAGE
    if (apiError.code === RAISED_EXCEPTION_CODE && apiError.serverMessage) return apiError.serverMessage
    if (isForbidden(apiError)) return FORBIDDEN_MESSAGE
    if (apiError.code === "23505") return DUPLICATED_MESSAGE
    if (apiError.code === "23503") return IN_USE_MESSAGE
    if (apiError.code === "23514" || apiError.code === "22P02") return INVALID_FORM_MESSAGE
    if (apiError.status === 401) return SESSION_EXPIRED_MESSAGE
    if (apiError.status === 429) return RATE_LIMIT_MESSAGE

    return DEFAULT_ERROR_MESSAGE
}

/** Salvar produto: o único "duplicado" possível é o endereço (slug) já usado por outro produto. */
export function describeProdutoError(error: unknown) {
    const apiError = toApiError(error)

    if (apiError.code === "23505") return "Já existe um produto com esse endereço na loja. Mude o endereço."

    return describeMutationError(error)
}

export function describeSigninError(error: unknown) {
    const apiError = toApiError(error)

    if (apiError.message === NETWORK_ERROR_MESSAGE) return NETWORK_ERROR_MESSAGE
    if (apiError.code === "email_not_confirmed") return EMAIL_NOT_CONFIRMED_MESSAGE
    if (apiError.status === 429) return RATE_LIMIT_MESSAGE

    return INVALID_CREDENTIALS_MESSAGE
}

export function describeSignupError(error: unknown) {
    const apiError = toApiError(error)

    if (apiError.message === NETWORK_ERROR_MESSAGE) return NETWORK_ERROR_MESSAGE
    if (apiError.code === "user_already_exists" || apiError.code === "email_exists") {
        return "Já existe uma conta com esse e-mail."
    }
    if (apiError.code === "weak_password") return "Senha fraca. Use ao menos 8 caracteres, com letras e números."
    if (apiError.code === "signup_disabled") return "O cadastro está desativado no momento."
    if (apiError.status === 429) return RATE_LIMIT_MESSAGE

    return apiError.serverMessage ?? DEFAULT_ERROR_MESSAGE
}

/** Recuperar senha, reenviar confirmação e trocar a senha. */
export function describeAuthError(error: unknown) {
    const apiError = toApiError(error)

    if (apiError.message === NETWORK_ERROR_MESSAGE) return NETWORK_ERROR_MESSAGE
    if (apiError.status === 429 || apiError.code === "over_email_send_rate_limit") return RATE_LIMIT_MESSAGE
    if (apiError.code === "same_password") return "A nova senha precisa ser diferente da atual."
    if (apiError.code === "weak_password") return "Senha fraca. Use ao menos 8 caracteres, com letras e números."
    if (apiError.status === 401 || apiError.code === "session_not_found") return SESSION_EXPIRED_MESSAGE

    return DEFAULT_ERROR_MESSAGE
}

/**
 * Update/delete barrado pelo RLS não dá erro no PostgREST: só afeta zero linhas. Com
 * `.select("id")` na mutação, zero linhas vira um 403 explícito.
 */
export function assertAffected(rows: unknown[] | null): void {
    if (!rows?.length) {
        throw new ApiError(FORBIDDEN_MESSAGE, { status: 403, serverMessage: FORBIDDEN_MESSAGE })
    }
}
