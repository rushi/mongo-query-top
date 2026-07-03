import type { ConnectedClient } from "@mongo-query-top/types";
import { useMemo, useState } from "react";
import { cn } from "../lib/utils";
import { Badge } from "./ui/badge";

type SortKey = "status" | "client" | "app" | "user" | "op" | "runtime";
type SortDirection = "asc" | "desc";

const GRID_COLS = "grid-cols-[70px_minmax(150px,1fr)_minmax(120px,1fr)_minmax(140px,1fr)_minmax(160px,1.5fr)_90px]";

const COLUMNS: { key: SortKey; label: string; numeric: boolean }[] = [
    { key: "status", label: "STATUS", numeric: true },
    { key: "client", label: "CLIENT", numeric: false },
    { key: "app", label: "APP", numeric: false },
    { key: "user", label: "USER", numeric: false },
    { key: "op", label: "CURRENT_OP", numeric: false },
    { key: "runtime", label: "RUNTIME", numeric: true },
];

const formatUsers = (client: ConnectedClient): string => {
    if (!client.effectiveUsers?.length) {
        return "—";
    }
    return client.effectiveUsers.map((u) => `${u.user}@${u.db}`).join(", ");
};

const sortValue = (client: ConnectedClient, key: SortKey): string | number => {
    switch (key) {
        case "status":
            return client.active ? 1 : 0;
        case "client":
            return client.client.ip;
        case "app":
            return client.userAgent.toLowerCase();
        case "user":
            return formatUsers(client).toLowerCase();
        case "op":
            return (client.currentOp ?? "").toLowerCase();
        case "runtime":
            return client.secs_running ?? 0;
    }
};

export const ClientTable = ({ clients }: { clients: ConnectedClient[] }) => {
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    const handleSort = (column: (typeof COLUMNS)[number]) => {
        if (sortKey === column.key) {
            setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
        } else {
            setSortKey(column.key);
            // Numeric columns are most useful high-to-low first; text ascending.
            setSortDirection(column.numeric ? "desc" : "asc");
        }
    };

    const sortedClients = useMemo(() => {
        if (!sortKey) {
            // No explicit sort — keep server order (active first, then runtime desc).
            return clients;
        }

        const direction = sortDirection === "asc" ? 1 : -1;
        return [...clients].sort((a, b) => {
            const aValue = sortValue(a, sortKey);
            const bValue = sortValue(b, sortKey);
            if (aValue < bValue) {
                return -direction;
            }
            if (aValue > bValue) {
                return direction;
            }
            return 0;
        });
    }, [clients, sortKey, sortDirection]);

    if (clients.length === 0) {
        return (
            <div className="border-2 border-border bg-card py-24 text-center">
                <div className="mb-3 font-mono text-4xl text-muted-foreground">∅</div>
                <p className="font-mono text-sm tracking-wide text-muted-foreground uppercase">NO_CONNECTED_CLIENTS</p>
                <p className="mt-2 font-mono text-xs text-muted-foreground">No client connections match the filter.</p>
            </div>
        );
    }

    return (
        <div className="border-2 border-border bg-card">
            <div className="flex items-center border-b-2 border-border bg-muted px-4 py-2.5">
                <span className="font-mono text-xs tracking-wider text-primary uppercase">■ CONNECTED_CLIENTS</span>
            </div>

            {/* Column headers */}
            <div className={`grid ${GRID_COLS} gap-3 border-b-2 border-border bg-card px-4 py-3`}>
                {COLUMNS.map((column) => {
                    const isSorted = sortKey === column.key;
                    return (
                        <button
                            key={column.key}
                            type="button"
                            className={cn(
                                "flex items-center gap-1 font-mono text-[10px] tracking-wide uppercase transition-colors hover:text-foreground",
                                column.key === "runtime" && "justify-end",
                                isSorted ? "text-primary" : "text-muted-foreground",
                            )}
                            onClick={() => handleSort(column)}
                        >
                            <span>{column.label}</span>
                            <span className={cn(!isSorted && "text-muted-foreground/40")}>
                                {isSorted ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Rows */}
            <div>
                {sortedClients.map((client, idx) => (
                    <div
                        key={`${client.client.ip}-${client.connectionId ?? idx}`}
                        className={`grid ${GRID_COLS} items-center gap-3 border-b border-border/50 px-4 py-2.5 last:border-b-0 hover:bg-muted/40`}
                    >
                        <div>
                            {client.active ? (
                                <Badge
                                    variant="success"
                                    className="border border-primary bg-primary/20 font-mono text-[10px] text-primary uppercase"
                                >
                                    ● ACTIVE
                                </Badge>
                            ) : (
                                <Badge
                                    variant="secondary"
                                    className="border border-border font-mono text-[10px] text-muted-foreground uppercase"
                                >
                                    ○ IDLE
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5 truncate font-mono text-sm text-foreground">
                            {client.client.geo?.country && (
                                <span className="text-muted-foreground">{client.client.geo.country}</span>
                            )}
                            <span className="truncate">{client.client.ip}</span>
                        </div>

                        <div className="truncate font-mono text-sm text-foreground">{client.userAgent}</div>

                        <div className="truncate font-mono text-sm text-muted-foreground">{formatUsers(client)}</div>

                        <div className="truncate font-mono text-sm text-muted-foreground">
                            {client.currentOp ? (
                                <>
                                    <span className="text-foreground uppercase">{client.currentOp}</span>
                                    {client.namespace && <span className="ml-1.5">{client.namespace}</span>}
                                </>
                            ) : (
                                "—"
                            )}
                        </div>

                        <div className="text-right font-mono text-sm text-muted-foreground tabular-nums">
                            {client.active ? (client.runtime_formatted ?? "—") : "—"}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
