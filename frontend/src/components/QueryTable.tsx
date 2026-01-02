import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import type { ProcessedQuery } from "../types";

interface QueryTableProps {
    queries: ProcessedQuery[];
    onQueryClick: (query: ProcessedQuery) => void;
}

export const QueryTable = ({ queries, onQueryClick }: QueryTableProps) => {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: queries.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 60,
        overscan: 5,
    });

    if (queries.length === 0) {
        return (
            <div className="rounded-md border p-8 text-center text-muted-foreground">
                No queries found. Try adjusting your filters or wait for queries to appear.
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <div className="bg-muted/50 px-4 py-3 border-b">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium">
                    <div className="col-span-1">#</div>
                    <div className="col-span-1">Op ID</div>
                    <div className="col-span-1">Runtime</div>
                    <div className="col-span-2">Operation</div>
                    <div className="col-span-3">Namespace</div>
                    <div className="col-span-2">Client</div>
                    <div className="col-span-2">Status</div>
                </div>
            </div>

            <div ref={parentRef} className="h-[600px] overflow-auto">
                <div
                    style={{
                        height: `${virtualizer.getTotalSize()}px`,
                        position: "relative",
                    }}
                >
                    {virtualizer.getVirtualItems().map((virtualRow) => {
                        const query = queries[virtualRow.index];
                        const isCollscan = query.isCollscan;

                        return (
                            <div
                                key={virtualRow.key}
                                data-index={virtualRow.index}
                                ref={virtualizer.measureElement}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                                className={`
                                    grid grid-cols-12 gap-4 px-4 py-3 border-b
                                    hover:bg-muted/50 cursor-pointer transition-colors
                                    ${isCollscan ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}
                                `}
                                onClick={() => onQueryClick(query)}
                            >
                                <div className="col-span-1 text-muted-foreground text-sm">
                                    #{query.idx}
                                </div>
                                <div className="col-span-1 font-mono text-sm">
                                    {query.opid}
                                </div>
                                <div className="col-span-1 text-sm">
                                    {query.runtime_formatted}
                                </div>
                                <div className="col-span-2 truncate text-sm font-medium">
                                    {query.operation}
                                </div>
                                <div className="col-span-3 truncate text-sm">
                                    <span className="text-muted-foreground">{query.database}.</span>
                                    {query.collection}
                                </div>
                                <div className="col-span-2 text-sm text-muted-foreground truncate">
                                    {query.userAgent}
                                </div>
                                <div className="col-span-2 flex gap-2 items-center">
                                    {isCollscan && (
                                        <Badge variant="destructive" className="text-xs">
                                            COLLSCAN
                                        </Badge>
                                    )}
                                    {query.waitingForLock && (
                                        <Badge variant="outline" className="text-xs">
                                            🔒 Lock
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-muted/50 px-4 py-2 border-t text-sm text-muted-foreground">
                Showing {queries.length} {queries.length === 1 ? "query" : "queries"}
            </div>
        </div>
    );
};
