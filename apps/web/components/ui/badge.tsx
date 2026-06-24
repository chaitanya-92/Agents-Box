import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  children
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center border border-sky-100/20 bg-sky-100/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-sky-100/80",
        className
      )}
    >
      {children}
    </div>
  );
}
