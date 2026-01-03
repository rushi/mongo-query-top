import { useEffect, useState } from "react";
import { apiClient } from "../utils/api";

export interface ServerInfo {
    id: string;
    name: string;
    connected: boolean;
}

export const useFetchServers = () => {
    const [servers, setServers] = useState<ServerInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchServers = async () => {
            try {
                const data = await apiClient.get("/servers");
                setServers(data.servers);
                setError(null);
            } catch (err: any) {
                setError(err.message || "Failed to fetch servers");
            } finally {
                setLoading(false);
            }
        };

        fetchServers();
    }, []);

    return { servers, loading, error };
};
