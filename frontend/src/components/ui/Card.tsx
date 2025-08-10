import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.ComponentProps<"div"> {
    className?: string;
}

const Card = ({ className, ...props }: CardProps) => (
    <div
        data-slot="card"
        className={cn("bg-card text-card-foreground flex flex-col gap-6 rounded border py-3 shadow-sm", className)}
        {...props}
    />
);

const CardHeader = ({ className, ...props }: CardProps) => (
    <div
        data-slot="card-header"
        className={cn(
            "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
            className,
        )}
        {...props}
    />
);

const CardTitle = ({ className, ...props }: CardProps) => (
    <div data-slot="card-title" className={cn("leading-none font-semibold", className)} {...props} />
);

const CardDescription = ({ className, ...props }: CardProps) => (
    <div data-slot="card-description" className={cn("text-muted-foreground text-sm", className)} {...props} />
);

const CardAction = ({ className, ...props }: CardProps) => (
    <div
        data-slot="card-action"
        className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
        {...props}
    />
);

const CardContent = ({ className, ...props }: CardProps) => (
    <div data-slot="card-content" className={cn("px-4", className)} {...props} />
);

const CardFooter = ({ className, ...props }: CardProps) => (
    <div data-slot="card-footer" className={cn("flex items-center px-4 [.border-t]:pt-6", className)} {...props} />
);

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
