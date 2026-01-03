import type { ProcessedQuery, QuerySummary } from "@mongo-query-top/types";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FilterControls } from "../components/FilterControls";
import { QueryDetails } from "../components/QueryDetails";
import { QueryTable } from "../components/QueryTable";
import { SummaryStats } from "../components/SummaryStats";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useFetchServers } from "../hooks/useFetchServers";
import { useServerSentEvents } from "../hooks/useServerSentEvents";
import { useUrlPreferences } from "../hooks/useUrlPreferences";
import { apiClient } from "../utils/api";

// Get the API base URL for display
const getApiBaseUrl = (): string => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:9001`;
};

// Generate summary from filtered queries
const generateSummary = (queries: ProcessedQuery[]): QuerySummary => {
    const operations: Record<string, number> = {};
    const collections: Record<string, number> = {};
    const clients: Record<string, number> = {};
    let unindexedCount = 0;

    queries.forEach((query) => {
        const op = query.operation;
        operations[op] = (operations[op] || 0) + 1;

        const collection = query.collection;
        collections[collection] = (collections[collection] || 0) + 1;

        const clientIp = query.client.ip;
        clients[clientIp] = (clients[clientIp] || 0) + 1;

        if (query.isCollscan) {
            unindexedCount++;
        }
    });

    return {
        totalQueries: queries.length,
        shownQueries: queries.length,
        operations,
        collections,
        clients,
        unindexedCount,
    };
};

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
    const { serverId, setServerId, minTime, refreshInterval, showAll, ipFilter } = useUrlPreferences();
    const { servers, loading: serversLoading } = useFetchServers();
    const [mongoConnected, setMongoConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectError, setConnectError] = useState<string | null>(null);
    const { data, error, isConnected, isReconnecting } = useServerSentEvents(
        serverId,
        minTime,
        refreshInterval,
        showAll,
        mongoConnected,
    );
    const [selectedQuery, setSelectedQuery] = useState<ProcessedQuery | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Filter queries by IP if ipFilter is set
    const filteredQueries = data?.queries.filter((query) => (ipFilter ? query.client.ip === ipFilter : true)) ?? [];

    // Generate summary from filtered queries
    const filteredSummary = useMemo(() => {
        if (!data) {
            return undefined;
        }

        // If IP filter is active, always regenerate summary from filtered queries
        if (ipFilter) {
            return generateSummary(filteredQueries);
        }

        // If no filter is active, use the original summary from the backend
        return data.summary;
    }, [filteredQueries, data, ipFilter]);

    // Auto-connect to MongoDB on mount
    useEffect(() => {
        const connectToMongo = async () => {
            setIsConnecting(true);
            setConnectError(null);
            try {
                await apiClient.post(`/api/servers/${serverId}/connect`);
                setMongoConnected(true);
                setConnectError(null);
            } catch (err: any) {
                setConnectError(err.message || "Failed to connect to MongoDB");
                setMongoConnected(false);
            } finally {
                setIsConnecting(false);
            }
        };

        connectToMongo();
    }, [serverId]);

    // Update browser tab title with query count
    useEffect(() => {
        const queryCount = filteredQueries.length;
        const defaultTitle = "MongoDB Query Monitor";

        if (queryCount >= 2) {
            document.title = `(${queryCount}) ${defaultTitle}`;
        } else {
            document.title = defaultTitle;
        }

        // Cleanup: reset title on unmount
        return () => {
            document.title = defaultTitle;
        };
    }, [filteredQueries.length]);

    const handleQueryClick = (query: ProcessedQuery) => {
        setSelectedQuery(query);
        setIsDialogOpen(true);
    };

    const handleServerChange = (newServerId: string) => {
        setServerId(newServerId);
        setMongoConnected(false);
        setConnectError(null);
    };

    const currentServer = servers.find((s) => s.id === serverId);

    const getConnectionBadge = () => {
        if (isConnecting) {
            return (
                <Badge variant="secondary" className="gap-1.5 border-2 font-mono text-tiny! uppercase">
                    <div className="h-2 w-2 animate-spin border border-muted-foreground/20 border-t-muted-foreground" />
                    CONNECTING
                </Badge>
            );
        }

        if (isConnected) {
            return (
                <Badge
                    variant="success"
                    className="border-2 border-primary bg-primary/20 font-mono text-tiny! text-primary uppercase"
                >
                    ● CONNECTED
                </Badge>
            );
        }

        if (isReconnecting) {
            return (
                <Badge variant="secondary" className="border-2 font-mono text-tiny! uppercase">
                    ⟳ RECONNECTING
                </Badge>
            );
        }

        return (
            <Badge variant="destructive" className="border-2 font-mono text-tiny! uppercase">
                ○ DISCONNECTED
            </Badge>
        );
    };

    return (
        <div className="min-h-screen space-y-0 bg-background p-6">
            {/* ASCII Header Border */}
            <div className="animate-reveal mb-4 border-2 border-primary p-4 font-mono text-xs leading-tight opacity-0">
                <div className="mb-2 text-primary">
                    ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
                </div>
                <header className="space-y-2">
                    <div className="flex items-start justify-between">
                        <div className="space-y-0.5 pl-3">
                            <h1 className="terminal-cursor text-xl tracking-wider text-primary">
                                MONGODB_QUERY_MONITOR
                            </h1>
                            <p className="text-tiny tracking-wide text-muted-foreground uppercase">
                                ▸ REAL-TIME DATABASE OPERATIONS STREAM
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">SRV:</span>
                                <Select value={serverId} onValueChange={handleServerChange} disabled={serversLoading}>
                                    <SelectTrigger className="h-8 w-50 border-2 border-border bg-input font-mono text-xs">
                                        <SelectValue placeholder="Select a server">
                                            {currentServer?.name || serverId}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="border-2 border-border">
                                        {servers.map((server) => (
                                            <SelectItem key={server.id} value={server.id} className="font-mono text-xs">
                                                {server.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-3">
                                {getConnectionBadge()}
                                {data?.metadata?.isMockData && (
                                    <Badge
                                        variant="outline"
                                        className="gap-1 border-warning bg-warning font-mono text-warning-foreground"
                                    >
                                        ⚠ MOCK_DATA
                                    </Badge>
                                )}
                            </div>
                            {data?.metadata && (
                                <span className="font-mono text-tiny text-muted-foreground">
                                    LAST_UPDATE: {new Date(data.metadata.timestamp).toLocaleTimeString()}
                                </span>
                            )}
                        </div>
                    </div>
                </header>
                <div className="text-primary">
                    ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                </div>
            </div>

            <div className="animate-reveal space-y-4 opacity-0 delay-100">
                <FilterControls />

                {connectError && (
                    <div className="border-2 border-destructive bg-destructive/10 p-6">
                        <div className="mb-2 flex items-center gap-2">
                            <span className="text-xl">▼</span>
                            <p className="font-mono text-sm font-bold text-destructive uppercase">
                                MONGODB_CONNECTION_ERROR
                            </p>
                        </div>
                        <p className="font-mono text-xs text-muted-foreground">└─ {connectError}</p>
                    </div>
                )}

                {error && !isReconnecting && (
                    <div className="border-2 border-destructive bg-destructive/10 p-6">
                        <div className="mb-2 flex items-center gap-2">
                            <span className="text-xl">▼</span>
                            <p className="font-mono text-sm font-bold text-destructive uppercase">STREAM_ERROR</p>
                        </div>
                        <p className="font-mono text-xs text-muted-foreground">└─ {error}</p>
                        <p className="mt-2 font-mono text-xs text-muted-foreground">└─ API_SERVER: {getApiBaseUrl()}</p>
                    </div>
                )}

                {isReconnecting && (
                    <div className="border-2 border-border bg-muted p-6">
                        <div className="flex items-center gap-3">
                            <div className="h-4 w-4 animate-spin border-2 border-muted-foreground/20 border-t-muted-foreground" />
                            <p className="font-mono text-sm font-bold uppercase">RECONNECTING_TO_SERVER</p>
                        </div>
                        <p className="mt-2 font-mono text-xs text-muted-foreground">
                            └─ Connection interrupted. Auto-reconnect in progress...
                        </p>
                    </div>
                )}
            </div>

            {data && filteredSummary && (
                <>
                    <div className="animate-reveal opacity-0 delay-200">
                        <SummaryStats summary={filteredSummary} />
                    </div>
                    <div className="animate-reveal opacity-0 delay-300">
                        <QueryTable queries={filteredQueries} onQueryClick={handleQueryClick} />
                    </div>
                </>
            )}

            {!data && !error && (
                <div className="py-24 text-center">
                    <div className="inline-block h-16 w-16 animate-spin border-4 border-border border-t-primary"></div>
                    <p className="mt-6 font-mono text-sm tracking-wide text-muted-foreground uppercase">
                        INITIALIZING_MONGODB_CONNECTION
                    </p>
                    <p className="mt-2 font-mono text-xs text-muted-foreground">Loading query stream...</p>
                </div>
            )}

            <QueryDetails query={selectedQuery} open={isDialogOpen} onOpenChange={setIsDialogOpen} />
        </div>
    );
}
