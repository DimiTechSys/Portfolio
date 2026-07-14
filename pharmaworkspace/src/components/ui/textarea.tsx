import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 transition outline-none placeholder:text-slate-400 focus:border-teal-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-400",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
