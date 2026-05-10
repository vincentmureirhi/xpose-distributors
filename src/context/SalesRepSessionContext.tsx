import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  changeSalesRepPassword,
  extractApiErrorMessage,
  fetchSalesRepSession,
  loginSalesRep,
  updateOwnSalesRepLocation,
  type SalesRepProfile,
} from "@/lib/api/sales-rep-auth";
import { setSalesRepAuthToken } from "@/lib/api/client";
import { resolveSessionActor, type SessionActor } from "@/lib/salesRepSession";

const SALES_REP_TOKEN_KEY = "salesRepAuthToken";
const LOCATION_UPDATE_INTERVAL_MS = 5 * 60 * 1000;
const GEOLOCATION_PERMISSION_DENIED = 1;

type SessionStatus = "restoring" | "ready";
type LocationPermissionState = "unknown" | "prompt" | "granted" | "denied";
interface SalesRepSessionContextValue {
  status: SessionStatus;
  salesRep: SalesRepProfile | null;
  token: string | null;
  actor: SessionActor;
  checkoutActor: "sales_rep" | "normal_customer";
  isSalesRepAuthenticated: boolean;
  mustChangePassword: boolean;
  locationPermission: LocationPermissionState;
  repOperationalReady: boolean;
  login: (identifier: string, password: string) => Promise<SalesRepProfile>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  changePassword: (payload: { current_password: string; new_password: string; confirm_password: string }) => Promise<SalesRepProfile>;
  requestLocationPermission: () => Promise<boolean>;
  sendLocationUpdate: () => Promise<void>;
  getErrorMessage: (error: unknown, fallback: string) => string;
}

const SalesRepSessionContext = createContext<SalesRepSessionContextValue | undefined>(undefined);

function readStoredToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SALES_REP_TOKEN_KEY);
}

function persistToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(SALES_REP_TOKEN_KEY, token);
  else window.localStorage.removeItem(SALES_REP_TOKEN_KEY);
}

async function readLocationPermissionState(): Promise<LocationPermissionState> {
  if (typeof navigator === "undefined") return "unknown";
  if (!navigator.permissions?.query) return "unknown";
  try {
    const result = await navigator.permissions.query({ name: "geolocation" });
    if (result.state === "granted") return "granted";
    if (result.state === "denied") return "denied";
    return "prompt";
  } catch {
    return "unknown";
  }
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000,
    });
  });
}

export function SalesRepSessionProvider({ children }: { children: ReactNode }) {
  const restoredOnceRef = useRef(false);
  const [status, setStatus] = useState<SessionStatus>("restoring");
  const [token, setToken] = useState<string | null>(null);
  const [salesRep, setSalesRep] = useState<SalesRepProfile | null>(null);
  const [locationPermission, setLocationPermission] = useState<LocationPermissionState>("unknown");

  const applyToken = (nextToken: string | null) => {
    setToken(nextToken);
    persistToken(nextToken);
    setSalesRepAuthToken(nextToken);
  };

  const logout = useCallback(() => {
    applyToken(null);
    setSalesRep(null);
    setLocationPermission("unknown");
  }, []);

  const refreshSession = useCallback(async () => {
    const currentToken = readStoredToken();
    if (!currentToken) {
      logout();
      setStatus("ready");
      return;
    }

    try {
      applyToken(currentToken);
      const session = await fetchSalesRepSession();
      setSalesRep(session.sales_rep);
      setStatus("ready");
    } catch {
      logout();
      setStatus("ready");
    }
  }, [logout]);

  useEffect(() => {
    if (restoredOnceRef.current) return;
    restoredOnceRef.current = true;
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    let active = true;
    if (!salesRep) {
      setLocationPermission("unknown");
      return;
    }

    readLocationPermissionState().then((state) => {
      if (!active) return;
      setLocationPermission(state);
    });

    return () => {
      active = false;
    };
  }, [salesRep]);

  const sendLocationUpdate = useCallback(async () => {
    if (!salesRep || salesRep.must_change_password) return;
    const position = await getCurrentPosition();
    await updateOwnSalesRepLocation({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy_meters: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : undefined,
      source: "storefront",
      recorded_at: new Date(position.timestamp).toISOString(),
    });
  }, [salesRep]);

  const requestLocationPermission = useCallback(async () => {
    try {
      await sendLocationUpdate();
      setLocationPermission("granted");
      return true;
    } catch (error) {
      const geolocationError = error as GeolocationPositionError;
      if (geolocationError?.code === GEOLOCATION_PERMISSION_DENIED) {
        setLocationPermission("denied");
      } else {
        setLocationPermission(await readLocationPermissionState());
      }
      return false;
    }
  }, [sendLocationUpdate]);

  useEffect(() => {
    if (!salesRep || salesRep.must_change_password || locationPermission !== "granted") return;

    const run = () => {
      sendLocationUpdate().catch(() => undefined);
    };

    run();
    const timer = window.setInterval(run, LOCATION_UPDATE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [locationPermission, salesRep, sendLocationUpdate]);

  const login = useCallback(async (identifier: string, password: string) => {
    const response = await loginSalesRep(identifier, password);
    applyToken(response.token);
    setSalesRep(response.sales_rep);
    setStatus("ready");
    return response.sales_rep;
  }, []);

  const changePassword = useCallback(async (payload: { current_password: string; new_password: string; confirm_password: string }) => {
    const response = await changeSalesRepPassword(payload);
    setSalesRep(response.sales_rep);
    return response.sales_rep;
  }, []);

  const actor = resolveSessionActor(salesRep, typeof window !== "undefined" ? window.location.pathname : "");
  const value = useMemo<SalesRepSessionContextValue>(
    () => ({
      status,
      salesRep,
      token,
      actor,
      checkoutActor: salesRep ? "sales_rep" : "normal_customer",
      isSalesRepAuthenticated: !!salesRep,
      mustChangePassword: !!salesRep?.must_change_password,
      locationPermission,
      repOperationalReady: !!salesRep && !salesRep.must_change_password && locationPermission === "granted",
      login,
      logout,
      refreshSession,
      changePassword,
      requestLocationPermission,
      sendLocationUpdate,
      getErrorMessage: extractApiErrorMessage,
    }),
    [actor, changePassword, locationPermission, login, logout, refreshSession, requestLocationPermission, salesRep, sendLocationUpdate, status, token]
  );

  return <SalesRepSessionContext.Provider value={value}>{children}</SalesRepSessionContext.Provider>;
}

export function useSalesRepSession() {
  const context = useContext(SalesRepSessionContext);
  if (!context) {
    throw new Error("useSalesRepSession must be used within SalesRepSessionProvider");
  }
  return context;
}
