const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:9001";
const API_KEY = import.meta.env.VITE_API_KEY || "dev-key-change-in-production";

export const apiClient = {
    async get(endpoint: string) {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            headers: { "X-API-Key": API_KEY },
        });
        if (!res.ok) throw new Error(`API error: ${res.statusText}`);
        return res.json();
    },

    async post(endpoint: string, body?: any) {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": API_KEY,
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) throw new Error(`API error: ${res.statusText}`);
        return res.json();
    },
};
