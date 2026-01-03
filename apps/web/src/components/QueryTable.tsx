import type { ProcessedQuery } from "@mongo-query-top/types";
import {
    CaretDownIcon,
    CaretUpIcon,
    CheckIcon,
    EyeIcon,
    FloppyDiskIcon,
    FunnelIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef, useState } from "react";
import type { SortColumn } from "../hooks/useUrlPreferences";
import { useUrlPreferences } from "../hooks/useUrlPreferences";
import { apiClient } from "../utils/api";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface QueryTableProps {
    queries: ProcessedQuery[];
    onQueryClick: (query: ProcessedQuery) => void;
}

export const QueryTable = ({ queries, onQueryClick }: QueryTableProps) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const { serverId, sortBy: sortColumn, sortDirection, setSortColumn, setIpFilter } = useUrlPreferences();
    const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

    const sortedQueries = useMemo(() => {
        const sorted = [...queries].sort((a, b) => {
            let aValue: string | number;
            let bValue: string | number;

            switch (sortColumn) {
                case "runtime":
                    aValue = a.secs_running;
                    bValue = b.secs_running;
                    break;
                case "opid":
                    aValue = a.opid;
                    bValue = b.opid;
                    break;
                case "operation":
                    aValue = a.operation;
                    bValue = b.operation;
                    break;
                case "namespace":
                    aValue = a.namespace;
                    bValue = b.namespace;
                    break;
                case "client":
                    aValue = a.client.ip;
                    bValue = b.client.ip;
                    break;
                default:
                    aValue = a.secs_running;
                    bValue = b.secs_running;
            }

            if (typeof aValue === "string" && typeof bValue === "string") {
                return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            }

            return sortDirection === "asc" ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue);
        });

        return sorted;
    }, [queries, sortColumn, sortDirection]);

    const virtualizer = useVirtualizer({
        count: sortedQueries.length,
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

    const renderSortIcon = (column: SortColumn) => {
        if (sortColumn !== column) {
            return null;
        }
        return sortDirection === "asc" ? (
            <CaretUpIcon weight="bold" className="inline h-3 w-3" />
        ) : (
            <CaretDownIcon weight="bold" className="inline h-3 w-3" />
        );
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
            <div className="border-b bg-muted/50 px-4 py-3">
                <div className="grid grid-cols-[40px_80px_80px_120px_minmax(200px,1fr)_150px_80px_180px] gap-4 text-sm font-medium">
                    <div>#</div>
                    <button
                        onClick={() => setSortColumn("opid")}
                        className="flex cursor-pointer items-center gap-1 text-left hover:text-foreground"
                    >
                        Op ID {renderSortIcon("opid")}
                    </button>
                    <button
                        onClick={() => setSortColumn("runtime")}
                        className="flex cursor-pointer items-center gap-1 text-left hover:text-foreground"
                    >
                        Runtime {renderSortIcon("runtime")}
                    </button>
                    <button
                        onClick={() => setSortColumn("operation")}
                        className="flex cursor-pointer items-center gap-1 text-left hover:text-foreground"
                    >
                        Operation {renderSortIcon("operation")}
                    </button>
                    <button
                        onClick={() => setSortColumn("namespace")}
                        className="flex cursor-pointer items-center gap-1 text-left hover:text-foreground"
                    >
                        Namespace {renderSortIcon("namespace")}
                    </button>
                    <button
                        onClick={() => setSortColumn("client")}
                        className="flex cursor-pointer items-center gap-1 text-left hover:text-foreground"
                    >
                        Client {renderSortIcon("client")}
                    </button>
                    <div>Status</div>
                    <div>Actions</div>
                </div>
            </div>

            <div ref={parentRef} className="h-[600px] overflow-auto">
                <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
                    {virtualizer.getVirtualItems().map((virtualRow) => {
                        const query = sortedQueries[virtualRow.index];
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
                                className={`grid cursor-pointer grid-cols-[40px_80px_80px_120px_minmax(200px,1fr)_150px_80px_180px] gap-4 border-b px-4 py-3 transition-colors hover:bg-muted/50 ${isCollscan ? "bg-yellow-50 dark:bg-yellow-950/20" : ""} `}
                            >
                                <div className="flex items-center text-sm text-muted-foreground tabular-nums">
                                    #{query.idx}
                                </div>
                                <div className="flex items-center font-mono text-sm">{query.opid}</div>
                                <div className="flex items-center font-mono text-sm">{query.runtime_formatted}</div>
                                <div className="flex items-center truncate text-sm">{query.operation}</div>
                                <div className="flex items-center truncate text-sm">
                                    <span className="text-muted-foreground">{query.database}.</span>
                                    {query.collection}
                                </div>
                                <div className="flex items-center truncate text-sm text-muted-foreground">
                                    {query.userAgent}
                                </div>
                                <div className="flex items-center gap-2">
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
                                <div className="flex items-center gap-1">
                                    <Button
                                        onClick={(e) => handleFilterByIp(e, query)}
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 cursor-pointer p-0"
                                        title="Filter by IP"
                                    >
                                        <FunnelIcon weight="bold" className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        onClick={(e) => handleViewDetails(e, query)}
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 cursor-pointer p-0"
                                        title="View Details"
                                    >
                                        <EyeIcon weight="bold" className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        onClick={(e) => handleSave(e, query)}
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 cursor-pointer p-0"
                                        disabled={isSaving || isSaved}
                                        title="Save Query"
                                    >
                                        {isSaved ? (
                                            <CheckIcon weight="bold" className="h-3.5 w-3.5 text-green-600" />
                                        ) : (
                                            <FloppyDiskIcon weight="bold" className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="border-t bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
                Showing {sortedQueries.length} {sortedQueries.length === 1 ? "query" : "queries"}
            </div>
        </div>
    );
};
