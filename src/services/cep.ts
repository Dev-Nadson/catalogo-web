import { ApiError, NETWORK_ERROR_MESSAGE } from "~/lib/errors"
import { onlyDigits } from "~/lib/utils"

type ViaCepResponse = {
    logradouro?: string
    bairro?: string
    localidade?: string
    uf?: string
    erro?: boolean | string
}

type GetEnderecoPorCepInput = {
    cep: string
}

export type GetEnderecoPorCepOutput = {
    logradouro: string
    bairro: string
    cidade: string
    uf: string
} | null

/**
 * Preenche rua, bairro e cidade a partir do CEP (ViaCEP, público e sem chave). Só o CEP sai
 * do navegador. `null` quando o CEP não existe: o cliente digita o endereço à mão.
 */
export async function getEnderecoPorCep({ cep }: GetEnderecoPorCepInput): Promise<GetEnderecoPorCepOutput> {
    const digits = onlyDigits(cep)

    if (digits.length !== 8) return null

    let response: Response

    try {
        response = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
    } catch (error) {
        throw new ApiError(NETWORK_ERROR_MESSAGE, { cause: error })
    }

    if (!response.ok) return null

    const data = (await response.json()) as ViaCepResponse

    if (data.erro) return null

    return {
        logradouro: data.logradouro ?? "",
        bairro: data.bairro ?? "",
        cidade: data.localidade ?? "",
        uf: data.uf ?? "",
    }
}
