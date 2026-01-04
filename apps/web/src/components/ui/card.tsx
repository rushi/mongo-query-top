import * as React from "react";
import { cn } from "../../lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card"
            className={cn(
                "rounded-md border bg-card text-card-foreground transition-shadow hover:shadow-[oklab(0_0_0/0.08)_0px_8px_16px_0px]",
                "shadow-[oklab(0_0_0/0.04)_0px_8px_16px_0px]",
                className,
            )}
            {...props}
        />
    );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
    return <div data-slot="card-header" className={cn("flex flex-col gap-1.5 p-4", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
    return <div data-slot="card-title" className={cn("text-base leading-tight font-semibold", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
    return <div data-slot="card-description" className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-action"
            className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
            {...props}
        />
    );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
    return <div data-slot="card-content" className={cn("p-4 pt-0", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
    return <div data-slot="card-footer" className={cn("flex items-center p-4 pt-0", className)} {...props} />;
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
