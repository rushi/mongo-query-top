import { cn } from "../../lib/utils";

interface SortableColumnHeaderProps {
    isSorted: boolean;
    label: string;
    sortDirection: "asc" | "desc";
    align?: "start" | "end";
    className?: string;
    onClick: () => void;
}

export const SortableColumnHeader = ({
    isSorted,
    label,
    sortDirection,
    align = "start",
    className,
    onClick,
}: SortableColumnHeaderProps) => {
    return (
        <button
            type="button"
            className={cn(
                "flex cursor-pointer items-center gap-1 font-mono text-[10px] font-bold tracking-wide uppercase transition-colors hover:text-foreground",
                align === "end" && "justify-end",
                isSorted ? "text-primary" : "text-muted-foreground",
                className,
            )}
            onClick={onClick}
        >
            <span>{label}</span>
            <span className={cn(!isSorted && "text-muted-foreground/40")}>
                {isSorted ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
            </span>
        </button>
    );
};
