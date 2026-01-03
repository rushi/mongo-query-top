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
import { usePreferences } from "../store/preferences";
import type { ProcessedQuery } from "../types";
import { apiClient } from "../utils/api";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
    const { serverId, setServerId, minTime, refreshInterval } = usePreferences();
    const { servers, loading: serversLoading } = useFetchServers();
    const [mongoConnected, setMongoConnected] = useState(false);
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
            try {
                await apiClient.post(`/api/servers/${serverId}/connect`);
                setMongoConnected(true);
                setConnectError(null);
            } catch (err: any) {
                setConnectError(err.message || "Failed to connect to MongoDB");
                setMongoConnected(false);
            }
        };

        connectToMongo();
    }, [serverId]);

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

    return (
        <div className="min-h-screen bg-background p-6 space-y-6">
            <header>
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold">MongoDB Query Monitor</h1>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Server:</span>
                            <Select value={serverId} onValueChange={handleServerChange} disabled={serversLoading}>
                                <SelectTrigger className="w-[200px] h-8">
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
                        <Badge variant={isConnected ? "default" : isReconnecting ? "secondary" : "destructive"}>
                            {isConnected ? "● Connected" : isReconnecting ? "⟳ Reconnecting..." : "○ Disconnected"}
                        </Badge>
                        {data?.metadata && (
                            <span className="text-muted-foreground">
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

            {error && (
                <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
                    <p className="font-semibold text-destructive">Stream Error</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Make sure the API server is running on {import.meta.env.VITE_API_URL || "http://localhost:9001"}
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
