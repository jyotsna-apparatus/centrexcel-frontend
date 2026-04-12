import * as React from "react";

import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        data-slot="select"
        className={cn(
          "placeholder:text-muted-foreground border-cs-border min-h-12 w-full min-w-0 cursor-pointer appearance-none rounded-md border bg-[color:var(--app-glass-surface-bg)] px-4 py-2.5 text-base shadow-xs outline-none backdrop-blur-[var(--app-glass-surface-blur)] transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-cs-primary/50 focus-visible:ring-[1px]",
          "aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/25 aria-invalid:outline aria-invalid:outline-2 aria-invalid:outline-red-500 aria-invalid:outline-offset-0 dark:aria-invalid:ring-red-500/35",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);
Select.displayName = "Select";

export { Select };
