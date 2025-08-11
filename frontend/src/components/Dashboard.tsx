"use client";

import QueryDetailSheet from "@/components/QueryDetailSheet";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { MongoApiService } from "@/lib/api";
import { CurrentOpResponse, MongoQuery } from "@/lib/types";
import { Play, Pause, RefreshCw, Save, AlertTriangle, Database, Clock, Users, Activity } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const Dashboard = () => {
    const [data, setData] = useState<CurrentOpResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [selectedQuery, setSelectedQuery] = useState<MongoQuery | null>(null);

    const api = MongoApiService.getInstance();

    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const response = await api.getCurrentOperations();
            setData(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch data");
        } finally {
            setLoading(false);
        }
    }, [api]);

    const handleSaveSnapshot = async () => {
        try {
            await api.saveSnapshot();
            await fetchData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save snapshot");
        }
    };

    const handleKillQuery = async (opid: string) => {
        if (!confirm(`Are you sure you want to kill query ${opid}?`)) {
            return;
        }

        try {
            await api.killQuery(opid);
            await fetchData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to kill query");
        }
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!autoRefresh || !data?.metadata?.refreshInterval) {
            return;
        }

        const interval = setInterval(() => {
            fetchData();
        }, data.metadata.refreshInterval * 1000);

        return () => clearInterval(interval);
    }, [autoRefresh, data?.metadata?.refreshInterval, fetchData]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading MongoDB operations...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Card className="w-96">
                    <CardHeader>
                        <CardTitle className="text-red-600">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4 text-red-600">{error}</p>
                        <Button onClick={fetchData} variant="outline">
                            <RefreshCw className="mr-2 size-4" />
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    const { metadata, data: queryData } = data;
    const { queries, summary } = queryData;

    return (
        <div className="w-full space-y-6 p-4">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 gap-x-1">
                                MongoDB Query Top - <span>{metadata.name}</span>
                            </CardTitle>
                            <CardDescription className="text-xs">
                                <div className="mt-2 flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                        <RefreshCw className="size-3" />
                                        {metadata.refreshInterval}s refresh
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="size-3" />
                                        Min time: {metadata.minTime}s
                                    </span>
                                    {metadata.connections && (
                                        <span className="flex items-center gap-1">
                                            <Users className="size-3" />
                                            {metadata.connections.current}/{metadata.connections.available} connections
                                        </span>
                                    )}
                                    <span>Last updated: {new Date(metadata.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div className="pt-1 text-xs text-gray-400">{metadata.uri}</div>
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant={autoRefresh ? "default" : "outline"}
                                onClick={() => setAutoRefresh(!autoRefresh)}
                            >
                                {autoRefresh ? <Pause className="size-4" /> : <Play className="size-4" />}
                                {autoRefresh ? "Pause" : "Resume"}
                            </Button>
                            <Button onClick={fetchData} variant="outline" size="sm">
                                <RefreshCw className="size-4" />
                            </Button>
                            <Button onClick={handleSaveSnapshot} variant="outline" size="sm">
                                <Save className="size-4" />
                                Snapshot
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.displayedQueries}</div>
                        <p className="text-muted-foreground text-xs">{summary.skippedQueries} filtered out</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Collection Scans</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{summary.unindexedQueries}</div>
                        <p className="text-muted-foreground text-xs">Unindexed queries</p>
                    </CardContent>
                </Card>

                {/* Connections Card */}
                {metadata.connections && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-1">
                                <Activity className="h-4 w-4" />
                                Connections
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metadata.connections.current}</div>
                            <p className="text-muted-foreground text-xs">
                                of {metadata.connections.available} available
                            </p>
                            <div className="mt-2 space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span>Active:</span>
                                    <span>{metadata.connections.active}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span>Total Created:</span>
                                    <span>{metadata.connections.totalCreated}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Operations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            {Object.entries(summary.operations)
                                .slice(0, 3)
                                .map(([op, count]) => (
                                    <div key={op} className="flex justify-between text-sm">
                                        <span>{op}</span>
                                        <span>{count}</span>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Namespaces</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            {Object.entries(summary.namespaces)
                                .slice(0, 3)
                                .map(([ns, count]) => (
                                    <div key={ns} className="flex justify-between text-sm">
                                        <span className="truncate">{ns}</span>
                                        <span>{count}</span>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Queries Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Active Queries</CardTitle>
                    <CardDescription>
                        {metadata.message && (
                            <Badge variant="outline" className="mt-2">
                                {metadata.message}
                            </Badge>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {queries.length === 0 ? (
                        <div className="text-muted-foreground py-8 text-center">
                            No active queries matching criteria
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">#</TableHead>
                                    <TableHead>Operation ID</TableHead>
                                    <TableHead>Runtime</TableHead>
                                    <TableHead>Operation</TableHead>
                                    <TableHead>Namespace</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-20">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {queries.map((query) => (
                                    <TableRow
                                        key={query.opid}
                                        className={
                                            query.isCollectionScan ? "bg-yellow-50 dark:bg-yellow-950/20" : undefined
                                        }
                                    >
                                        <TableCell className="font-medium">{query.index}</TableCell>
                                        <TableCell className="font-mono text-sm">{query.opid}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    query.runTime > 180
                                                        ? "destructive"
                                                        : query.runTime < 60
                                                          ? "outline"
                                                          : "secondary"
                                                }
                                            >
                                                {query.runTimeFormatted}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{query.operation}</div>
                                                {query.planSummary && (
                                                    <div className="text-muted-foreground text-xs">
                                                        {query.planSummary}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">{query.namespace}</TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <div>{query.client?.ip || "N/A"}</div>
                                                {query.client?.location && (
                                                    <div className="text-muted-foreground text-xs">
                                                        {query.client.location.city}, {query.client.location.country}
                                                    </div>
                                                )}
                                                <div className="text-muted-foreground text-xs">{query.userAgent}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                {query.isCollectionScan && (
                                                    <Badge variant="destructive" className="w-fit">
                                                        <AlertTriangle className="mr-1 h-3 w-3" />
                                                        COLLSCAN
                                                    </Badge>
                                                )}
                                                {query.waitingForLock && (
                                                    <Badge variant="outline" className="w-fit">
                                                        Waiting for lock
                                                    </Badge>
                                                )}
                                                {query.message && (
                                                    <Badge variant="secondary" className="w-fit">
                                                        {query.message}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setSelectedQuery(query)}
                                                >
                                                    View
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleKillQuery(query.opid)}
                                                    title="Kill Query"
                                                >
                                                    Kill
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Query Detail Sheet */}
            <QueryDetailSheet
                query={selectedQuery}
                isOpen={!!selectedQuery}
                onClose={() => setSelectedQuery(null)}
                onKillQuery={handleKillQuery}
            />
        </div>
    );
};

export default Dashboard;
