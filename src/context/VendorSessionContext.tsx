import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { setVendorAuthToken } from "@/lib/api/client";
import {
  extractVendorApiError,
  fetchVendorWorkspace,
  loginVendor,
  type VendorStore,
  type VendorUser,
  type VendorWorkspace,
} from "@/lib/api/vendor-portal";

const VENDOR_TOKEN_KEY = "vendorAuthToken";

type SessionStatus = "restoring" | "ready";

interface VendorSessionContextValue {
  status: SessionStatus;
  token: string | null;
  vendorUser: VendorUser | null;
  vendor: VendorStore | null;
  workspace: VendorWorkspace | null;
  isVendorAuthenticated: boolean;
  mustChangePassword: boolean;
  login: (identifier: string, password: string) => Promise<VendorWorkspace>;
  logout: () => void;
  refreshWorkspace: () => Promise<void>;
  applyWorkspace: (workspace: VendorWorkspace) => void;
  getErrorMessage: (error: unknown, fallback: string) => string;
}

const VendorSessionContext = createContext<VendorSessionContextValue | undefined>(undefined);

function readStoredToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(VENDOR_TOKEN_KEY);
}

function persistToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(VENDOR_TOKEN_KEY, token);
  else window.localStorage.removeItem(VENDOR_TOKEN_KEY);
}

export function VendorSessionProvider({ children }: { children: ReactNode }) {
  const restoredOnceRef = useRef(false);
  const [status, setStatus] = useState<SessionStatus>("restoring");
  const [token, setToken] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<VendorWorkspace | null>(null);

  const applyToken = useCallback((nextToken: string | null) => {
    setToken(nextToken);
    persistToken(nextToken);
    setVendorAuthToken(nextToken);
  }, []);

  const logout = useCallback(() => {
    applyToken(null);
    setWorkspace(null);
  }, [applyToken]);

  const applyWorkspace = useCallback((nextWorkspace: VendorWorkspace) => {
    setWorkspace(nextWorkspace);
  }, []);

  const refreshWorkspace = useCallback(async () => {
    const currentToken = readStoredToken();
    if (!currentToken) {
      logout();
      setStatus("ready");
      return;
    }

    try {
      applyToken(currentToken);
      const nextWorkspace = await fetchVendorWorkspace();
      setWorkspace(nextWorkspace);
    } catch {
      logout();
    } finally {
      setStatus("ready");
    }
  }, [applyToken, logout]);

  useEffect(() => {
    if (restoredOnceRef.current) return;
    restoredOnceRef.current = true;
    refreshWorkspace();
  }, [refreshWorkspace]);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const response = await loginVendor(identifier, password);
      applyToken(response.token);
      const nextWorkspace = await fetchVendorWorkspace();
      setWorkspace(nextWorkspace);
      setStatus("ready");
      return nextWorkspace;
    },
    [applyToken]
  );

  const value = useMemo<VendorSessionContextValue>(() => {
    const vendorUser = workspace?.vendor_user || null;
    const vendor = workspace?.vendor || null;

    return {
      status,
      token,
      vendorUser,
      vendor,
      workspace,
      isVendorAuthenticated: Boolean(vendorUser && vendor),
      mustChangePassword: Boolean(vendorUser?.must_change_password),
      login,
      logout,
      refreshWorkspace,
      applyWorkspace,
      getErrorMessage: extractVendorApiError,
    };
  }, [applyWorkspace, login, logout, refreshWorkspace, status, token, workspace]);

  return <VendorSessionContext.Provider value={value}>{children}</VendorSessionContext.Provider>;
}

export function useVendorSession() {
  const ctx = useContext(VendorSessionContext);
  if (!ctx) {
    throw new Error("useVendorSession must be used within VendorSessionProvider");
  }
  return ctx;
}
