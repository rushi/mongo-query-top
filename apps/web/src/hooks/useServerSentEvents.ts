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
) => {
    const [data, setData] = useState<QueryData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);

    const abortControllerRef = useRef<AbortController | null>(null);
    const retryDelayRef = useRef(INITIAL_RETRY_DELAY);
    const reconnectAttemptsRef = useRef(0);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        let isActive = true;

        const connect = async () => {
            if (!isActive) return;

            const abortController = new AbortController();
            abortControllerRef.current = abortController;

            const url = `${API_BASE}/queries/${serverId}/stream?minTime=${minTime}&refreshInterval=${refreshInterval}&showAll=${showAll}`;

            try {
                await fetchEventSource(url, {
                    signal: abortController.signal,
                    headers: { "X-API-Key": API_KEY },
                    async onopen(response) {
                        if (response.ok) {
                            setIsConnected(true);
                            setIsReconnecting(false);
                            setError(null);
                            retryDelayRef.current = INITIAL_RETRY_DELAY;
                            reconnectAttemptsRef.current = 0;
                        } else {
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
                                setError("Failed to parse query data");
                            }
                        }
                    },
                    onerror(err) {
                        setError("Connection lost");
                        setIsConnected(false);

                        if (!isActive) {
                            throw err; // Stops reconnection
                        }

                        // Attempt to reconnect with exponential backoff
                        setIsReconnecting(true);
                        reconnectAttemptsRef.current++;

                        // Exponential backoff: double the delay, up to MAX_RETRY_DELAY
                        retryDelayRef.current = Math.min(retryDelayRef.current * 2, MAX_RETRY_DELAY);

                        // Return the retry delay to trigger reconnection
                        return retryDelayRef.current;
                    },
                    onclose() {
                        setIsConnected(false);
                        // Connection closed by server, will attempt to reconnect
                    },
                });
            } catch (err: any) {
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
    }, [serverId, minTime, refreshInterval, showAll, enabled]);

    return { data, error, isConnected, isReconnecting };
};
