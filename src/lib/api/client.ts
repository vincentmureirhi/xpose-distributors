import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "";

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("customerToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const USE_MOCK = !baseURL;
