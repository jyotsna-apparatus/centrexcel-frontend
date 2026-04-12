import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  function Input({ className, type, ...props }, ref) {
    return (
      <input
        type={type}
        ref={ref}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-cs-border min-h-12 w-full min-w-0 rounded-md border bg-[color:var(--app-glass-surface-bg)] px-4 py-2.5 text-base shadow-xs outline-none backdrop-blur-[var(--app-glass-surface-blur)] transition-[color,box-shadow] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-cs-primary focus-visible:ring-ring/50 focus-visible:ring-[1px]",
          "aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/25 aria-invalid:outline aria-invalid:outline-2 aria-invalid:outline-red-500 aria-invalid:outline-offset-0 dark:aria-invalid:ring-red-500/35",
          className,
        )}
        {...props}
      />
    );
  },
);

export { Input };
