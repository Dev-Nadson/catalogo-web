import { useCallback, useEffect, useRef } from "react"

/**
 * Adia a chamada até o usuário parar de digitar. Usado nos campos de busca das
 * listagens, onde cada tecla dispararia uma requisição.
 *
 * A callback é lida de uma ref, então não precisa estar memoizada no chamador —
 * a função devolvida é estável.
 */
export function useDebouncedCallback<TArgs extends unknown[]>(
    callback: (...args: TArgs) => void,
    delay = 300
) {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const callbackRef = useRef(callback)

    useEffect(() => {
        callbackRef.current = callback
    }, [callback])

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [])

    return useCallback(
        (...args: TArgs) => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)

            timeoutRef.current = setTimeout(() => {
                callbackRef.current(...args)
            }, delay)
        },
        [delay]
    )
}
