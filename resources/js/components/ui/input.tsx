import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-[#CBD5E1] bg-white text-[#162230] file:text-foreground placeholder:text-[#64748B] selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-lg border px-3 py-1 text-base shadow-xs transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium hover:border-[#94A3B8] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#F1F5F9] disabled:text-[#475569] disabled:border-[#E2E8F0] md:text-sm",
        "focus-visible:border-[#1976D3] focus-visible:ring-2 focus-visible:ring-[#1976D3]/20",
        "aria-invalid:border-[#B91C1C] aria-invalid:bg-[#FEF2F2]/40 aria-invalid:ring-2 aria-invalid:ring-[#B91C1C]/15",
        className
      )}
      {...props}
    />
  )
}

export { Input }
