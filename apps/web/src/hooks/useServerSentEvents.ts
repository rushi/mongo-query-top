import type { QueryData } from "@mongo-query-top/types";
import { useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:9001";
const API_KEY = import.meta.env.VITE_API_KEY || "dev-key-change-in-production";

const MAX_RETRY_DELAY = 30000; // 30 seconds max
const INITIAL_RETRY_DELAY = 1000; // Start with 1 second

export const useServerSentEvents = (
    serverId: string,
    minTime: number,
    refreshInterval: number,
    showAll: boolean,
    enabled: boolean = true,
) => {
    const [data, setData] = useState<QueryData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);

    const eventSourceRef = useRef<EventSource | null>(null);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const retryDelayRef = useRef(INITIAL_RETRY_DELAY);
    const reconnectAttemptsRef = useRef(0);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        let isActive = true;

        const connect = () => {
            if (!isActive) return;

            // EventSource doesn't support custom headers, so pass API key as query parameter
            const url = `${API_BASE}/api/queries/${serverId}/stream?minTime=${minTime}&refreshInterval=${refreshInterval}&showAll=${showAll}&apiKey=${API_KEY}`;
            const eventSource = new EventSource(url);
            eventSourceRef.current = eventSource;

            eventSource.addEventListener("queries", (e) => {
                try {
                    setData(JSON.parse(e.data));
                    setIsConnected(true);
                    setIsReconnecting(false);
                    setError(null);

                    // Reset retry delay on successful connection
                    retryDelayRef.current = INITIAL_RETRY_DELAY;
                    reconnectAttemptsRef.current = 0;
                } catch (err) {
                    setError("Failed to parse query data");
                }
            });

            eventSource.addEventListener("error", () => {
                setError("Connection lost");
                setIsConnected(false);

                // Close the current connection
                eventSource.close();

                if (!isActive) return;

                // Attempt to reconnect with exponential backoff
                setIsReconnecting(true);
                reconnectAttemptsRef.current++;

                retryTimeoutRef.current = setTimeout(() => {
                    if (isActive) {
                        connect();
                    }
                }, retryDelayRef.current);

                // Exponential backoff: double the delay, up to MAX_RETRY_DELAY
                retryDelayRef.current = Math.min(retryDelayRef.current * 2, MAX_RETRY_DELAY);
            });

            eventSource.onerror = () => {
                setError("Connection lost");
                setIsConnected(false);
            };
        };

        connect();

        return () => {
            isActive = false;

            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }

            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = null;
            }

            setIsConnected(false);
            setIsReconnecting(false);
        };
    }, [serverId, minTime, refreshInterval, showAll, enabled]);

    return { data, error, isConnected, isReconnecting };
};
