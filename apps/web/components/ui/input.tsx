import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full border border-white/15 bg-white/[0.02] px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-sky-200",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";

