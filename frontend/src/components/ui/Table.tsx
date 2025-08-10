"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TableProps extends React.ComponentProps<"table"> {
    className?: string;
}

const Table = ({ className, ...props }: TableProps) => (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
        <table data-slot="table" className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
);

interface TableHeaderProps extends React.ComponentProps<"thead"> {
    className?: string;
}

const TableHeader = ({ className, ...props }: TableHeaderProps) => (
    <thead data-slot="table-header" className={cn("[&_tr]:border-b", className)} {...props} />
);

interface TableBodyProps extends React.ComponentProps<"tbody"> {
    className?: string;
}

const TableBody = ({ className, ...props }: TableBodyProps) => (
    <tbody data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />
);

interface TableFooterProps extends React.ComponentProps<"tfoot"> {
    className?: string;
}

const TableFooter = ({ className, ...props }: TableFooterProps) => (
    <tfoot
        data-slot="table-footer"
        className={cn("bg-muted/50 border-t font-medium [&>tr]:last:border-b-0", className)}
        {...props}
    />
);

interface TableRowProps extends React.ComponentProps<"tr"> {
    className?: string;
}

const TableRow = ({ className, ...props }: TableRowProps) => (
    <tr
        data-slot="table-row"
        className={cn("hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors", className)}
        {...props}
    />
);

interface TableHeadProps extends React.ComponentProps<"th"> {
    className?: string;
}

const TableHead = ({ className, ...props }: TableHeadProps) => (
    <th
        data-slot="table-head"
        className={cn(
            "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
            className,
        )}
        {...props}
    />
);

interface TableCellProps extends React.ComponentProps<"td"> {
    className?: string;
}

const TableCell = ({ className, ...props }: TableCellProps) => (
    <td
        data-slot="table-cell"
        className={cn(
            "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
            className,
        )}
        {...props}
    />
);

interface TableCaptionProps extends React.ComponentProps<"caption"> {
    className?: string;
}

const TableCaption = ({ className, ...props }: TableCaptionProps) => (
    <caption data-slot="table-caption" className={cn("text-muted-foreground mt-4 text-sm", className)} {...props} />
);

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
