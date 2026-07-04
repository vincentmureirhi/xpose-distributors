import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, MapPin, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSalesRepSession } from "@/context/SalesRepSessionContext";

export default function SalesRepLocationAccess() {
  const navigate = useNavigate();
  const {
    status,
    isSalesRepAuthenticated,
    locationPermission,
    lastLocationSync,
    repOperationalReady,
    requestLocationPermission,
    salesRep,
    logout,
  } = useSalesRepSession();
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (status === "restoring") return;
    if (!isSalesRepAuthenticated) {
      navigate("/sales-rep/login", { replace: true });
      return;
    }
  }, [isSalesRepAuthenticated, navigate, status]);

  const enableLocation = async () => {
    setRequesting(true);
    try {
      await requestLocationPermission();
    } finally {
      setRequesting(false);
    }
  };

  const denied = locationPermission === "denied";
  const synced = lastLocationSync.status === "synced";
  const syncTone =
    lastLocationSync.status === "synced"
      ? "border-success/30 bg-success/5"
      : lastLocationSync.status === "failed"
        ? "border-destructive/40 bg-destructive/10"
        : "border-border bg-secondary/40";

  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-2xl mx-auto rounded-2xl border border-border bg-card p-6 md:p-8 space-y-5">
        <h1 className="font-display font-bold text-3xl tracking-tight">Location access required</h1>
        <p className="text-muted-foreground">
          {salesRep?.full_name || "Sales reps"} need device location enabled for route customer operations and rep-linked order
          accountability.
        </p>

        <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm space-y-2">
          <p className="font-semibold flex items-center gap-2"><MapPin className="h-4 w-4" /> Why this is needed</p>
          <ul className="list-disc ml-5 text-muted-foreground space-y-1">
            <li>Attach order capture activity to active field location.</li>
            <li>Support route operations visibility and accountability.</li>
            <li>Enable authenticated rep operational workflows at checkout.</li>
          </ul>
        </div>

        {denied && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
            <p className="font-semibold flex items-center gap-2 text-destructive"><ShieldAlert className="h-4 w-4" /> Location access is currently denied</p>
            <p className="text-muted-foreground mt-1">
              Rep order capture remains blocked until location permission is enabled. Retry below or enable location in browser settings.
            </p>
          </div>
        )}

        <div className={`rounded-xl border p-4 text-sm ${syncTone}`}>
          <p className="font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {synced ? "Location synced" : "Location sync status"}
          </p>
          <p className="text-muted-foreground mt-1">{lastLocationSync.message}</p>
          <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
            <span>Permission: {locationPermission}</span>
            <span>
              Accuracy: {lastLocationSync.accuracyMeters != null ? `${lastLocationSync.accuracyMeters}m` : "waiting"}
            </span>
            <span>
              Last sync:{" "}
              {lastLocationSync.lastUploadedAt
                ? new Date(lastLocationSync.lastUploadedAt).toLocaleTimeString()
                : "not yet"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {locationPermission !== "granted" && (
            <Button onClick={enableLocation} disabled={requesting} className="bg-gradient-accent text-accent-foreground border-0 shadow-glow">
              {requesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Requesting location...
                </>
              ) : (
                "Enable location"
              )}
            </Button>
          )}
          <Button
            type="button"
            disabled={!repOperationalReady}
            onClick={() => {
              if (repOperationalReady) navigate("/checkout");
            }}
          >
            Continue to route checkout
          </Button>
          <Button variant="outline" asChild>
            <Link to="/products">Continue browsing products</Link>
          </Button>
          <Button variant="ghost" onClick={logout}>Logout</Button>
        </div>
      </div>
    </div>
  );
}
