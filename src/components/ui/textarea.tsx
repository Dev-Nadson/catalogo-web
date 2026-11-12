import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "~/lib/utils"

// Espelha `inputVariants` de `ui/input.tsx`: os formulários do projeto usam `size="xl"`, e sem a
// mesma variante aqui o textarea destoaria dos inputs ao lado dele no mesmo grid.
const textareaVariants = cva(
  "flex field-sizing-content min-h-16 w-full resize-none rounded-2xl border text-base transition-[color,box-shadow] duration-200 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      size: {
        default: "border-transparent bg-input/50 px-2.5 py-2",
        xl: "border-border bg-card px-3.5 py-2.5 text-sm",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

function Textarea({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"textarea"> & VariantProps<typeof textareaVariants>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ size }), className)}
      {...props}
    />
  )
}

export { Textarea, textareaVariants }
