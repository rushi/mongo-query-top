import { useEffect, useState } from "react";
import type { QueryData } from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:9001";
const API_KEY = import.meta.env.VITE_API_KEY || "dev-key-change-in-production";

export const useServerSentEvents = (
    serverId: string,
    minTime: number,
    refreshInterval: number,
    enabled: boolean = true
) => {
    const [data, setData] = useState<QueryData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        // EventSource doesn't support custom headers, so pass API key as query parameter
        const url = `${API_BASE}/api/queries/${serverId}/stream?minTime=${minTime}&refreshInterval=${refreshInterval}&apiKey=${API_KEY}`;
        const eventSource = new EventSource(url);

        eventSource.addEventListener("queries", (e) => {
            try {
                setData(JSON.parse(e.data));
                setIsConnected(true);
                setError(null);
            } catch (err) {
                setError("Failed to parse query data");
            }
        });

        eventSource.addEventListener("error", () => {
            setError("SSE connection error");
            setIsConnected(false);
        });

        eventSource.onerror = () => {
            setError("Connection lost");
            setIsConnected(false);
        };

        return () => {
            eventSource.close();
            setIsConnected(false);
        };
    }, [serverId, minTime, refreshInterval, enabled]);

    return { data, error, isConnected };
};
