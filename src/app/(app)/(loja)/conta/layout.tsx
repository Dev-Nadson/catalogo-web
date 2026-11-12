import type { Metadata } from "next"

import { RequireSession } from "~/components/require-session"
import { ContaNav } from "./conta-nav"

export const metadata: Metadata = {
    robots: { index: false, follow: false },
}

type ContaLayoutProps = {
    children: React.ReactNode
}

export default function ContaLayout({ children }: ContaLayoutProps) {
    return (
        <RequireSession>
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:py-10">
                <ContaNav />
                {children}
            </div>
        </RequireSession>
    )
}
