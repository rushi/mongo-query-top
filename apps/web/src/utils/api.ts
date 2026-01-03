import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:9001";
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
