import { fetchEventSource } from "@microsoft/fetch-event-source";
import type { QueryData } from "@mongo-query-top/types";
import { useEffect, useRef, useState } from "react";
import { API_BASE, API_KEY } from "../utils/api";

const MAX_RETRY_DELAY = 30000; // 30 seconds max
const INITIAL_RETRY_DELAY = 500; // Start with 0.5 second

export const useServerSentEvents = (
    serverId: string,
    minTime: number,
    refreshInterval: number,
    showAll: boolean,
    enabled: boolean = true,
    isPaused: boolean = false,
) => {
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<QueryData | null>(null);

    const [isConnected, setIsConnected] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);

    const reconnectAttemptsRef = useRef(0);
    const retryDelayRef = useRef(INITIAL_RETRY_DELAY);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (isPaused || !enabled) {
            if (abortControllerRef.current) {
                // Cleanup connection if paused
                console.log("[Connection] Pausing SSE connection");
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }

            setIsConnected(false);
            setIsReconnecting(false);
            if (isPaused) {
                setError(null); // Clear error when paused
            }
            return;
        }

        let isActive = true;

        const connect = async () => {
            if (!isActive) {
                return;
            }

            const abortController = new AbortController();
            abortControllerRef.current = abortController;
            const url = `${API_BASE}/queries/${serverId}/stream?minTime=${minTime}&refreshInterval=${refreshInterval}&showAll=${showAll}`;

            try {
                console.log("[Connection] Establishing SSE connection to", { url });
                await fetchEventSource(url, {
                    signal: abortController.signal,
                    headers: { "X-API-Key": API_KEY },
                    async onopen(response) {
                        if (response.ok) {
                            console.log("[Connection] SSE connection established");
                            setIsConnected(true);
                            setIsReconnecting(false);
                            setError(null);
                            retryDelayRef.current = INITIAL_RETRY_DELAY;
                            reconnectAttemptsRef.current = 0;
                        } else {
                            console.log("[Connection] SSE connection failed to open", { response });
                            throw new Error(`Failed to connect: ${response.statusText}`);
                        }
                    },
                    onmessage(event) {
                        if (event.event === "queries") {
                            try {
                                const parsedData = JSON.parse(event.data);
                                setData(parsedData);
                                setError(null);
                            } catch (err) {
                                console.log("[Connection] Failed to parse query data:", { err });
                                setError("Failed to parse query data");
                            }
                        }
                    },
                    onerror(err) {
                        setError("Connection lost");
                        console.log("[Connection] SSE connection lost", { err });
                        setIsConnected(false);

                        if (!isActive) {
                            console.log("[Connection] SSE connection aborted");
                            throw err; // Stops reconnection
                        }

                        // Attempt to reconnect with exponential backoff
                        setIsReconnecting(true);
                        reconnectAttemptsRef.current++;

                        // Exponential backoff: double the delay, up to MAX_RETRY_DELAY
                        retryDelayRef.current = Math.min(retryDelayRef.current * 2, MAX_RETRY_DELAY);
                        console.log(`[Connection] Reconnecting in ${retryDelayRef.current} ms`);

                        // Return the retry delay to trigger reconnection
                        return retryDelayRef.current;
                    },
                    onclose() {
                        // Connection closed by server, will attempt to reconnect
                        console.log("[Connection] SSE connection closed by server");
                        setIsConnected(false);
                    },
                });
            } catch (err: any) {
                console.log("[Connection] SSE connection error:", err.message);
                if (err.name !== "AbortError" && isActive) {
                    setError(err.message || "Connection failed");
                    setIsConnected(false);
                }
            }
        };

        connect();

        return () => {
            isActive = false;

            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }

            setIsConnected(false);
            setIsReconnecting(false);
        };
    }, [serverId, minTime, refreshInterval, showAll, enabled, isPaused]);

    return { data, error, isConnected, isReconnecting };
};
