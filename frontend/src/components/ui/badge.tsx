import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const badgeVariants = cva("inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium transition-colors", {
    variants: {
        variant: {
            default: "bg-primary/10 text-primary",
            secondary: "bg-secondary text-secondary-foreground",
            destructive: "bg-destructive/10 text-destructive",
            outline: "border text-foreground",
            success: "bg-success/15 text-success",
            warning: "bg-warning/20 text-warning-foreground",
            info: "bg-primary/10 text-primary",
            purple: "border border-purple-200 bg-purple-100 text-purple-600 dark:border-purple-900/30 dark:bg-purple-900/10 dark:text-purple-400",
        },
    },
    defaultVariants: {
        variant: "default",
    },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
