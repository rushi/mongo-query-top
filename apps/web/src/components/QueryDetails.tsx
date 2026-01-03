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
            <SheetContent className="w-[900px] overflow-auto border-l-4 border-l-primary bg-background pb-6 sm:max-w-[900px]">
                <SheetHeader className="flex-row items-start justify-between border-b-2 border-border pr-12 pb-4">
                    <div className="flex flex-col gap-2">
                        <SheetTitle className="font-mono text-xl tracking-wider text-primary uppercase">
                            QUERY_DETAILS
                        </SheetTitle>
                        <SheetDescription className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
                            ▸ OPERATION_ID: {query.opid}
                        </SheetDescription>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || saved}
                        size="sm"
                        variant={saved ? "default" : "outline"}
                        className="border-2 font-mono text-xs uppercase"
                    >
                        {saved ? (
                            <>
                                <Check weight="bold" className="mr-2 h-3 w-3" />
                                SAVED
                            </>
                        ) : (
                            <>
                                <FloppyDisk weight="bold" className="mr-2 h-3 w-3" />
                                SAVE
                            </>
                        )}
                    </Button>
                </SheetHeader>

                <div className="mt-4 space-y-4 px-6">
                    {/* Metadata Grid */}
                    <div className="border-2 border-border bg-card">
                        <div className="border-b-2 border-border bg-muted px-4 py-2">
                            <span className="font-mono text-xs tracking-wider text-primary uppercase">■ METADATA</span>
                        </div>
                        <div className="grid grid-cols-2 gap-0">
                            <div className="border-r border-b border-border p-4">
                                <div className="mb-1 font-mono text-tiny tracking-wide text-muted-foreground uppercase">
                                    OPERATION_ID
                                </div>
                                <div className="font-mono text-sm text-foreground">{query.opid}</div>
                            </div>
                            <div className="border-b border-border p-4">
                                <div className="mb-1 font-mono text-tiny tracking-wide text-muted-foreground uppercase">
                                    RUNTIME
                                </div>
                                <div className="font-mono text-sm text-primary">{query.runtime_formatted}</div>
                                {query.secs_running >= 1 && (
                                    <div className="mt-1 font-mono text-tiny text-muted-foreground">
                                        ({query.secs_running}s)
                                    </div>
                                )}
                            </div>
                            <div className="border-r border-b border-border p-4">
                                <div className="mb-1 font-mono text-tiny tracking-wide text-muted-foreground uppercase">
                                    OPERATION
                                </div>
                                <div className="font-mono text-sm text-foreground uppercase">{query.operation}</div>
                            </div>
                            <div className="border-b border-border p-4">
                                <div className="mb-1 font-mono text-tiny tracking-wide text-muted-foreground uppercase">
                                    NAMESPACE
                                </div>
                                <div className="font-mono text-sm text-foreground">
                                    <span className="text-muted-foreground">{query.database}.</span>
                                    <span className="font-medium">{query.collection}</span>
                                </div>
                            </div>
                            <div className="border-r border-border p-4">
                                <div className="mb-1 font-mono text-tiny tracking-wide text-muted-foreground uppercase">
                                    CLIENT_IP
                                </div>
                                <div className="font-mono text-sm text-foreground">{query.client.ip}</div>
                                {query.client.port && (
                                    <div className="mt-1 font-mono text-tiny text-muted-foreground">
                                        PORT: {query.client.port}
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <div className="mb-1 font-mono text-tiny tracking-wide text-muted-foreground uppercase">
                                    USER_AGENT
                                </div>
                                <div className="font-mono text-sm text-foreground">{query.userAgent}</div>
                            </div>
                        </div>
                    </div>

                    {/* Geolocation */}
                    {query.client.geo && (
                        <div className="border-2 border-border bg-muted p-4">
                            <div className="mb-2 font-mono text-tiny tracking-wide text-primary uppercase">
                                ▸ GEOLOCATION
                            </div>
                            <div className="font-mono text-sm text-foreground">
                                {query.client.geo.city && `${query.client.geo.city}, `}
                                {query.client.geo.region && `${query.client.geo.region}, `}
                                {query.client.geo.country}
                            </div>
                        </div>
                    )}

                    {/* Status Badges */}
                    <div className="flex gap-2">
                        {query.isCollscan && (
                            <Badge
                                variant="destructive"
                                className="border-2 border-warning bg-warning/20 font-mono text-xs text-warning uppercase"
                            >
                                ⚠ COLLSCAN
                            </Badge>
                        )}
                        {query.waitingForLock && (
                            <Badge
                                variant="outline"
                                className="border-2 border-destructive font-mono text-xs uppercase"
                            >
                                🔒 WAITING_FOR_LOCK
                            </Badge>
                        )}
                        {query.planSummary && !query.isCollscan && (
                            <Badge variant="outline" className="border-2 font-mono text-xs uppercase">
                                {query.planSummary}
                            </Badge>
                        )}
                    </div>

                    {/* COLLSCAN Warning */}
                    {query.isCollscan && (
                        <div className="border-2 border-warning bg-warning/10 p-6">
                            <div className="mb-2 flex items-center gap-2">
                                <span className="text-2xl">▼</span>
                                <h4 className="font-mono text-sm font-bold text-warning uppercase">
                                    COLLECTION_SCAN_DETECTED
                                </h4>
                            </div>
                            <p className="font-mono text-xs leading-relaxed text-muted-foreground">
                                └─ This query performs a full collection scan without using an index. Performance will
                                degrade as collection size grows. Consider adding an appropriate index.
                            </p>
                        </div>
                    )}

                    {/* Message */}
                    {query.message && (
                        <div className="border-2 border-border bg-muted p-4">
                            <div className="mb-2 font-mono text-tiny tracking-wide text-primary uppercase">
                                ▸ MESSAGE
                            </div>
                            <div className="font-mono text-xs text-muted-foreground">{query.message}</div>
                        </div>
                    )}

                    {/* Query JSON */}
                    <div className="border">
                        <div className="flex items-center border-b bg-muted px-4 py-3">
                            <span className="font-mono text-xs tracking-wider text-primary uppercase">
                                ■ QUERY_OBJECT
                            </span>
                        </div>
                        <div className="max-h-[600px] overflow-auto bg-card p-4">
                            <JsonView
                                src={query.query}
                                name={false}
                                collapsed={6}
                                displayDataTypes={false}
                                displayObjectSize={false}
                                enableClipboard={false}
                                theme={{
                                    base00: "#0f0f0f", // Background
                                    base01: "#1a1a1a", // Lighter background
                                    base02: "#3c3c3c", // Selection background
                                    base03: "#787878", // Comments, invisibles
                                    base04: "#969696", // Dark foreground
                                    base05: "#e5e5e5", // Default foreground
                                    base06: "#f0f0f0", // Light foreground
                                    base07: "#ffffff", // Light background
                                    base08: "#ff3232", // Variables, XML tags, markup link text
                                    base09: "#ffc800", // Integers, boolean, constants
                                    base0A: "#d4ff00", // Classes, markup bold, search text background
                                    base0B: "#c0ff00", // Strings, inherited class, markup code
                                    base0C: "#d4ff00", // Support, regular expressions, escape characters
                                    base0D: "#c0ff00", // Functions, methods, attribute IDs, headings
                                    base0E: "#ff3232", // Keywords, storage, selector, markup italic
                                    base0F: "#ffc800", // Deprecated, opening/closing embedded language tags
                                }}
                                style={{
                                    fontSize: "12px",
                                    fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
                                    backgroundColor: "transparent",
                                    lineHeight: "1.6",
                                }}
                            />
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};
