import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center text-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        ghost: "text-foreground hover:bg-muted",
        approved:
          "border-transparent bg-approved text-approved-foreground hover:bg-approved/80",
        accent:
          "border-transparent bg-accent text-accent-foreground hover:bg-accent/80",
        primary:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        "primary-2":
          "border-transparent bg-primary-2 text-primary-2-foreground hover:bg-primary-2/80",
        "ticket-yellow":
          "border-transparent bg-[hsl(var(--ticket-yellow))] text-[hsl(var(--ticket-yellow-foreground))] hover:bg-[hsl(var(--ticket-yellow))]/80",
        "ticket-orange":
          "border-transparent bg-[hsl(var(--ticket-orange))] text-[hsl(var(--ticket-orange-foreground))] hover:bg-[hsl(var(--ticket-orange))]/80",
        "ticket-purple":
          "border-transparent bg-[hsl(var(--ticket-purple))] text-[hsl(var(--ticket-purple-foreground))] hover:bg-[hsl(var(--ticket-purple))]/80",
        "ticket-gray":
          "border-transparent bg-[hsl(var(--ticket-gray))] text-[hsl(var(--ticket-gray-foreground))] hover:bg-[hsl(var(--ticket-gray))]/80",
        "ticket-cyan":
          "border-transparent bg-[hsl(var(--ticket-cyan))] text-[hsl(var(--ticket-cyan-foreground))] hover:bg-[hsl(var(--ticket-cyan))]/80",
        "ticket-green":
          "border-transparent bg-[hsl(var(--ticket-green))] text-[hsl(var(--ticket-green-foreground))] hover:bg-[hsl(var(--ticket-green))]/80",
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
