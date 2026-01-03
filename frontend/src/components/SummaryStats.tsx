import type { QuerySummary } from "../types";

interface SummaryStatsProps {
    summary: QuerySummary;
}

export const SummaryStats = ({ summary }: SummaryStatsProps) => {
    const operations = Object.entries(summary.operations)
        .map(([op, count]) => `${count}x ${op}`)
        .join(", ");

    const collections = Object.entries(summary.collections)
        .slice(0, 3)
        .map(([coll, count]) => `${count}x ${coll}`)
        .join(", ");

    const moreCollections =
        Object.keys(summary.collections).length > 3 ? ` (+${Object.keys(summary.collections).length - 3} more)` : "";

    return (
        <div className="flex items-center gap-6 p-3 bg-muted/50 rounded-md border text-sm">
            <div className="flex items-baseline gap-2">
                <span className="text-muted-foreground">Queries:</span>
                <span className="font-semibold text-lg">{summary.totalQueries}</span>
            </div>

            {summary.unindexedCount > 0 && (
                <div className="flex items-baseline gap-2">
                    <span className="text-muted-foreground">COLLSCAN:</span>
                    <span className="font-semibold text-lg text-yellow-600 dark:text-yellow-500">
                        {summary.unindexedCount}
                    </span>
                </div>
            )}

            {operations && (
                <div className="flex items-baseline gap-2">
                    <span className="text-muted-foreground">Ops:</span>
                    <span>{operations}</span>
                </div>
            )}

            {collections && (
                <div className="flex items-baseline gap-2 flex-1 min-w-0">
                    <span className="text-muted-foreground">Collections:</span>
                    <span className="truncate">
                        {collections}
                        {moreCollections}
                    </span>
                </div>
            )}
        </div>
    );
};
