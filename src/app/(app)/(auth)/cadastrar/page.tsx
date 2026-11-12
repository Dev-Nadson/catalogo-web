import type { Metadata } from "next"

import { AuthLayout } from "~/components/auth-layout"
import { SignupForm } from "~/components/forms/signup-form"
import { AuthLink } from "../auth-link"

export const metadata: Metadata = {
    title: "Criar conta",
}

export default function SignupPage() {
    return (
        <AuthLayout
            title="Criar conta"
            description="Leva um minuto. Seus dados ficam salvos para os próximos pedidos"
            footer={
                <>
                    Já tem conta? <AuthLink href="/entrar">Entrar</AuthLink>
                </>
            }
        >
            <SignupForm />
        </AuthLayout>
    )
}
