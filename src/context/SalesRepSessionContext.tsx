import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  changeSalesRepPassword,
  fetchSalesRepSession,
  loginSalesRep,
  updateOwnSalesRepLocation,
  type SalesRepProfile,
} from "@/lib/api/sales-rep-auth";

import { setSalesRepAuthToken } from "@/lib/api/client";

import {
  resolveSessionActor,
  type SessionActor,
} from "@/lib/salesRepSession";

const SALES_REP_TOKEN_KEY = "salesRepAuthToken";

const GEOLOCATION_PERMISSION_DENIED = 1;

const MINIMUM_GPS_ACCURACY_METERS = 50;

const LOCATION_UPLOAD_INTERVAL_MS = 15000;

const MINIMUM_MOVEMENT_DISTANCE_METERS = 10;

type SessionStatus = "restoring" | "ready";

type LocationPermissionState =
  | "unknown"
  | "prompt"
  | "granted"
  | "denied";

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

  changePassword: (payload: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }) => Promise<SalesRepProfile>;

  requestLocationPermission: () => Promise<boolean>;

  sendLocationUpdate: (position: GeolocationPosition) => Promise<void>;

  getErrorMessage: (error: unknown, fallback: string) => string;
}

const SalesRepSessionContext =
  createContext<SalesRepSessionContextValue | undefined>(undefined);

// -----------------------------
// STORAGE HELPERS
// -----------------------------
function readStoredToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SALES_REP_TOKEN_KEY);
}

function persistToken(token: string | null) {
  if (typeof window === "undefined") return;

  if (token) {
    window.localStorage.setItem(SALES_REP_TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(SALES_REP_TOKEN_KEY);
  }
}

// -----------------------------
// GEO HELPERS
// -----------------------------
function watchSalesRepPosition(
  onUpdate: (position: GeolocationPosition) => void,
  onError?: (error: GeolocationPositionError) => void
) {
  if (!navigator.geolocation) {
    throw new Error("Geolocation is not supported.");
  }

  return navigator.geolocation.watchPosition(
    onUpdate,
    onError || (() => undefined),
    {
      enableHighAccuracy: true,
      timeout: 60000,
      maximumAge: 0,
    }
  );
}

function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371e3;

  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;

  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) *
      Math.cos(φ2) *
      Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// =====================================================
// PROVIDER
// =====================================================
export function SalesRepSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const restoredOnceRef = useRef(false);
  const lastUploadTimeRef = useRef(0);
  const lastPositionRef = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [status, setStatus] =
    useState<SessionStatus>("restoring");

  const [token, setToken] = useState<string | null>(null);
  const [salesRep, setSalesRep] =
    useState<SalesRepProfile | null>(null);

  const [locationPermission, setLocationPermission] =
    useState<LocationPermissionState>("unknown");

  const applyToken = (nextToken: string | null) => {
    setToken(nextToken);
    persistToken(nextToken);
    setSalesRepAuthToken(nextToken);
  };

  // -----------------------------
  // LOGOUT
  // -----------------------------
  const logout = useCallback(() => {
    applyToken(null);
    setSalesRep(null);
    setLocationPermission("unknown");
  }, []);

  // -----------------------------
  // SESSION RESTORE
  // -----------------------------
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
    } catch {
      logout();
    } finally {
      setStatus("ready");
    }
  }, [logout]);

  useEffect(() => {
    if (restoredOnceRef.current) return;
    restoredOnceRef.current = true;
    refreshSession();
  }, [refreshSession]);

  // -----------------------------
  // LOGIN
  // -----------------------------
  const login = useCallback(
    async (identifier: string, password: string) => {
      const res = await loginSalesRep(identifier, password);

      applyToken(res.token);
      setSalesRep(res.sales_rep);
      setStatus("ready");

      return res.sales_rep;
    },
    []
  );

  // -----------------------------
  // PASSWORD
  // -----------------------------
  const changePassword = useCallback(async (payload: any) => {
    const res = await changeSalesRepPassword(payload);
    setSalesRep(res.sales_rep);
    return res.sales_rep;
  }, []);

  // -----------------------------
  // LOCATION UPLOAD
  // -----------------------------
  const sendLocationUpdate = useCallback(
    async (position: GeolocationPosition) => {
      if (!salesRep || salesRep.must_change_password) return;

      const accuracy = position.coords.accuracy;

      if (accuracy > MINIMUM_GPS_ACCURACY_METERS) return;

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const now = Date.now();

      const last = lastPositionRef.current;

      if (last) {
        const dist = calculateDistanceMeters(
          last.latitude,
          last.longitude,
          lat,
          lng
        );

        if (dist < MINIMUM_MOVEMENT_DISTANCE_METERS) return;
      }

      if (now - lastUploadTimeRef.current < LOCATION_UPLOAD_INTERVAL_MS)
        return;

      try {
        await updateOwnSalesRepLocation({
          latitude: lat,
          longitude: lng,
          accuracy_meters: accuracy,
          source: "gps-live",
          recorded_at: new Date(position.timestamp).toISOString(),
        });

        lastUploadTimeRef.current = now;
        lastPositionRef.current = { latitude: lat, longitude: lng };
      } catch (e) {
        console.error("Location upload failed", e);
      }
    },
    [salesRep]
  );

  // -----------------------------
  // LOCATION PERMISSION
  // -----------------------------
  const requestLocationPermission = useCallback(async () => {
    return new Promise<boolean>((resolve) => {
      const watchId = watchSalesRepPosition(
        async (pos) => {
          await sendLocationUpdate(pos);
          setLocationPermission("granted");
          navigator.geolocation.clearWatch(watchId);
          resolve(true);
        },
        (err) => {
          if (err.code === GEOLOCATION_PERMISSION_DENIED) {
            setLocationPermission("denied");
          }
          navigator.geolocation.clearWatch(watchId);
          resolve(false);
        }
      );
    });
  }, [sendLocationUpdate]);

  // -----------------------------
  // GPS WATCH
  // -----------------------------
  useEffect(() => {
    if (
      !salesRep ||
      salesRep.must_change_password ||
      locationPermission !== "granted"
    ) {
      return;
    }

    const watchId = watchSalesRepPosition(
      (pos) => sendLocationUpdate(pos),
      (err) => {
        if (err.code === GEOLOCATION_PERMISSION_DENIED) {
          setLocationPermission("denied");
        }
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [salesRep, locationPermission, sendLocationUpdate]);

  // -----------------------------
  // CONTEXT VALUE
  // -----------------------------
  const value = useMemo<SalesRepSessionContextValue>(
    () => ({
      status,
      salesRep,
      token,

      actor: resolveSessionActor(
        salesRep,
        typeof window !== "undefined"
          ? window.location.pathname
          : ""
      ),

      checkoutActor: salesRep ? "sales_rep" : "normal_customer",
      isSalesRepAuthenticated: !!salesRep,
      mustChangePassword: !!salesRep?.must_change_password,

      locationPermission,
      repOperationalReady:
        !!salesRep &&
        !salesRep.must_change_password &&
        locationPermission === "granted",

      login,
      logout,
      refreshSession,
      changePassword,
      requestLocationPermission,
      sendLocationUpdate,

      // ✅ FIXED HERE (NO IMPORT ANYMORE)
      getErrorMessage: (error: unknown, fallback: string) =>
        (error as any)?.response?.data?.error ||
        (error as any)?.response?.data?.message ||
        (error as any)?.message ||
        fallback,
    }),
    [
      status,
      salesRep,
      token,
      login,
      logout,
      refreshSession,
      changePassword,
      requestLocationPermission,
      sendLocationUpdate,
      locationPermission,
    ]
  );

  return (
    <SalesRepSessionContext.Provider value={value}>
      {children}
    </SalesRepSessionContext.Provider>
  );
}

// -----------------------------
// HOOK
// -----------------------------
export function useSalesRepSession() {
  const ctx = useContext(SalesRepSessionContext);

  if (!ctx) {
    throw new Error(
      "useSalesRepSession must be used within provider"
    );
  }

  return ctx;
}