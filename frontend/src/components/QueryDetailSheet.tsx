"use client";

import React from "react";
import { MongoQuery } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/Sheet";
import { AlertTriangle } from "lucide-react";

interface QueryDetailSheetProps {
    query: MongoQuery | null;
    isOpen: boolean;
    onClose: () => void;
    onKillQuery: (opid: string) => Promise<void>;
}

const formatQuery = (query: any): string => {
    if (typeof query === "string") return query;
    try {
        return JSON.stringify(query, null, 2);
    } catch {
        return String(query);
    }
};

const QueryDetailSheet: React.FC<QueryDetailSheetProps> = ({ query, isOpen, onClose, onKillQuery }) => {
    const handleKillQuery = async () => {
        if (!query) return;
        await onKillQuery(query.opid);
        onClose();
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-[600px] sm:max-w-[600px]">
                {query && (
                    <div className="p-4">
                        <SheetHeader>
                            <SheetTitle>Query Details</SheetTitle>
                            <SheetDescription>Operation ID: {query.opid}</SheetDescription>
                        </SheetHeader>

                        <div className="mt-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-muted-foreground text-sm font-medium">Operation</label>
                                    <p className="mt-1 font-mono">{query.operation}</p>
                                </div>
                                <div>
                                    <label className="text-muted-foreground text-sm font-medium">Runtime</label>
                                    <p className="mt-1">
                                        <Badge variant={query.runTime > 10 ? "destructive" : "secondary"}>
                                            {query.runTimeFormatted}
                                        </Badge>
                                    </p>
                                </div>
                                <div>
                                    <label className="text-muted-foreground text-sm font-medium">Namespace</label>
                                    <p className="mt-1 font-mono text-sm">{query.namespace}</p>
                                </div>
                                <div>
                                    <label className="text-muted-foreground text-sm font-medium">Plan Summary</label>
                                    <p className="mt-1">
                                        {query.planSummary ? (
                                            <Badge variant={query.isCollectionScan ? "destructive" : "outline"}>
                                                {query.planSummary}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground">N/A</span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-muted-foreground text-sm font-medium">Query</label>
                                <pre className="bg-muted mt-2 max-h-64 overflow-auto rounded p-4 text-xs">
                                    {formatQuery(query.query)}
                                </pre>
                            </div>

                            {query.client && (
                                <div>
                                    <label className="text-muted-foreground text-sm font-medium">
                                        Client Information
                                    </label>
                                    <div className="mt-2 space-y-2 rounded border p-4">
                                        <div>
                                            <span className="text-sm font-medium">IP Address:</span>
                                            <span className="ml-2 font-mono text-sm">{query.client.ip}</span>
                                        </div>
                                        {query.client.location && (
                                            <div>
                                                <span className="text-sm font-medium">Location:</span>
                                                <span className="ml-2 text-sm">
                                                    {query.client.location.city}, {query.client.location.region},{" "}
                                                    {query.client.location.country}
                                                </span>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-sm font-medium">User Agent:</span>
                                            <span className="ml-2 text-sm">{query.userAgent}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(query.isCollectionScan || query.waitingForLock || query.message) && (
                                <div>
                                    <label className="text-muted-foreground text-sm font-medium">
                                        Status & Warnings
                                    </label>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {query.isCollectionScan && (
                                            <Badge variant="destructive">
                                                <AlertTriangle className="mr-1 h-3 w-3" />
                                                Collection Scan
                                            </Badge>
                                        )}
                                        {query.waitingForLock && <Badge variant="outline">Waiting for Lock</Badge>}
                                        {query.message && <Badge variant="secondary">{query.message}</Badge>}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 border-t pt-4">
                                <Button variant="destructive" onClick={handleKillQuery} className="flex-1">
                                    Kill Query
                                </Button>
                                <Button variant="outline" onClick={onClose} className="flex-1">
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};

export default QueryDetailSheet;
