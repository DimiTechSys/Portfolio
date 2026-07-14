import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 transition outline-none placeholder:text-slate-400 file:mr-3 file:inline-flex file:rounded-md file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-slate-700 focus:border-teal-400 focus:bg-white disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-400",
        className
      )}
      {...props}
    />
  )
}

export { Input }
