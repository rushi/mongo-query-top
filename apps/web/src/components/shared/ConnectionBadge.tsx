import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";

interface ConnectionBadgeProps {
    isConnecting: boolean;
    isStale?: boolean;
    isConnected: boolean;
    isReconnecting: boolean;
    isSecondary: boolean;
}

export const ConnectionBadge = ({
    isConnecting,
    isStale,
    isConnected,
    isReconnecting,
    isSecondary,
}: ConnectionBadgeProps) => {
    if (isConnecting) {
        return (
            <Badge variant="secondary" className="gap-1.5 border-2 font-mono text-[10px] uppercase">
                <div className="h-2 w-2 animate-spin border border-muted-foreground/20 border-t-muted-foreground" />
                CONNECTING
            </Badge>
        );
    }

    if (isConnected && isStale) {
        return (
            <Badge variant="secondary" className="border-2 border-warning font-mono text-[10px] uppercase">
                ⏱ STALE
            </Badge>
        );
    }

    if (isConnected) {
        return (
            <Badge
                variant="success"
                className={cn(
                    "border-2 font-mono text-[10px] uppercase",
                    isSecondary
                        ? "border-secondary-read bg-secondary-read/20 text-secondary-read"
                        : "border-primary bg-primary/20 text-primary",
                )}
            >
                ● CONNECTED
            </Badge>
        );
    }

    if (isReconnecting) {
        return (
            <Badge variant="secondary" className="border-2 font-mono text-[10px] uppercase">
                ⟳ RECONNECTING
            </Badge>
        );
    }

    return (
        <Badge variant="destructive" className="border-2 font-mono text-[10px] uppercase">
            ○ DISCONNECTED
        </Badge>
    );
};
