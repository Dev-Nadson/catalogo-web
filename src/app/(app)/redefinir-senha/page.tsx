import type { Metadata } from "next"

import { AuthLayout } from "~/components/auth-layout"
import { ResetPassword } from "./reset-password"

export const metadata: Metadata = {
    title: "Nova senha",
    robots: { index: false, follow: false },
}

/** Fica fora do grupo (auth): o link de recuperação chega com a sessão aberta. */
export default function ResetPasswordPage() {
    return (
        <AuthLayout title="Nova senha" description="Escolha a senha que você vai usar daqui em diante">
            <ResetPassword />
        </AuthLayout>
    )
}
