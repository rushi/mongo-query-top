import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FilterControls } from "../components/FilterControls";
import { SummaryStats } from "../components/SummaryStats";
import { QueryTable } from "../components/QueryTable";
import { QueryDetails } from "../components/QueryDetails";
import { useServerSentEvents } from "../hooks/useServerSentEvents";
import { usePreferences } from "../store/preferences";
import { Badge } from "../components/ui/badge";
import type { ProcessedQuery } from "../types";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
    const { serverId, minTime, refreshInterval } = usePreferences();
    const { data, error, isConnected } = useServerSentEvents(
        serverId,
        minTime,
        refreshInterval
    );
    const [selectedQuery, setSelectedQuery] = useState<ProcessedQuery | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleQueryClick = (query: ProcessedQuery) => {
        setSelectedQuery(query);
        setIsDialogOpen(true);
    };

    return (
        <div className="min-h-screen bg-background p-6 space-y-6">
            <header className="space-y-2">
                <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-bold">MongoDB Query Monitor</h1>
                    <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Server: {serverId}</span>
                        <Badge variant={isConnected ? "default" : "destructive"}>
                            {isConnected ? "● Connected" : "○ Disconnected"}
                        </Badge>
                        {data?.metadata && (
                            <span className="text-muted-foreground">
                                Last update:{" "}
                                {new Date(data.metadata.timestamp).toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                </div>
                <p className="text-muted-foreground">
                    Real-time monitoring of MongoDB queries with performance insights
                </p>
            </header>

            <FilterControls />

            {error && (
                <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                    <p className="font-semibold text-destructive">Connection Error</p>
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
                    <p className="mt-4 text-muted-foreground">
                        Connecting to MongoDB and loading queries...
                    </p>
                </div>
            )}

            <QueryDetails
                query={selectedQuery}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
            />
        </div>
    );
}
