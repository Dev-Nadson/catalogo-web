import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

import type { Database } from "~/typings/database"

/**
 * Telas que exigem login. O resto (vitrine, produto, carrinho, telas de acesso) é público:
 * olhar e montar o carrinho não pede conta, só finalizar.
 */
const PROTECTED_PATHS = ["/painel", "/conta", "/finalizar"]

function isProtectedPath(pathname: string) {
    return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

/**
 * Renova a sessão do Supabase (o cookie do token) a cada navegação e manda quem não tem login
 * para /entrar, com a volta em `?redirect=`. Papel é conferido nas telas e, de verdade, no RLS.
 */
export async function proxy(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    // Sem configuração, o app mostra a tela de MissingConfig.
    if (!supabaseUrl || !supabaseKey) return NextResponse.next({ request })

    let response = NextResponse.next({ request })

    const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll()
            },
            setAll(cookiesToSet, headers) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                response = NextResponse.next({ request })
                cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
                Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
            },
        },
    })

    const { data } = await supabase.auth.getClaims()
    const { pathname, search } = request.nextUrl

    if (!data?.claims && isProtectedPath(pathname)) {
        const url = request.nextUrl.clone()

        url.pathname = "/entrar"
        url.search = `?redirect=${encodeURIComponent(`${pathname}${search}`)}`

        return NextResponse.redirect(url)
    }

    return response
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
    ],
}
