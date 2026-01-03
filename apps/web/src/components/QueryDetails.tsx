import JsonView from "@microlink/react-json-view";
import type { ProcessedQuery } from "@mongo-query-top/types";
import { Check, FloppyDisk } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { usePreferences } from "../store/preferences";
import { apiClient } from "../utils/api";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";

interface QueryDetailsProps {
    query: ProcessedQuery | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const QueryDetails = ({ query, open, onOpenChange }: QueryDetailsProps) => {
    const { serverId } = usePreferences();
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    if (!query) {
        return null;
    }

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await apiClient.post(`/api/queries/${serverId}/save`, { query });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error("Failed to save query:", err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[800px] overflow-auto sm:max-w-[800px]">
                <SheetHeader className="flex-row items-start justify-between pr-12">
                    <div className="flex flex-col gap-1.5">
                        <SheetTitle>Query Details</SheetTitle>
                        <SheetDescription>Detailed information about operation #{query.opid}</SheetDescription>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || saved}
                        size="sm"
                        variant={saved ? "default" : "outline"}
                    >
                        {saved ? (
                            <>
                                <Check weight="bold" className="mr-2 h-4 w-4" />
                                Saved
                            </>
                        ) : (
                            <>
                                <FloppyDisk weight="bold" className="mr-2 h-4 w-4" />
                                Save
                            </>
                        )}
                    </Button>
                </SheetHeader>

                <div className="space-y-4 px-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Operation ID</div>
                            <div className="font-mono text-sm">{query.opid}</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Runtime</div>
                            <div className="text-lg font-semibold">{query.runtime_formatted}</div>
                            {query.secs_running >= 1 && (
                                <div className="text-xs text-muted-foreground">({query.secs_running} seconds)</div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Operation</div>
                            <div className="font-mono text-sm">{query.operation}</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Namespace</div>
                            <div className="font-mono text-sm">
                                <span className="text-muted-foreground">{query.database}.</span>
                                <span className="font-semibold">{query.collection}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Client IP</div>
                            <div className="font-mono text-sm">{query.client.ip}</div>
                            {query.client.port && (
                                <div className="text-xs text-muted-foreground">Port: {query.client.port}</div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">User Agent</div>
                            <div className="text-sm">{query.userAgent}</div>
                        </div>
                    </div>

                    {query.client.geo && (
                        <div className="rounded-md bg-muted p-3">
                            <div className="mb-1 text-sm font-medium">Location</div>
                            <div className="text-sm text-muted-foreground">
                                {query.client.geo.city && `${query.client.geo.city}, `}
                                {query.client.geo.region && `${query.client.geo.region}, `}
                                {query.client.geo.country}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        {query.isCollscan && <Badge variant="destructive">COLLSCAN</Badge>}
                        {query.waitingForLock && <Badge variant="outline">🔒 Waiting for Lock</Badge>}
                        {query.planSummary && !query.isCollscan && <Badge variant="outline">{query.planSummary}</Badge>}
                    </div>

                    {query.isCollscan && (
                        <div className="rounded-md border border-destructive bg-destructive/10 p-4">
                            <div className="flex items-start gap-2">
                                <span className="text-2xl">⚠️</span>
                                <div>
                                    <h4 className="mb-1 font-semibold">Collection Scan Detected</h4>
                                    <p className="text-sm text-muted-foreground">
                                        This query is performing a collection scan without using an index. Consider
                                        adding an appropriate index to improve performance.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {query.message && (
                        <div className="rounded-md bg-muted p-3">
                            <div className="mb-1 text-sm font-medium">Message</div>
                            <div className="font-mono text-sm text-muted-foreground">{query.message}</div>
                        </div>
                    )}

                    <div className="max-h-[600px] overflow-auto rounded-md border border-border bg-slate-50 p-4 dark:bg-slate-900">
                        <JsonView
                            src={query.query}
                            name={false}
                            collapsed={4}
                            displayDataTypes={false}
                            displayObjectSize={false}
                            enableClipboard={false}
                            style={{
                                fontSize: "13px",
                                fontFamily: "ui-monospace, monospace",
                            }}
                        />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};
