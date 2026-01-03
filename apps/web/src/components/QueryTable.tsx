import type { ProcessedQuery } from "@mongo-query-top/types";
import { cn } from "@mongo-query-top/utils";
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

const isInternalIp = (ip: string): boolean => {
    const parts = ip.split(".");
    if (parts.length !== 4) {
        return false;
    }

    const firstOctet = parseInt(parts[0], 10);
    const secondOctet = parseInt(parts[1], 10);

    if (firstOctet === 10) {
        return true;
    }

    if (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) {
        return true;
    }

    if (firstOctet === 192 && secondOctet === 168) {
        return true;
    }

    if (firstOctet === 127) {
        return true;
    }

    return false;
};

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
            await apiClient.post(`/queries/${serverId}/save`, { query });
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
            <div className="border-2 border-border p-12 text-center">
                <div className="mb-3 font-mono text-4xl text-muted-foreground">∅</div>
                <p className="font-mono text-sm tracking-wide text-muted-foreground uppercase">NO_QUERIES_DETECTED</p>
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                    Adjust filters or wait for database operations
                </p>
            </div>
        );
    }

    return (
        <div className="border-2 border-border">
            {/* Table Header Section */}
            <div className="border-b-2 border-border bg-muted px-4 py-2">
                <span className="font-mono text-xs tracking-wider text-primary uppercase">■ ACTIVE_QUERIES</span>
            </div>

            {/* Column Headers */}
            <div className="border-b-2 bg-card px-4 py-3">
                <div className="grid grid-cols-[40px_80px_100px_120px_minmax(200px,1fr)_140px_150px_110px] gap-4 font-mono text-tiny font-bold tracking-wide text-muted-foreground uppercase">
                    <div>#</div>
                    <button
                        className="flex cursor-pointer items-center gap-1 text-left transition-colors hover:text-primary"
                        onClick={() => setSortColumn("opid")}
                    >
                        OP_ID {renderSortIcon("opid")}
                    </button>
                    <button
                        className="flex cursor-pointer items-center justify-end gap-1 pr-2 transition-colors hover:text-primary"
                        onClick={() => setSortColumn("runtime")}
                    >
                        RUNTIME {renderSortIcon("runtime")}
                    </button>
                    <button
                        className="flex cursor-pointer items-center gap-1 text-left transition-colors hover:text-primary"
                        onClick={() => setSortColumn("operation")}
                    >
                        OPERATION {renderSortIcon("operation")}
                    </button>
                    <button
                        className="flex cursor-pointer items-center gap-1 text-left transition-colors hover:text-primary"
                        onClick={() => setSortColumn("namespace")}
                    >
                        NAMESPACE {renderSortIcon("namespace")}
                    </button>
                    <div>IP_ADDRESS</div>
                    <button
                        className="flex cursor-pointer items-center gap-1 text-left transition-colors hover:text-primary"
                        onClick={() => setSortColumn("client")}
                    >
                        CLIENT {renderSortIcon("client")}
                    </button>
                    <div className="flex justify-end">ACTIONS</div>
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
                                className={cn(
                                    "grid cursor-pointer grid-cols-[40px_80px_100px_120px_minmax(200px,1fr)_140px_150px_110px] gap-4 border-b border-border px-4 py-3 transition-colors hover:bg-muted/90",
                                    isCollscan && "border-l-4 border-l-warning bg-warning/5",
                                )}
                            >
                                <div className="flex items-center font-mono text-sm text-muted-foreground tabular-nums">
                                    {query.idx}
                                </div>
                                <div className="flex items-center font-mono text-sm text-foreground">{query.opid}</div>
                                <div className="flex items-center justify-end pr-2 font-mono text-sm font-medium text-primary">
                                    {query.runtime_formatted}
                                </div>
                                <div className="flex items-center truncate font-mono text-sm text-muted-foreground uppercase">
                                    {query.operation}
                                </div>
                                <div className="flex items-center gap-2 truncate font-mono text-sm text-foreground">
                                    <div className="flex items-center truncate">
                                        <span className="text-muted-foreground">{query.database}.</span>
                                        <span className="font-medium">{query.collection}</span>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1">
                                        {isCollscan && (
                                            <Badge
                                                variant="destructive"
                                                className="border border-warning bg-warning/20 font-mono text-tiny text-warning uppercase"
                                            >
                                                ⚠ COLLSCAN
                                            </Badge>
                                        )}
                                        {query.waitingForLock && (
                                            <Badge
                                                variant="outline"
                                                className="border border-destructive font-mono text-tiny uppercase"
                                            >
                                                🔒 LOCK
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div
                                    className={cn(
                                        "flex items-center truncate font-mono text-sm",
                                        isInternalIp(query.client.ip) ? "text-muted-foreground/80" : "text-foreground",
                                    )}
                                >
                                    {query.client.ip}
                                </div>
                                <div className="flex items-center truncate font-mono text-sm">{query.userAgent}</div>
                                <div className="flex items-center justify-end gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        title="Filter by IP"
                                        className="h-6 w-6 cursor-pointer border border-border p-0 hover:border-primary hover:bg-primary/10 hover:text-white"
                                        onClick={(e) => handleFilterByIp(e, query)}
                                    >
                                        <FunnelIcon weight="bold" className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        title="View Details"
                                        className="h-6 w-6 cursor-pointer border border-border p-0 hover:border-primary hover:bg-primary/10 hover:text-white"
                                        onClick={(e) => handleViewDetails(e, query)}
                                    >
                                        <EyeIcon weight="bold" className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={isSaving || isSaved}
                                        title="Save Query"
                                        className="h-6 w-6 cursor-pointer border border-border p-0 hover:border-primary hover:bg-primary/10 hover:text-white"
                                        onClick={(e) => handleSave(e, query)}
                                    >
                                        {isSaved ? (
                                            <CheckIcon weight="bold" className="h-3 w-3 text-primary" />
                                        ) : (
                                            <FloppyDiskIcon weight="bold" className="h-3 w-3" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="border-t border-primary bg-muted px-4 py-2">
                <span className="font-mono text-tiny tracking-wide text-muted-foreground uppercase">
                    ▸ SHOWING {sortedQueries.length} {sortedQueries.length === 1 ? "QUERY" : "QUERIES"}
                </span>
            </div>
        </div>
    );
};
