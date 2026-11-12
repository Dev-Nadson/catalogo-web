import type { Metadata } from "next"
import Link from "next/link"

import { AuthLayout } from "~/components/auth-layout"
import { ForgotPasswordForm } from "~/components/forms/forgot-password-form"

export const metadata: Metadata = {
    title: "Recuperar senha",
}

export default function ForgotPasswordPage() {
    return (
        <AuthLayout
            title="Esqueceu a senha?"
            description="Informe seu e-mail e enviaremos um link para criar uma nova"
            footer={
                <>
                    Lembrou?{" "}
                    <Link href="/entrar" className="font-medium text-primary hover:underline">
                        Voltar para o login
                    </Link>
                </>
            }
        >
            <ForgotPasswordForm />
        </AuthLayout>
    )
}
