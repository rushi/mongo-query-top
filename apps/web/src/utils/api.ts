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
        const headers: Record<string, string> = {
            "X-API-Key": API_KEY,
        };

        // Only set Content-Type if we have a body
        if (body) {
            headers["Content-Type"] = "application/json";
        }

        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: "POST",
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) {
            const errorText = await res.text();
            let errorMessage = `API error: ${res.statusText}`;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorMessage;
            } catch {
                // Not JSON, use status text
            }
            throw new Error(errorMessage);
        }
        return res.json();
    },
};
