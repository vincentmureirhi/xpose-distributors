import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

if (!baseURL) {
  throw new Error("VITE_API_URL is not set");
}

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

let salesRepAuthToken: string | null = null;
let vendorAuthToken: string | null = null;

export function setSalesRepAuthToken(token: string | null) {
  salesRepAuthToken = token;
}

export function setVendorAuthToken(token: string | null) {
  vendorAuthToken = token;
}

apiClient.interceptors.request.use((config) => {
  const customerToken = localStorage.getItem("token");

  if (salesRepAuthToken) {
    config.headers.Authorization = `Bearer ${salesRepAuthToken}`;
  } else if (vendorAuthToken) {
    config.headers.Authorization = `Bearer ${vendorAuthToken}`;
  } else if (customerToken) {
    config.headers.Authorization = `Bearer ${customerToken}`;
  }

  return config;
});
