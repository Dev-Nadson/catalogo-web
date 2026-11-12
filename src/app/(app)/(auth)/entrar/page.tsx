import type { Metadata } from "next"

import { AuthLayout } from "~/components/auth-layout"
import { SigninForm } from "~/components/forms/signin-form"
import { AuthLink } from "../auth-link"

export const metadata: Metadata = {
    title: "Entrar",
}

export default function SigninPage() {
    return (
        <AuthLayout
            title="Entrar"
            description="Entre com seu e-mail e senha para finalizar o pedido e acompanhar suas compras"
            footer={
                <>
                    Ainda não tem conta? <AuthLink href="/cadastrar">Criar conta</AuthLink>
                </>
            }
        >
            <SigninForm />
        </AuthLayout>
    )
}
