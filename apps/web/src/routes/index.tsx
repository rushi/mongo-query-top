import type { ProcessedQuery } from "@mongo-query-top/types";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
    const { serverId, setServerId, minTime, refreshInterval } = useUrlPreferences();
    const { servers, loading: serversLoading } = useFetchServers();
    const [mongoConnected, setMongoConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectError, setConnectError] = useState<string | null>(null);
    const { data, error, isConnected, isReconnecting } = useServerSentEvents(
        serverId,
        minTime,
        refreshInterval,
        mongoConnected,
    );
    const [selectedQuery, setSelectedQuery] = useState<ProcessedQuery | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

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
        const queryCount = data?.queries.length || 0;
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
    }, [data?.queries.length]);

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
                <Badge variant="secondary" className="gap-1.5">
                    <div className="h-3 w-3 rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground animate-spin" />
                    Connecting...
                </Badge>
            );
        }

        if (isConnected) {
            return <Badge variant="success">● Connected</Badge>;
        }

        if (isReconnecting) {
            return <Badge variant="secondary">⟳ Reconnecting...</Badge>;
        }

        return <Badge variant="destructive">○ Disconnected</Badge>;
    };

    return (
        <div className="min-h-screen bg-background p-6 space-y-6">
            <header>
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">MongoDB Query Monitor</h1>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Server:</span>
                            <Select value={serverId} onValueChange={handleServerChange} disabled={serversLoading}>
                                <SelectTrigger className="w-50 h-8">
                                    <SelectValue placeholder="Select a server">
                                        {currentServer?.name || serverId}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {servers.map((server) => (
                                        <SelectItem key={server.id} value={server.id}>
                                            {server.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {getConnectionBadge()}
                        {data?.metadata && (
                            <span className="text-xs font-mono text-muted-foreground">
                                Last update: {new Date(data.metadata.timestamp).toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                </div>
                <p className="text-muted-foreground">
                    Real-time monitoring of MongoDB queries with performance insights
                </p>
            </header>

            <FilterControls />

            {connectError && (
                <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
                    <p className="font-semibold text-destructive">MongoDB Connection Error</p>
                    <p className="text-sm text-muted-foreground">{connectError}</p>
                </div>
            )}

            {error && !isReconnecting && (
                <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
                    <p className="font-semibold text-destructive">Stream Error</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Make sure the API server is running on {import.meta.env.VITE_API_URL || "http://localhost:9001"}
                    </p>
                </div>
            )}

            {isReconnecting && (
                <div className="p-4 bg-muted border border-border rounded-md">
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground animate-spin" />
                        <p className="font-medium">Reconnecting to server...</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        Connection was interrupted. Attempting to reconnect automatically.
                    </p>
                </div>
            )}

            {data && (
                <>
                    <SummaryStats summary={data.summary} />
                    <QueryTable queries={data.queries} onQueryClick={handleQueryClick} />
                </>
            )}

            {!data && !error && (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="mt-4 text-muted-foreground">Connecting to MongoDB and loading queries...</p>
                </div>
            )}

            <QueryDetails query={selectedQuery} open={isDialogOpen} onOpenChange={setIsDialogOpen} />
        </div>
    );
}
