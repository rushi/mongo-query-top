import type { ProcessedQuery } from "@mongo-query-top/types";
import { Check, Eye, FloppyDisk, Funnel } from "@phosphor-icons/react/dist/ssr";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useState } from "react";
import { usePreferences } from "../store/preferences";
import { apiClient } from "../utils/api";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface QueryTableProps {
    queries: ProcessedQuery[];
    onQueryClick: (query: ProcessedQuery) => void;
}

export const QueryTable = ({ queries, onQueryClick }: QueryTableProps) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const { serverId, setIpFilter } = usePreferences();
    const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

    const virtualizer = useVirtualizer({
        count: queries.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 60,
        overscan: 5,
    });

    const handleFilterByIp = (e: React.MouseEvent, query: ProcessedQuery) => {
        e.stopPropagation();
        setIpFilter(query.client.ip);
    };

    const handleViewDetails = (e: React.MouseEvent, query: ProcessedQuery) => {
        e.stopPropagation();
        onQueryClick(query);
    };

    const handleSave = async (e: React.MouseEvent, query: ProcessedQuery) => {
        e.stopPropagation();

        setSavingIds((prev) => new Set(prev).add(query.opid));
        try {
            await apiClient.post(`/api/queries/${serverId}/save`, { query });
            setSavedIds((prev) => new Set(prev).add(query.opid));
            setTimeout(() => {
                setSavedIds((prev) => {
                    const next = new Set(prev);
                    next.delete(query.opid);
                    return next;
                });
            }, 2000);
        } catch (err) {
            console.error("Failed to save query:", err);
        } finally {
            setSavingIds((prev) => {
                const next = new Set(prev);
                next.delete(query.opid);
                return next;
            });
        }
    };

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
                <div className="grid grid-cols-[40px_80px_80px_120px_minmax(200px,1fr)_150px_80px_180px] gap-4 text-sm font-medium">
                    <div>#</div>
                    <div>Op ID</div>
                    <div>Runtime</div>
                    <div>Operation</div>
                    <div>Namespace</div>
                    <div>Client</div>
                    <div>Status</div>
                    <div>Actions</div>
                </div>
            </div>

            <div ref={parentRef} className="h-[600px] overflow-auto">
                <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
                    {virtualizer.getVirtualItems().map((virtualRow) => {
                        const query = queries[virtualRow.index];
                        const isCollscan = query.isCollscan;
                        const isSaving = savingIds.has(query.opid);
                        const isSaved = savedIds.has(query.opid);

                        return (
                            <div
                                key={virtualRow.key}
                                data-index={virtualRow.index}
                                ref={virtualizer.measureElement}
                                onClick={() => onQueryClick(query)}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                                className={`
                                    grid grid-cols-[40px_80px_80px_120px_minmax(200px,1fr)_150px_80px_180px] gap-4 px-4 py-3 border-b
                                    hover:bg-muted/50 transition-colors cursor-pointer
                                    ${isCollscan ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}
                                `}
                            >
                                <div className="flex items-center text-muted-foreground text-sm">#{query.idx}</div>
                                <div className="flex items-center font-mono text-sm">{query.opid}</div>
                                <div className="flex items-center text-sm">{query.runtime_formatted}</div>
                                <div className="flex items-center truncate text-sm font-medium">{query.operation}</div>
                                <div className="flex items-center truncate text-sm">
                                    <span className="text-muted-foreground">{query.database}.</span>
                                    {query.collection}
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground truncate">
                                    {query.userAgent}
                                </div>
                                <div className="flex gap-2 items-center">
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
                                <div className="flex gap-1 items-center">
                                    <Button
                                        onClick={(e) => handleFilterByIp(e, query)}
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0 cursor-pointer"
                                        title="Filter by IP"
                                    >
                                        <Funnel weight="bold" className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        onClick={(e) => handleViewDetails(e, query)}
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0 cursor-pointer"
                                        title="View Details"
                                    >
                                        <Eye weight="bold" className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        onClick={(e) => handleSave(e, query)}
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0 cursor-pointer"
                                        disabled={isSaving || isSaved}
                                        title="Save Query"
                                    >
                                        {isSaved ? (
                                            <Check weight="bold" className="h-3.5 w-3.5 text-green-600" />
                                        ) : (
                                            <FloppyDisk weight="bold" className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
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
