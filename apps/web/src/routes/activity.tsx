import type { ActivityMode, ReadPreferenceMode } from "@mongo-query-top/types";
import { createFileRoute } from "@tanstack/react-router";
import { useSetState, useTitle } from "ahooks";
import { useEffect, useState } from "react";
import { ActivityControls } from "../components/collection-activity/ActivityControls";
import { ActivityTable } from "../components/collection-activity/ActivityTable";
import { ConnectionBadge } from "../components/shared/ConnectionBadge";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useCollectionActivity } from "../hooks/useCollectionActivity";
import { useFetchServers } from "../hooks/useFetchServers";
import { useUrlPreferences } from "../hooks/useUrlPreferences";
import { cn } from "../lib/utils";
import { usePreferences } from "../store/preferences";
import { apiClient, getApiBaseUrl } from "../utils/api";

const resolveReadPreference = (
    urlValue: ReadPreferenceMode | undefined,
    perServerValue: ReadPreferenceMode | undefined,
): ReadPreferenceMode => urlValue ?? perServerValue ?? "primary";

export const Route = createFileRoute("/activity")({ component: CollectionActivityPage });

function CollectionActivityPage() {
    const { servers, loading: serversLoading } = useFetchServers();
    const {
        serverId,
        setServerId,
        refreshInterval,
        showAll,
        toggleShowAll,
        readPreference: urlReadPreference,
        setReadPreference: setUrlReadPreference,
    } = useUrlPreferences();

    const readPreferenceByServer = usePreferences((state) => state.readPreferenceByServer);
    const setStoredReadPreference = usePreferences((state) => state.setReadPreference);
    const readPreference = resolveReadPreference(urlReadPreference, readPreferenceByServer[serverId]);
    const isSecondary = readPreference === "secondaryPreferred";
    const accentClass = isSecondary
        ? { border: "border-secondary-read", text: "text-secondary-read" }
        : { border: "border-primary", text: "text-primary" };

    const [mode, setMode] = useState<ActivityMode>("diff");
    const [connectionState, setConnectionState] = useSetState({
        isConnecting: false,
        mongoConnected: false,
        connectError: null as string | null,
    });

    const { data, error, isConnected, isReconnecting, history } = useCollectionActivity(
        serverId,
        refreshInterval,
        showAll,
        readPreference,
        connectionState.mongoConnected,
    );

    // Auto-connect to MongoDB on mount / server change
    useEffect(() => {
        const connectToMongo = async () => {
            setConnectionState({ isConnecting: true, connectError: null });
            try {
                await apiClient.post(`/servers/${serverId}/connect`);
                setConnectionState({ mongoConnected: true, connectError: null, isConnecting: false });
            } catch (err: unknown) {
                setConnectionState({
                    connectError: err instanceof Error ? err.message : "Failed to connect to MongoDB",
                    mongoConnected: false,
                    isConnecting: false,
                });
            }
        };

        connectToMongo();
    }, [serverId, setConnectionState]);

    const currentServer = servers.find((s) => s.id === serverId);
    const serverName = currentServer?.name ?? serverId;
    const collectionCount = data?.collections.length ?? 0;
    useTitle(`[${serverName}] Collection Activity`);

    const handleReadPreferenceChange = (pref: ReadPreferenceMode) => {
        setUrlReadPreference(pref);
        setStoredReadPreference(serverId, pref);
    };

    const handleServerChange = (newServerId: string) => {
        setServerId(newServerId);
        setUrlReadPreference(undefined);
        setConnectionState({ mongoConnected: false, connectError: null });
    };

    return (
        <div className="flex h-full flex-col overflow-hidden bg-background p-6">
            <div
                className={cn(
                    "animate-reveal mb-4 shrink-0 border-2 p-4 font-mono text-xs leading-tight opacity-0",
                    accentClass.border,
                )}
            >
                <header className="flex items-start justify-between">
                    <div className="space-y-0.5">
                        <h1 className={cn("terminal-cursor text-xl tracking-wider", accentClass.text)}>
                            COLLECTION_ACTIVITY
                        </h1>
                        <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
                            ▸ LIVE READ/WRITE ACTIVITY PER COLLECTION{" "}
                            {data?.metadata && (
                                <span className="text-[10px] text-muted-foreground">
                                    LAST_UPDATE: {new Date(data.metadata.timestamp).toLocaleTimeString()} ·{" "}
                                    {collectionCount} NS
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">SRV:</span>
                            <Select value={serverId} disabled={serversLoading} onValueChange={handleServerChange}>
                                <SelectTrigger className="h-8 w-50 border-2 border-border bg-input font-mono text-xs">
                                    <SelectValue placeholder="Select a server">{serverName}</SelectValue>
                                </SelectTrigger>
                                <SelectContent className="border-2 border-border">
                                    {servers.map((server) => (
                                        <SelectItem key={server.id} value={server.id} className="font-mono text-xs">
                                            {server.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span className="ml-2 text-muted-foreground">READ:</span>
                            <Button
                                variant={readPreference === "primary" ? "default" : "outline"}
                                className="h-8 border-2 font-mono text-xs tracking-wide uppercase"
                                onClick={() => handleReadPreferenceChange("primary")}
                            >
                                PRIMARY
                            </Button>
                            <Button
                                variant="outline"
                                className={cn(
                                    "h-8 border-2 font-mono text-xs tracking-wide uppercase",
                                    isSecondary &&
                                        "border-secondary-read bg-secondary-read text-secondary-read-foreground",
                                )}
                                onClick={() => handleReadPreferenceChange("secondaryPreferred")}
                            >
                                SECONDARY
                            </Button>
                        </div>
                        <ConnectionBadge
                            isConnecting={connectionState.isConnecting}
                            isConnected={isConnected}
                            isReconnecting={isReconnecting}
                            isSecondary={isSecondary}
                        />
                    </div>
                </header>
            </div>

            <div className="mb-4 flex shrink-0 items-center justify-between">
                <ActivityControls
                    showAll={showAll}
                    mode={mode}
                    onModeChange={setMode}
                    onToggleShowAll={toggleShowAll}
                />
            </div>

            {connectionState.connectError && (
                <div className="mb-4 shrink-0 border-2 border-destructive bg-destructive/10 p-4">
                    <p className="font-mono text-xs text-muted-foreground">└─ {connectionState.connectError}</p>
                </div>
            )}

            {error && !isReconnecting && (
                <div className="mb-4 shrink-0 border-2 border-destructive bg-destructive/10 p-6">
                    <p className="font-mono text-sm font-bold text-destructive uppercase">▼ STREAM_ERROR</p>
                    <p className="mt-2 font-mono text-xs text-muted-foreground">└─ {error}</p>
                    <p className="mt-2 font-mono text-xs text-muted-foreground">└─ API_SERVER: {getApiBaseUrl()}</p>
                </div>
            )}

            {data ? (
                <ActivityTable
                    collections={data.collections}
                    history={history}
                    mode={mode}
                    className="animate-reveal min-h-0 flex-1 opacity-0 delay-100"
                />
            ) : (
                !error && (
                    <div className="py-24 text-center">
                        <div className="inline-block h-16 w-16 animate-spin border-4 border-border border-t-primary" />
                        <p className="mt-6 font-mono text-sm tracking-wide text-muted-foreground uppercase">
                            INITIALIZING_MONGODB_CONNECTION
                        </p>
                        <p className="mt-2 font-mono text-xs text-muted-foreground">Loading collection activity...</p>
                    </div>
                )
            )}
        </div>
    );
}
