import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
let salesRepAuthToken: string | null = null;

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  if (salesRepAuthToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${salesRepAuthToken}`;
  } else if (config.headers?.Authorization) {
    delete config.headers.Authorization;
  }
  return config;
});

export function setSalesRepAuthToken(token: string | null) {
  salesRepAuthToken = token;
}
