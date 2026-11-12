import { useSyncExternalStore } from "react"

function subscribe() {
    return () => {}
}

/**
 * `false` no servidor e na hidratação, `true` depois. O carrinho vem do localStorage, que o
 * servidor não enxerga: mostrar a contagem antes disso daria erro de hidratação.
 */
export function useHydrated() {
    return useSyncExternalStore(
        subscribe,
        () => true,
        () => false
    )
}
