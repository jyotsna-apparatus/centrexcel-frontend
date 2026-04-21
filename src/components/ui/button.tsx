import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] text-sm font-medium text-cs-white outline-none transition-[background-position,box-shadow,transform] duration-700 ease-out disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none bg-[length:280%_auto] bg-left-top hover:bg-right-top motion-reduce:transition-none focus-visible:ring-4 focus-visible:ring-cs-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-cs-white aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/25 aria-invalid:outline aria-invalid:outline-2 aria-invalid:outline-red-500 aria-invalid:outline-offset-0 dark:aria-invalid:ring-red-500/35 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-[linear-gradient(325deg,var(--cs-secondary)_0%,var(--cs-primary)_55%,var(--cs-secondary)_90%)] shadow-[0_0_20px_color-mix(in_srgb,var(--cs-primary)_50%,transparent),0_5px_5px_-1px_color-mix(in_srgb,var(--cs-secondary)_40%,transparent),inset_4px_4px_8px_color-mix(in_srgb,var(--cs-white)_38%,transparent),inset_-4px_-4px_8px_color-mix(in_srgb,var(--cs-secondary)_30%,transparent)] active:scale-[0.99]",
        destructive:
          "border border-transparent bg-[linear-gradient(325deg,color-mix(in_srgb,var(--destructive)_82%,black)_0%,var(--destructive)_55%,color-mix(in_srgb,var(--destructive)_70%,black)_90%)] !text-white shadow-[0_0_20px_color-mix(in_srgb,var(--destructive)_45%,transparent),0_5px_5px_-1px_color-mix(in_srgb,var(--destructive)_35%,transparent)] active:scale-[0.99]",
        outline:
          "border border-cs-border bg-cs-card text-cs-heading shadow-sm hover:bg-cs-primary/15",
        secondary:
          "border border-cs-border/60 bg-[linear-gradient(325deg,color-mix(in_srgb,var(--cs-secondary)_75%,black)_0%,color-mix(in_srgb,var(--cs-primary)_70%,black)_55%,color-mix(in_srgb,var(--cs-secondary)_75%,black)_90%)] text-cs-white shadow-[0_0_14px_color-mix(in_srgb,var(--cs-primary)_35%,transparent),0_4px_5px_-1px_color-mix(in_srgb,var(--cs-secondary)_30%,transparent)] active:scale-[0.99]",
        ghost:
          "border border-transparent bg-transparent text-cs-heading shadow-none hover:bg-cs-primary/15 hover:text-cs-white",
        link: "rounded-none bg-transparent p-0 text-cs-primary underline-offset-4 shadow-none hover:underline focus-visible:ring-2 focus-visible:ring-cs-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-cs-card",
      },
      size: {
        default: "min-h-11 min-w-[120px] px-5 py-2.5 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "min-h-12 rounded-[var(--radius-sm)] px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
