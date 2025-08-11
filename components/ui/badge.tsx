import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center text-center rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-[hsl(var(--secondary))] bg-[hsl(var(--secondary))]/20 text-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/80",
        destructive:
          "border-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/20 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/80",
        outline: "border-[hsl(var(--foreground))] bg-[hsl(var(--foreground))]/20 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--foreground))]/80",
        ghost: "border-[hsl(var(--muted))] bg-[hsl(var(--muted))]/20 text-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/80",
        approved:
          "border-[hsl(var(--approved))] bg-[hsl(var(--approved))]/20 text-[hsl(var(--approved))] hover:bg-[hsl(var(--approved))]/80",
        accent:
          "border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/20 text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/80",
        primary:
          "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/80",
        "primary-2":
          "border-[hsl(var(--primary-2))] bg-[hsl(var(--primary-2))]/20 text-[hsl(var(--primary-2))] hover:bg-[hsl(var(--primary-2))]/80",
        "ticket-yellow":
          "border-[hsl(var(--ticket-yellow))] bg-[hsl(var(--ticket-yellow))]/20 text-[hsl(var(--ticket-yellow))] hover:bg-[hsl(var(--ticket-yellow))]/80",
        "ticket-orange":
          "border-[hsl(var(--ticket-orange))] bg-[hsl(var(--ticket-orange))]/20 text-[hsl(var(--ticket-orange))] hover:bg-[hsl(var(--ticket-orange))]/80",
        "ticket-purple":
          "border-[hsl(var(--ticket-purple))] bg-[hsl(var(--ticket-purple))]/20 text-[hsl(var(--ticket-purple))] hover:bg-[hsl(var(--ticket-purple))]/80",
        "ticket-gray":
          "border-[hsl(var(--ticket-gray))] bg-[hsl(var(--ticket-gray))]/20 text-[hsl(var(--ticket-gray))] hover:bg-[hsl(var(--ticket-gray))]/80",
        "ticket-cyan":
          "border-[hsl(var(--ticket-cyan))] bg-[hsl(var(--ticket-cyan))]/20 text-[hsl(var(--ticket-cyan))] hover:bg-[hsl(var(--ticket-cyan))]/80",
        "ticket-green":
          "border-[hsl(var(--ticket-green))] bg-[hsl(var(--ticket-green))]/20 text-[hsl(var(--ticket-green))] hover:bg-[hsl(var(--ticket-green))]/80",
        orange:
          "border-[hsl(var(--orange))] bg-[hsl(var(--orange))]/20 text-[hsl(var(--orange))] hover:bg-[hsl(var(--orange))]/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
