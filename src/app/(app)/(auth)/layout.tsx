import type { Metadata } from "next"

import { RedirectIfAuthenticated } from "~/components/redirect-if-authenticated"

export const metadata: Metadata = {
    robots: { index: false, follow: false },
}

type AuthGroupLayoutProps = {
    children: React.ReactNode
}

export default function AuthGroupLayout({ children }: AuthGroupLayoutProps) {
    return <RedirectIfAuthenticated>{children}</RedirectIfAuthenticated>
}
