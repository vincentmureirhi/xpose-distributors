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
  extractApiErrorMessage,
  fetchSalesRepSession,
  loginSalesRep,
  updateOwnSalesRepLocation,
  type SalesRepProfile,
} from "@/lib/api/sales-rep-auth";
import { setSalesRepAuthToken } from "@/lib/api/client";
import { resolveSessionActor, type SessionActor } from "@/lib/salesRepSession";

const SALES_REP_TOKEN_KEY = "salesRepAuthToken";
const GEOLOCATION_PERMISSION_DENIED = 1;

const PREFERRED_GPS_ACCURACY_METERS = 100;
const MAX_UPLOAD_GPS_ACCURACY_METERS = 1000;
const LOCATION_UPLOAD_INTERVAL_MS = 10_000;
const LOCATION_STATIONARY_HEARTBEAT_MS = 60_000;
const MINIMUM_MOVEMENT_DISTANCE_METERS = 10;
const MAX_POSITION_AGE_MS = 10 * 60_000;
const MAX_FUTURE_POSITION_DRIFT_MS = 2 * 60_000;

type SessionStatus = "restoring" | "ready";
type LocationPermissionState = "unknown" | "prompt" | "granted" | "denied";
type LocationSyncState = {
  status: "idle" | "waiting" | "synced" | "failed";
  message: string;
  accuracyMeters?: number | null;
  lastAttemptAt?: string | null;
  lastUploadedAt?: string | null;
};

interface PasswordChangePayload {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface SalesRepSessionContextValue {
  status: SessionStatus;
  salesRep: SalesRepProfile | null;
  token: string | null;
  actor: SessionActor;
  checkoutActor: "sales_rep" | "normal_customer";
  isSalesRepAuthenticated: boolean;
  mustChangePassword: boolean;
  locationPermission: LocationPermissionState;
  lastLocationSync: LocationSyncState;
  repOperationalReady: boolean;
  login: (identifier: string, password: string) => Promise<SalesRepProfile>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  changePassword: (payload: PasswordChangePayload) => Promise<SalesRepProfile>;
  requestLocationPermission: () => Promise<boolean>;
  sendLocationUpdate: (position: GeolocationPosition) => Promise<boolean>;
  getErrorMessage: (error: unknown, fallback: string) => string;
}

const SalesRepSessionContext = createContext<SalesRepSessionContextValue | undefined>(
  undefined
);

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

function isGeolocationSupported() {
  return typeof navigator !== "undefined" && Boolean(navigator.geolocation);
}

function watchSalesRepPosition(
  onUpdate: (position: GeolocationPosition) => void,
  onError?: (error: GeolocationPositionError) => void
) {
  if (!isGeolocationSupported()) {
    throw new Error("Geolocation is not supported on this device or browser.");
  }

  return navigator.geolocation.watchPosition(
    onUpdate,
    onError || (() => undefined),
    {
      enableHighAccuracy: true,
      timeout: 60_000,
      maximumAge: 0,
    }
  );
}

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadiusMeters = 6_371_000;
  const lat1Radians = (lat1 * Math.PI) / 180;
  const lat2Radians = (lat2 * Math.PI) / 180;
  const deltaLatRadians = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLonRadians = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLatRadians / 2) ** 2 +
    Math.cos(lat1Radians) *
      Math.cos(lat2Radians) *
      Math.sin(deltaLonRadians / 2) ** 2;

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getGpsPositionProblem(position: GeolocationPosition) {
  const accuracy = Number(position.coords.accuracy);
  const ageMs = Date.now() - position.timestamp;

  if (!Number.isFinite(accuracy) || accuracy > MAX_UPLOAD_GPS_ACCURACY_METERS) {
    return `Waiting for a usable GPS signal. Current accuracy is ${Number.isFinite(accuracy) ? Math.round(accuracy) : "unknown"}m.`;
  }

  if (ageMs > MAX_POSITION_AGE_MS || ageMs < -MAX_FUTURE_POSITION_DRIFT_MS) {
    return "Waiting for a fresh GPS point from this device.";
  }

  const lat = Number(position.coords.latitude);
  const lng = Number(position.coords.longitude);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return "This device returned invalid GPS coordinates.";
  }

  return null;
}

function getLocationSyncSuccessMessage(accuracy: number) {
  if (Number.isFinite(accuracy) && accuracy > PREFERRED_GPS_ACCURACY_METERS) {
    return `Location synced to admin map. Accuracy is ${Math.round(accuracy)}m; ask the rep to step outside for a tighter pin.`;
  }

  return "Location synced to admin live map.";
}

function getOptionalSpeedKph(position: GeolocationPosition) {
  const speedMetersPerSecond = Number(position.coords.speed);
  if (!Number.isFinite(speedMetersPerSecond) || speedMetersPerSecond < 0) return undefined;
  return Number((speedMetersPerSecond * 3.6).toFixed(2));
}

function getOptionalHeading(position: GeolocationPosition) {
  const heading = Number(position.coords.heading);
  if (!Number.isFinite(heading) || heading < 0 || heading > 360) return undefined;
  return Number(heading.toFixed(2));
}

export function SalesRepSessionProvider({ children }: { children: ReactNode }) {
  const restoredOnceRef = useRef(false);
  const lastUploadTimeRef = useRef(0);
  const lastPositionRef = useRef<{ latitude: number; longitude: number } | null>(null);

  const [status, setStatus] = useState<SessionStatus>("restoring");
  const [token, setToken] = useState<string | null>(null);
  const [salesRep, setSalesRep] = useState<SalesRepProfile | null>(null);
  const [locationPermission, setLocationPermission] =
    useState<LocationPermissionState>("unknown");
  const [lastLocationSync, setLastLocationSync] = useState<LocationSyncState>({
    status: "idle",
    message: "Location has not synced yet.",
    accuracyMeters: null,
    lastAttemptAt: null,
    lastUploadedAt: null,
  });

  const applyToken = useCallback((nextToken: string | null) => {
    setToken(nextToken);
    persistToken(nextToken);
    setSalesRepAuthToken(nextToken);
  }, []);

  const logout = useCallback(() => {
    applyToken(null);
    setSalesRep(null);
    setLocationPermission("unknown");
    setLastLocationSync({
      status: "idle",
      message: "Location has not synced yet.",
      accuracyMeters: null,
      lastAttemptAt: null,
      lastUploadedAt: null,
    });
    lastUploadTimeRef.current = 0;
    lastPositionRef.current = null;
  }, [applyToken]);

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
  }, [applyToken, logout]);

  useEffect(() => {
    if (restoredOnceRef.current) return;
    restoredOnceRef.current = true;
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("permissions" in navigator)) return;

    let mounted = true;
    let permissionStatus: PermissionStatus | null = null;

    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((statusResult) => {
        if (!mounted) return;
        permissionStatus = statusResult;

        const syncPermission = () => {
          if (!mounted) return;
          if (statusResult.state === "granted") setLocationPermission("granted");
          else if (statusResult.state === "denied") setLocationPermission("denied");
          else setLocationPermission("prompt");
        };

        syncPermission();
        statusResult.onchange = syncPermission;
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const res = await loginSalesRep(identifier, password);
      applyToken(res.token);
      setSalesRep(res.sales_rep);
      setStatus("ready");
      return res.sales_rep;
    },
    [applyToken]
  );

  const changePassword = useCallback(async (payload: PasswordChangePayload) => {
    const res = await changeSalesRepPassword(payload);
    setSalesRep(res.sales_rep);
    return res.sales_rep;
  }, []);

  const sendLocationUpdate = useCallback(
    async (position: GeolocationPosition) => {
      const accuracy = Number(position.coords.accuracy);
      const attemptAt = new Date().toISOString();

      if (!salesRep || salesRep.must_change_password) return false;

      const gpsProblem = getGpsPositionProblem(position);
      if (gpsProblem) {
        setLastLocationSync((prev) => ({
          status: "waiting",
          message: gpsProblem,
          accuracyMeters: Number.isFinite(accuracy) ? Math.round(accuracy) : null,
          lastAttemptAt: attemptAt,
          lastUploadedAt: prev.lastUploadedAt || null,
        }));
        return false;
      }

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const now = Date.now();
      const last = lastPositionRef.current;
      const enoughTimeSinceLastUpload = now - lastUploadTimeRef.current >= LOCATION_UPLOAD_INTERVAL_MS;
      const heartbeatDue = now - lastUploadTimeRef.current >= LOCATION_STATIONARY_HEARTBEAT_MS;

      if (!enoughTimeSinceLastUpload) return false;

      if (last) {
        const distanceMeters = calculateDistanceMeters(
          last.latitude,
          last.longitude,
          lat,
          lng
        );

        if (distanceMeters < MINIMUM_MOVEMENT_DISTANCE_METERS && !heartbeatDue) return false;
      }

      try {
        await updateOwnSalesRepLocation({
          latitude: lat,
          longitude: lng,
          accuracy_meters: position.coords.accuracy,
          speed_kph: getOptionalSpeedKph(position),
          heading_degrees: getOptionalHeading(position),
          source: "gps-live",
          recorded_at: new Date(position.timestamp).toISOString(),
        });

        lastUploadTimeRef.current = now;
        lastPositionRef.current = { latitude: lat, longitude: lng };
        setLastLocationSync({
          status: "synced",
          message: getLocationSyncSuccessMessage(accuracy),
          accuracyMeters: Math.round(accuracy),
          lastAttemptAt: attemptAt,
          lastUploadedAt: new Date().toISOString(),
        });
        return true;
      } catch (error) {
        console.error("Location upload failed", error);
        setLastLocationSync((prev) => ({
          status: "failed",
          message: extractApiErrorMessage(error, "Location upload failed. Check internet and login session."),
          accuracyMeters: Number.isFinite(accuracy) ? Math.round(accuracy) : null,
          lastAttemptAt: attemptAt,
          lastUploadedAt: prev.lastUploadedAt || null,
        }));
        return false;
      }
    },
    [salesRep]
  );

  const requestLocationPermission = useCallback(async () => {
    if (!isGeolocationSupported()) {
      setLocationPermission("denied");
      return false;
    }

    setLocationPermission("prompt");

    return new Promise<boolean>((resolve) => {
      let settled = false;
      let watchId: number | null = null;

      const finish = (granted: boolean) => {
        if (settled) return;
        settled = true;
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        setLocationPermission(granted ? "granted" : "denied");
        resolve(granted);
      };

      try {
        watchId = watchSalesRepPosition(
          async (position) => {
            await sendLocationUpdate(position);
            finish(true);
          },
          (error) => {
            if (error.code === GEOLOCATION_PERMISSION_DENIED) {
              finish(false);
            } else {
              setLocationPermission("prompt");
              finish(false);
            }
          }
        );
      } catch {
        finish(false);
      }
    });
  }, [sendLocationUpdate]);

  useEffect(() => {
    if (!salesRep || salesRep.must_change_password || locationPermission !== "granted") {
      return undefined;
    }

    let watchId: number | null = null;

    try {
      watchId = watchSalesRepPosition(
        (position) => sendLocationUpdate(position),
        (error) => {
          if (error.code === GEOLOCATION_PERMISSION_DENIED) {
            setLocationPermission("denied");
          }
        }
      );
    } catch {
      setLocationPermission("denied");
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [salesRep, locationPermission, sendLocationUpdate]);

  const value = useMemo<SalesRepSessionContextValue>(() => {
    const pathname = typeof window !== "undefined" ? window.location.pathname : "";

    return {
      status,
      salesRep,
      token,
      actor: resolveSessionActor(salesRep, pathname),
      checkoutActor: salesRep ? "sales_rep" : "normal_customer",
      isSalesRepAuthenticated: Boolean(salesRep),
      mustChangePassword: Boolean(salesRep?.must_change_password),
      locationPermission,
      lastLocationSync,
      repOperationalReady:
        Boolean(salesRep) &&
        !salesRep?.must_change_password &&
        locationPermission === "granted" &&
        lastLocationSync.status === "synced",
      login,
      logout,
      refreshSession,
      changePassword,
      requestLocationPermission,
      sendLocationUpdate,
      getErrorMessage: extractApiErrorMessage,
    };
  }, [
    status,
    salesRep,
    token,
    locationPermission,
    lastLocationSync,
    login,
    logout,
    refreshSession,
    changePassword,
    requestLocationPermission,
    sendLocationUpdate,
  ]);

  return (
    <SalesRepSessionContext.Provider value={value}>
      {children}
    </SalesRepSessionContext.Provider>
  );
}

export function useSalesRepSession() {
  const ctx = useContext(SalesRepSessionContext);

  if (!ctx) {
    throw new Error("useSalesRepSession must be used within provider");
  }

  return ctx;
}
