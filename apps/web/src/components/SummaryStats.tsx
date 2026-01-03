import type { QuerySummary } from "@mongo-query-top/types";

interface SummaryStatsProps {
    summary: QuerySummary;
}

export const SummaryStats = ({ summary }: SummaryStatsProps) => {
    const operations = Object.entries(summary.operations)
        .map(([op, count]) => `${count} × ${op}`)
        .join(", ");

    const collections = Object.entries(summary.collections)
        .slice(0, 3)
        .map(([coll, count]) => `${count} × ${coll}`)
        .join(", ");

    const moreCollections =
        Object.keys(summary.collections).length > 3 ? ` (+${Object.keys(summary.collections).length - 3} more)` : "";

    return (
        <div className="flex items-center gap-6 rounded-md border bg-muted/50 p-3 text-sm">
            <div className="flex items-baseline gap-1">
                <span className="text-muted-foreground">Queries:</span>
                <span className="text-md font-medium">{summary.totalQueries}</span>
            </div>

            {summary.unindexedCount > 0 && (
                <div className="flex items-baseline gap-1">
                    <span className="text-muted-foreground">COLLSCAN:</span>
                    <span className="font-bold text-yellow-600 dark:text-yellow-500">{summary.unindexedCount}</span>
                </div>
            )}

            {operations && (
                <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Ops:</span>
                    <span>{operations}</span>
                </div>
            )}

            {collections && (
                <div className="flex min-w-0 flex-1 items-baseline gap-1">
                    <span className="text-muted-foreground">Collections:</span>
                    <span className="flex items-center gap-1 truncate">
                        <span>{collections}</span>
                        <span className="text-muted-foreground">{moreCollections}</span>
                    </span>
                </div>
            )}
        </div>
    );
};
