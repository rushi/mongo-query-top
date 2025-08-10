import { CurrentOpResponse, ServerInfo } from "./types";

const API_BASE_URL = process.env.NODE_ENV === "production" ? "http://localhost:3000" : "/api/mongo";

export class MongoApiService {
    private static instance: MongoApiService;

    public static getInstance(): MongoApiService {
        if (!MongoApiService.instance) {
            MongoApiService.instance = new MongoApiService();
        }
        return MongoApiService.instance;
    }

    private async fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                "Content-Type": "application/json",
                ...options?.headers,
            },
            ...options,
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    public async getCurrentOperations(minTime?: number): Promise<CurrentOpResponse> {
        const queryParams = minTime ? `?minTime=${minTime}` : "";
        return this.fetchApi<CurrentOpResponse>(`/currentop${queryParams}`);
    }

    public async getServerInfo(): Promise<ServerInfo> {
        return this.fetchApi<ServerInfo>("/info");
    }

    public async updatePreferences(
        preferences: Partial<{
            refreshInterval: number;
            minTime: number;
            all: boolean;
            log: number;
            paused: boolean;
            reversed: boolean;
        }>,
    ): Promise<{ success: boolean; message: string; updated: any; current: any }> {
        return this.fetchApi("/preferences", {
            method: "POST",
            body: JSON.stringify(preferences),
        });
    }

    public async saveSnapshot(): Promise<{ success: boolean; message: string; queryCount: number }> {
        return this.fetchApi("/snapshot", {
            method: "POST",
        });
    }

    public async killQuery(opid: string): Promise<{ success: boolean; message: string }> {
        return this.fetchApi(`/killOp/${opid}`, {
            method: "DELETE",
        });
    }
}
