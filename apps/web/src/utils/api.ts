import axios from "axios";

// Dynamically determine API URL based on current host
// If VITE_API_URL is set, use it. Otherwise, use same hostname as web app with port 9001
const getApiBaseUrl = (): string => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // Use current hostname but with API port 9001
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:9001`;
};

const API_BASE = getApiBaseUrl();
const API_KEY = import.meta.env.VITE_API_KEY || "dev-key-change-in-production";

const axiosInstance = axios.create({
    baseURL: API_BASE,
    headers: {
        "X-API-Key": API_KEY,
    },
});

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        const errorMessage = error.response?.data?.message || error.message || "API request failed";
        throw new Error(errorMessage);
    },
);

export const apiClient = {
    async get<T = any>(endpoint: string, params?: any): Promise<T> {
        const response = await axiosInstance.get(endpoint, { params });
        return response.data;
    },

    async post<T = any>(endpoint: string, body?: any): Promise<T> {
        const response = await axiosInstance.post(endpoint, body);
        return response.data;
    },
};
