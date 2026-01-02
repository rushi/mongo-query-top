import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { QuerySummary } from "../types";

interface SummaryStatsProps {
    summary: QuerySummary;
}

export const SummaryStats = ({ summary }: SummaryStatsProps) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Queries
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{summary.totalQueries}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        COLLSCAN
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-500">
                        {summary.unindexedCount}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Operations
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm space-y-1">
                        {Object.entries(summary.operations).length > 0 ? (
                            Object.entries(summary.operations)
                                .map(([op, count]) => (
                                    <div key={op} className="flex justify-between">
                                        <span className="text-muted-foreground">{op}:</span>
                                        <span className="font-medium">{count}</span>
                                    </div>
                                ))
                        ) : (
                            <div className="text-muted-foreground">No operations</div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Collections
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm">
                        {Object.keys(summary.collections).length > 0 ? (
                            <div className="space-y-1">
                                {Object.entries(summary.collections)
                                    .slice(0, 3)
                                    .map(([coll, count]) => (
                                        <div key={coll} className="flex justify-between">
                                            <span className="text-muted-foreground truncate max-w-[120px]">
                                                {coll}:
                                            </span>
                                            <span className="font-medium">{count}</span>
                                        </div>
                                    ))}
                                {Object.keys(summary.collections).length > 3 && (
                                    <div className="text-muted-foreground text-xs">
                                        +{Object.keys(summary.collections).length - 3} more
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-muted-foreground">No collections</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
