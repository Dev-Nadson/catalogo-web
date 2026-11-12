"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"

type PasswordInputProps = Omit<
    React.ComponentProps<typeof Input>,
    "type" | "children"
>

function PasswordInput({ className, ...props }: PasswordInputProps) {
    const [isVisible, setIsVisible] = useState(false)

    return (
        <div className="relative">
            <Input
                {...props}
                type={isVisible ? "text" : "password"}
                className={cn("pr-11", className)}
            />
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={isVisible ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={isVisible}
                onClick={() => setIsVisible((visible) => !visible)}
                className="absolute inset-y-0 right-2 my-auto text-muted-foreground"
            >
                {isVisible ? <EyeOff /> : <Eye />}
            </Button>
        </div>
    )
}

export { PasswordInput }
