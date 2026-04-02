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
          "placeholder:text-muted-foreground dark:bg-input/30 border-cs-border h-10 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm appearance-none cursor-pointer",
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
