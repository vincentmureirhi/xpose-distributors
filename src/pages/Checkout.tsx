import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CreditCard, FileText, Loader2, MapPin, Phone, Search, User, Truck, X } from "lucide-react";
import { useCart, formatPrice } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { guestCheckout } from "@/lib/api/orders";
import { listLocations, listRegions, type LocationOption, type RegionOption } from "@/lib/api/geography";
import { listRouteCustomers, upsertRouteCustomer } from "@/lib/api/route-customers";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { searchLocations } from "@/lib/kenya-locations";
import OrderSuccessOverlay from "@/components/OrderSuccessOverlay";
import { getCartPricingMessage, isWholesaleEligible } from "@/lib/pricingMessaging";
import { useSalesRepSession } from "@/context/SalesRepSessionContext";
import {
  buildRouteOrderNotes,
  getRouteCustomerBackendId,
  mergeRouteCustomers,
  saveRouteCustomers,
  type RouteCustomer,
} from "@/lib/routeCustomerWorkflow";
import { getSalesRepDisplayName } from "@/lib/salesRepSession";

const TRANSPORT_COMPANIES = [
  "NAEKANA Sacco",
  "Coast Bus",
  "Modern Coast",
  "Easy Coach",
  "Ena Coach",
  "Greenline",
  "Climax Coaches",
  "Crown Bus",
  "Dreamline",
  "Mash East Africa",
  "North Rift Shuttle",
  "Mololine",
  "2NK Sacco",
  "G4S Kenya (Cargo)",
  "Wells Fargo (Cargo)",
  "Fargo Courier",
  "Posta Kenya",
  "Sendy",
  "Pickup Mtaani",
  "KBS (Kenya Bus Service)",
  "Metro Trans",
  "Double M",
  "Crossland Express",
  "Tahmeed Coach",
  "Guardian Coach",
  "Simba Coach",
  "Intercity Express",
];

const KENYAN_PHONE_REGEX = /^(0|\+254|254)[17]\d{8}$/;

const schema = z.object({
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
  delivery_location: z.string().optional(),
  transport_company: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type CheckoutWorkflow = "self_service" | "sales_rep";

function resolveRepOperationBlockReason(params: {
  isSalesRepAuthenticated: boolean;
  mustChangePassword: boolean;
  locationPermission: "unknown" | "prompt" | "granted" | "denied";
  repOperationalReady: boolean;
  locationSyncMessage?: string;
}) {
  if (!params.isSalesRepAuthenticated) return null;
  if (params.mustChangePassword) return "Password change is required before rep operational checkout.";
  if (params.locationPermission === "denied") return "Location access is denied. Enable location to capture route orders.";
  if (params.locationPermission === "granted" && !params.repOperationalReady) {
    return params.locationSyncMessage || "Waiting for accurate GPS sync before route order capture.";
  }
  if (params.locationPermission === "granted") return null;
  return "Location permission is required to continue with rep route operations.";
}

const fieldVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

export default function Checkout() {
  const { cartItems, totalAmount, clearCart, evaluations } = useCart();
  const navigate = useNavigate();
  const {
    isSalesRepAuthenticated,
    salesRep,
    mustChangePassword,
    locationPermission,
    lastLocationSync,
    repOperationalReady,
    requestLocationPermission,
  } = useSalesRepSession();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ id: string } | null>(null);
  const workflow: CheckoutWorkflow = isSalesRepAuthenticated ? "sales_rep" : "self_service";
  const [routeCustomers, setRouteCustomers] = useState<RouteCustomer[]>([]);
  const [loadingRouteCustomers, setLoadingRouteCustomers] = useState(false);
  const [selectedRouteCustomerId, setSelectedRouteCustomerId] = useState("");
  const [routeCustomerSearch, setRouteCustomerSearch] = useState("");
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const repDisplayName = getSalesRepDisplayName(salesRep);
  const [repPhone, setRepPhone] = useState("");
  const [repArea, setRepArea] = useState("");
  const [newRouteCustomer, setNewRouteCustomer] = useState({
    name: "",
    phone: "",
    location_id: "",
    notes: "",
  });

  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [locationOpen, setLocationOpen] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_name: "",
      customer_phone: "",
      delivery_location: "",
      transport_company: "",
      notes: "",
    },
  });

  const salesRepId = salesRep?.id;
  const repOperationsBlockedReason = resolveRepOperationBlockReason({
    isSalesRepAuthenticated,
    mustChangePassword,
    locationPermission,
    repOperationalReady,
    locationSyncMessage: lastLocationSync.message,
  });
  const repOperationsBlocked = workflow === "sales_rep" && !!repOperationsBlockedReason;

  useEffect(() => {
    document.title = "Checkout — XPOSE";
    if (cartItems.length === 0) navigate("/cart", { replace: true });
  }, [cartItems.length, navigate]);

  useEffect(() => {
    if (!salesRep) return;
    setRepPhone(salesRep.phone || "");
    setRepArea(salesRep.route_area || "");
  }, [salesRep]);

  const selectedRegion = useMemo(
    () => regions.find((region) => region.id === selectedRegionId),
    [regions, selectedRegionId]
  );
  const selectedLocation = useMemo(
    () => locations.find((location) => location.id === selectedLocationId),
    [locations, selectedLocationId]
  );

  useEffect(() => {
    if (!isSalesRepAuthenticated) {
      setRegions([]);
      setLocations([]);
      setRouteCustomers([]);
      setLoadingRouteCustomers(false);
      return;
    }

    let active = true;
    setLoadingRegions(true);

    listRegions()
      .then((rows) => {
        if (!active) return;
        setRegions(rows);
        if (!selectedRegionId && repArea) {
          const normalizedArea = repArea.trim().toLowerCase();
          const matchedRegion = rows.find((region) => region.name.trim().toLowerCase() === normalizedArea);
          if (matchedRegion) setSelectedRegionId(matchedRegion.id);
        }
      })
      .catch((error) => {
        if (!active) return;
        if (import.meta.env.DEV) {
          console.warn("Failed to load regions for route checkout.", error);
        }
        toast.error("Could not load regions", {
          description: "Refresh the page before capturing a route order.",
        });
      })
      .finally(() => {
        if (!active) return;
        setLoadingRegions(false);
      });

    return () => {
      active = false;
    };
  }, [isSalesRepAuthenticated, repArea]);

  useEffect(() => {
    if (!isSalesRepAuthenticated || workflow !== "sales_rep" || !selectedRegionId) {
      setLocations([]);
      setSelectedLocationId("");
      return;
    }

    let active = true;
    setLoadingLocations(true);

    listLocations({ region_id: selectedRegionId })
      .then((rows) => {
        if (!active) return;
        setLocations(rows);
        setSelectedLocationId((current) =>
          current && rows.some((location) => location.id === current) ? current : ""
        );
        setNewRouteCustomer((current) => ({
          ...current,
          location_id: current.location_id && rows.some((location) => location.id === current.location_id)
            ? current.location_id
            : "",
        }));
      })
      .catch((error) => {
        if (!active) return;
        if (import.meta.env.DEV) {
          console.warn("Failed to load locations for selected region.", error);
        }
        toast.error("Could not load locations", {
          description: "Try selecting the region again.",
        });
      })
      .finally(() => {
        if (!active) return;
        setLoadingLocations(false);
      });

    return () => {
      active = false;
    };
  }, [isSalesRepAuthenticated, selectedRegionId, workflow]);

  useEffect(() => {
    if (!isSalesRepAuthenticated || workflow !== "sales_rep" || !selectedRegionId) {
      setRouteCustomers([]);
      setLoadingRouteCustomers(false);
      return;
    }

    const query = routeCustomerSearch.trim();

    let active = true;
    const timer = window.setTimeout(() => {
      setLoadingRouteCustomers(true);
      listRouteCustomers({
        region_id: selectedRegionId,
        location_id: selectedLocationId || undefined,
        search: query.length >= 2 ? query : undefined,
        limit: 75,
      })
        .then((backendCustomers) => {
          if (!active) return;
          setRouteCustomers(backendCustomers);
          saveRouteCustomers(backendCustomers);
        })
        .catch((error) => {
          if (import.meta.env.DEV) {
            console.warn("Failed to search route customers from backend.", error);
          }
        })
        .finally(() => {
          if (!active) return;
          setLoadingRouteCustomers(false);
        });
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isSalesRepAuthenticated, routeCustomerSearch, selectedLocationId, selectedRegionId, workflow]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setLocationOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLocationInput = (q: string) => {
    setLocationQuery(q);
    setValue("delivery_location", q);
    const results = searchLocations(q, 8);
    setLocationSuggestions(results);
    setLocationOpen(results.length > 0);
  };

  const selectLocation = (loc: string) => {
    setLocationQuery(loc);
    setValue("delivery_location", loc, { shouldValidate: true });
    setLocationOpen(false);
  };

  const applyRouteCustomer = (customer: RouteCustomer) => {
    setSelectedRouteCustomerId(customer.id);
    setValue("customer_name", customer.name, { shouldValidate: true });
    setValue("customer_phone", customer.phone, { shouldValidate: true });
    if (customer.region_id) setSelectedRegionId(customer.region_id);
    if (customer.customer_location_id) setSelectedLocationId(customer.customer_location_id);
    const customerLocation = customer.location_name || customer.location || selectedLocation?.name || selectedRegion?.name || "";
    if (customerLocation) {
      setLocationQuery(customerLocation);
      setValue("delivery_location", customerLocation, { shouldValidate: true });
    }
    clearErrors(["customer_name", "customer_phone", "delivery_location"]);
  };

  const selectedRouteCustomer = routeCustomers.find((c) => c.id === selectedRouteCustomerId);
  const filteredRouteCustomers = useMemo(() => {
    const q = routeCustomerSearch.trim().toLowerCase();
    if (!q) return routeCustomers;
    return routeCustomers.filter((customer) =>
      [customer.name, customer.phone, customer.location, customer.route_area, customer.notes]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [routeCustomerSearch, routeCustomers]);

  useEffect(() => {
    if (workflow !== "sales_rep" || !selectedRouteCustomerId) return;
    const selectedExists = routeCustomers.some((customer) => customer.id === selectedRouteCustomerId);
    if (selectedExists) return;
    setSelectedRouteCustomerId("");
    setValue("customer_name", "", { shouldValidate: true });
    setValue("customer_phone", "", { shouldValidate: true });
    setValue("delivery_location", "", { shouldValidate: true });
    setLocationQuery("");
  }, [routeCustomers, selectedRouteCustomerId, setValue, workflow]);

  const addRouteCustomerInline = async () => {
    if (repOperationsBlocked) {
      toast.error("Rep route workflow blocked", { description: repOperationsBlockedReason || undefined });
      return;
    }

    const name = newRouteCustomer.name.trim();
    const phone = newRouteCustomer.phone.trim();
    const locationId = newRouteCustomer.location_id || selectedLocationId;
    const routeLocation = locations.find((location) => location.id === locationId);
    if (!name || !phone || !selectedRegionId || !locationId || !routeLocation) {
      toast.error("Add customer details", {
        description: "Name, phone, region, and location are required for route customers.",
      });
      return;
    }
    if (!KENYAN_PHONE_REGEX.test(phone)) {
      toast.error("Enter a valid phone number", {
        description: "Use a Kenyan mobile number such as 07XX XXX XXX.",
      });
      return;
    }

    try {
      const backendCustomer = await upsertRouteCustomer({
        customer_name: name,
        customer_phone: phone,
        route_area: routeLocation.name,
        route_notes: newRouteCustomer.notes || undefined,
        sales_rep_id: salesRepId,
        customer_location_id: locationId,
        reject_existing: true,
      });
      if (!backendCustomer) {
        toast.error("Route customer was not saved", {
          description: "The server did not return the saved customer. Please try again.",
        });
        return;
      }
      const customer: RouteCustomer = {
        ...backendCustomer,
        customer_location_id: backendCustomer.customer_location_id || locationId,
        location: backendCustomer.location || routeLocation.name,
        location_name: backendCustomer.location_name || routeLocation.name,
        region_id: backendCustomer.region_id || selectedRegionId,
        region_name: backendCustomer.region_name || selectedRegion?.name,
        route_area: backendCustomer.route_area || routeLocation.name,
      };
      const updated = mergeRouteCustomers([customer], routeCustomers);
      setRouteCustomers(updated);
      saveRouteCustomers(updated);
      applyRouteCustomer(customer);
      setNewRouteCustomer({ name: "", phone: "", location_id: locationId, notes: "" });
      toast.success("Route customer saved", {
        description: `${customer.name} is synced to admin and selected for this order.`,
      });
    } catch (error) {
      const apiError = error as {
        response?: { status?: number; data?: { message?: string; data?: { customer?: RouteCustomer } } };
      };
      if (apiError.response?.status === 409) {
        const existing = apiError.response.data?.data?.customer;
        if (existing) {
          const normalizedExisting = mergeRouteCustomers([existing], routeCustomers);
          setRouteCustomers(normalizedExisting);
          saveRouteCustomers(normalizedExisting);
        }
        toast.error("Route customer already exists", {
          description: apiError.response.data?.message || "Search and select the existing route customer.",
        });
        return;
      }

      if (import.meta.env.DEV) {
        console.warn("Failed to upsert route customer in backend.", error);
      }
      toast.error("Route customer was not saved", {
        description: apiError.response?.data?.message || "Check your connection and try again.",
      });
    }
  };

  const clearSelectedRouteCustomer = () => {
    setSelectedRouteCustomerId("");
    setValue("customer_name", "", { shouldValidate: true });
    setValue("customer_phone", "", { shouldValidate: true });
    setValue("delivery_location", "", { shouldValidate: true });
    setLocationQuery("");
  };

  const handleRouteRegionChange = (regionId: string) => {
    setSelectedRegionId(regionId);
    setSelectedLocationId("");
    setRouteCustomerSearch("");
    setRouteCustomers([]);
    clearSelectedRouteCustomer();
    setNewRouteCustomer((current) => ({ ...current, location_id: "" }));
  };

  const handleRouteLocationFilterChange = (locationId: string) => {
    setSelectedLocationId(locationId);
    setNewRouteCustomer((current) => ({ ...current, location_id: locationId }));
    clearSelectedRouteCustomer();
  };

  const resolveCheckoutCustomerData = (values: FormValues) => {
    if (workflow === "sales_rep" && selectedRouteCustomer) {
      return {
        customerName: selectedRouteCustomer.name,
        customerPhone: selectedRouteCustomer.phone,
        deliveryLocation: selectedRouteCustomer.location || values.delivery_location?.trim() || "",
      };
    }

    return {
      customerName: values.customer_name?.trim() || "",
      customerPhone: values.customer_phone?.trim() || "",
      deliveryLocation: values.delivery_location?.trim() || "",
    };
  };

  const validateSelfServiceCheckout = (values: FormValues) => {
    clearErrors(["customer_name", "customer_phone", "delivery_location", "transport_company"]);
    const name = values.customer_name?.trim() || "";
    const phone = values.customer_phone?.trim() || "";
    const deliveryLocation = values.delivery_location?.trim() || "";
    const transportCompany = values.transport_company?.trim() || "";

    if (name.length < 2) {
      setError("customer_name", { type: "manual", message: "Full name must be at least 2 characters" });
      return false;
    }
    if (!KENYAN_PHONE_REGEX.test(phone)) {
      setError("customer_phone", {
        type: "manual",
        message: "Enter a valid Kenyan phone number (e.g. 07XX XXX XXX)",
      });
      return false;
    }
    if (deliveryLocation.length < 2) {
      setError("delivery_location", { type: "manual", message: "Select or type your delivery location" });
      return false;
    }
    if (transportCompany.length < 2) {
      setError("transport_company", { type: "manual", message: "Please select a transport company" });
      return false;
    }

    return true;
  };

  const onSubmit = async (values: FormValues) => {
    if (workflow === "self_service" && !validateSelfServiceCheckout(values)) return;

    if (workflow === "sales_rep") {
      if (mustChangePassword) {
        toast.error("Password change required", {
          description: "Change your password before capturing route orders.",
        });
        navigate("/sales-rep/change-password");
        return;
      }
      if (repOperationsBlockedReason) {
        toast.error("Location permission required", {
          description: repOperationsBlockedReason,
        });
        navigate("/sales-rep/location-access");
        return;
      }
      if (!selectedRouteCustomer) {
        toast.error("Select a route customer", {
          description: "Choose an existing route customer or add one inline.",
        });
        return;
      }
      if (!salesRepId) {
        toast.error("Rep session missing", {
          description: "Sign in again to continue with authenticated rep checkout.",
        });
        navigate("/sales-rep/login");
        return;
      }
    }

    setSubmitting(true);
    try {
      const orderNotes =
        workflow === "sales_rep" && selectedRouteCustomer
          ? buildRouteOrderNotes({
              rep_name: repDisplayName,
              rep_phone: repPhone || undefined,
              rep_area: repArea || undefined,
              route_customer: selectedRouteCustomer,
              order_notes: values.notes || undefined,
            })
          : values.notes || undefined;

      const { customerName, customerPhone, deliveryLocation } = resolveCheckoutCustomerData(values);
      const transportCompany = values.transport_company?.trim();

      const result = await guestCheckout({
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_address:
          workflow === "sales_rep"
            ? deliveryLocation || selectedRouteCustomer?.location || selectedLocation?.name || selectedRegion?.name || ""
            : `${deliveryLocation} - ${transportCompany}`,
        notes: orderNotes,
        ...(workflow === "sales_rep" &&
          selectedRouteCustomer && {
            order_type: "route",
            order_workflow_type: "route_sales_rep_capture",
            sales_rep_id: salesRepId,
            customer_id: getRouteCustomerBackendId(selectedRouteCustomer),
            customer_location_id: selectedRouteCustomer.customer_location_id,
            route_area: selectedRouteCustomer.route_area || selectedRouteCustomer.location || selectedRegion?.name || repArea,
            route_notes: selectedRouteCustomer.notes || undefined,
          }),
        items: cartItems.map((i) => {
          const ev = evaluations[i.id];
          return { product_id: i.id, quantity: i.quantity, unit_price: ev ? ev.unit_price : i.price };
        }),
      });
      clearCart();
      const orderId = result.order_number || result.id;
      setSuccess({ id: orderId ? String(orderId) : "" });
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      toast.error("Could not place order", {
        description: err?.response?.data?.message || err.message || "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container max-w-7xl overflow-x-hidden px-4 py-6 sm:py-8 md:py-14">
      <OrderSuccessOverlay
        show={!!success}
        orderId={success?.id || ""}
        paymentMode={workflow === "sales_rep" ? "route_credit" : "mpesa"}
        onDone={() => navigate(success?.id ? `/track-order?id=${success.id}` : "/track-order")}
      />

      <div className="mb-6 md:mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
          <Link to="/cart">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to cart
          </Link>
        </Button>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight">Checkout</h1>
          <p className="text-muted-foreground mt-2">Fill in your details and we'll handle the rest.</p>
        </motion.div>
      </div>

      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-soft sm:rounded-2xl sm:p-5 md:p-8 space-y-5 md:space-y-6"
          >
            <div>
              <h2 className="font-display font-bold text-xl">Your details</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {workflow === "sales_rep"
                  ? "Capture orders for route customers in the field."
                  : "No account needed — just fill in your details below."}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-secondary/40 p-3 text-sm">
              {workflow === "sales_rep" ? (
                <p>
                  Authenticated sales rep checkout is active for{" "}
                  <span className="font-semibold">{repDisplayName}</span>.
                </p>
              ) : (
                <p>Customer self-service checkout is active.</p>
              )}
            </div>

            {workflow === "sales_rep" && (
              <>
                <div className="rounded-xl border border-border bg-secondary/30 p-3 sm:p-4 space-y-4">
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="text-sm font-semibold">Route capture portal</p>
                    <p className="text-xs text-muted-foreground">
                      Select the route region first, then search customers registered in that region.
                    </p>
                  </div>
                  <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <Input value={repDisplayName} readOnly aria-label="Sales rep name" className="h-11 min-w-0" />
                    <Input
                      value={repPhone}
                      onChange={(e) => setRepPhone(e.target.value)}
                      placeholder="Rep phone"
                      className="h-11 min-w-0"
                    />
                  </div>
                  <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <div className="min-w-0 space-y-1.5">
                      <Label htmlFor="route-region" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Current region
                      </Label>
                      <select
                        id="route-region"
                        value={selectedRegionId}
                        onChange={(e) => handleRouteRegionChange(e.target.value)}
                        disabled={repOperationsBlocked || loadingRegions}
                        className="h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                      >
                        <option value="">{loadingRegions ? "Loading regions..." : "Select region..."}</option>
                        {regions.map((region) => (
                          <option key={region.id} value={region.id}>
                            {region.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <Label htmlFor="route-location-filter" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Location filter
                      </Label>
                      <select
                        id="route-location-filter"
                        value={selectedLocationId}
                        onChange={(e) => handleRouteLocationFilterChange(e.target.value)}
                        disabled={repOperationsBlocked || !selectedRegionId || loadingLocations}
                        className="h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                      >
                        <option value="">
                          {!selectedRegionId
                            ? "Select region first"
                            : loadingLocations
                              ? "Loading locations..."
                              : "All locations in region"}
                        </option>
                        {locations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {repOperationsBlockedReason && (
                  <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm space-y-3">
                    <p className="font-semibold text-destructive">Rep order capture is blocked</p>
                    <p className="text-muted-foreground">{repOperationsBlockedReason}</p>
                    <div className="flex flex-wrap gap-2">
                      {mustChangePassword ? (
                        <Button type="button" asChild size="sm">
                          <Link to="/sales-rep/change-password">Change password</Link>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            requestLocationPermission().catch(() => undefined);
                          }}
                        >
                          Enable location
                        </Button>
                      )}
                      <Button type="button" size="sm" variant="outline" asChild>
                        <Link to="/sales-rep/location-access">Open location setup</Link>
                      </Button>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-border bg-secondary/30 p-3 sm:p-4 space-y-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="text-sm font-semibold">Route customer</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedRegion
                        ? `Searching ${selectedRegion.name}${selectedLocation ? ` / ${selectedLocation.name}` : ""}`
                        : "Choose a region to start searching route customers."}
                    </p>
                  </div>
                  {loadingRouteCustomers && (
                    <p className="text-xs text-muted-foreground">Syncing route customers from backend…</p>
                  )}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={routeCustomerSearch}
                      onChange={(e) => setRouteCustomerSearch(e.target.value)}
                      placeholder="Search by customer name, phone, or location"
                      disabled={repOperationsBlocked || !selectedRegionId}
                      className="h-11 min-w-0 pl-10"
                    />
                  </div>
                  <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <select
                      value={selectedRouteCustomerId}
                      onChange={(e) => {
                        const customer = routeCustomers.find((c) => c.id === e.target.value);
                        if (customer) applyRouteCustomer(customer);
                        else clearSelectedRouteCustomer();
                      }}
                      disabled={repOperationsBlocked || !selectedRegionId}
                      className="h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                    >
                      <option value="">
                        {!selectedRegionId ? "Select region first..." : "Select existing route customer..."}
                      </option>
                      {filteredRouteCustomers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} - {customer.location_name || customer.location}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full sm:w-auto"
                      onClick={clearSelectedRouteCustomer}
                      disabled={repOperationsBlocked}
                    >
                      Clear
                    </Button>
                  </div>
                  {selectedRegionId && routeCustomerSearch && filteredRouteCustomers.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No matching route customer found. Add the customer below and it will sync to admin.
                    </p>
                  )}

                  <div className="rounded-lg border border-dashed border-border p-3 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Add route customer
                    </p>
                    <div className="grid min-w-0 gap-3 lg:grid-cols-2">
                      <Input
                        value={newRouteCustomer.name}
                        onChange={(e) => setNewRouteCustomer((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Business / customer name"
                        disabled={repOperationsBlocked}
                        className="h-11"
                      />
                      <Input
                        value={newRouteCustomer.phone}
                        onChange={(e) => setNewRouteCustomer((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="Phone number"
                        disabled={repOperationsBlocked}
                        className="h-11"
                      />
                      <select
                        value={selectedRegionId}
                        onChange={(e) => handleRouteRegionChange(e.target.value)}
                        disabled={repOperationsBlocked || loadingRegions}
                        className="h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                      >
                        <option value="">Customer region...</option>
                        {regions.map((region) => (
                          <option key={region.id} value={region.id}>
                            {region.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={newRouteCustomer.location_id || selectedLocationId}
                        onChange={(e) => setNewRouteCustomer((prev) => ({ ...prev, location_id: e.target.value }))}
                        disabled={repOperationsBlocked || !selectedRegionId || loadingLocations}
                        className="h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                      >
                        <option value="">
                          {!selectedRegionId
                            ? "Select region first"
                            : loadingLocations
                              ? "Loading locations..."
                              : "Customer location..."}
                        </option>
                        {locations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Textarea
                      value={newRouteCustomer.notes}
                      onChange={(e) => setNewRouteCustomer((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Route customer notes (optional)"
                      disabled={repOperationsBlocked}
                      rows={2}
                      className="resize-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-full sm:w-auto"
                      onClick={addRouteCustomerInline}
                      disabled={repOperationsBlocked || !selectedRegionId}
                    >
                      Save and use customer
                    </Button>
                  </div>

                  {selectedRouteCustomer && (
                    <div className="min-w-0 rounded-lg border border-accent/30 bg-accent/5 p-3 text-sm">
                      <p className="font-semibold">Ordering for: {selectedRouteCustomer.name}</p>
                      <p className="break-words text-muted-foreground">
                        {selectedRouteCustomer.phone} - {selectedRouteCustomer.location_name || selectedRouteCustomer.location}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Full Name */}
            <motion.div
              custom={0}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
              className={cn("space-y-1.5", workflow === "sales_rep" && "hidden")}
            >
              <Label htmlFor="customer_name">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {workflow === "sales_rep" ? "Route Customer Name" : "Full Name"} <span className="text-destructive ml-0.5">*</span>
                </span>
              </Label>
              <Input
                id="customer_name"
                placeholder={workflow === "sales_rep" ? "Selected route customer" : "Jane Doe"}
                {...register("customer_name")}
                readOnly={workflow === "sales_rep"}
                className={cn(
                  "h-12",
                  workflow === "sales_rep" && "bg-secondary/50",
                  errors.customer_name && "border-destructive focus-visible:ring-destructive"
                )}
              />
              {errors.customer_name && (
                <p className="text-xs text-destructive">{errors.customer_name.message}</p>
              )}
            </motion.div>

            {/* Phone */}
            <motion.div
              custom={1}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
              className={cn("space-y-1.5", workflow === "sales_rep" && "hidden")}
            >
              <Label htmlFor="customer_phone">
                <span className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {workflow === "sales_rep" ? "Route Customer Phone" : "Phone Number"} <span className="text-destructive ml-0.5">*</span>
                </span>
              </Label>
              <Input
                id="customer_phone"
                type="tel"
                placeholder={workflow === "sales_rep" ? "Selected route customer phone" : "0701 377 869"}
                {...register("customer_phone")}
                readOnly={workflow === "sales_rep"}
                className={cn(
                  "h-12",
                  workflow === "sales_rep" && "bg-secondary/50",
                  errors.customer_phone && "border-destructive focus-visible:ring-destructive"
                )}
              />
              {errors.customer_phone && (
                <p className="text-xs text-destructive">{errors.customer_phone.message}</p>
              )}
            </motion.div>

            {/* Delivery Location — autocomplete */}
            <motion.div
              custom={2}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
              className={cn("space-y-1.5", workflow === "sales_rep" && "hidden")}
            >
              <Label htmlFor="delivery_location">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Delivery Location <span className="text-destructive ml-0.5">*</span>
                </span>
              </Label>
              <Controller
                name="delivery_location"
                control={control}
                render={() => (
                  <div className="relative" ref={locationRef}>
                    <div className="relative">
                      <Input
                        id="delivery_location"
                        value={locationQuery}
                        onChange={(e) => handleLocationInput(e.target.value)}
                        onFocus={() => {
                          if (locationSuggestions.length > 0) setLocationOpen(true);
                        }}
                        placeholder="Type a city or area (e.g. Nairobi, Westlands…)"
                        autoComplete="off"
                        className={cn("h-12 pr-8", errors.delivery_location && "border-destructive focus-visible:ring-destructive")}
                      />
                      {locationQuery && (
                        <button
                          type="button"
                          onClick={() => { setLocationQuery(""); setValue("delivery_location", ""); setLocationOpen(false); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <AnimatePresence>
                      {locationOpen && locationSuggestions.length > 0 && (
                        <motion.ul
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-30 top-full left-0 right-0 mt-1 rounded-xl border border-border bg-card shadow-elevated overflow-hidden max-h-56 overflow-y-auto"
                        >
                          {locationSuggestions.map((loc) => (
                            <li key={loc}>
                              <button
                                type="button"
                                onMouseDown={() => selectLocation(loc)}
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary flex items-center gap-2"
                              >
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                {loc}
                              </button>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              />
              {errors.delivery_location && (
                <p className="text-xs text-destructive">{errors.delivery_location.message}</p>
              )}
            </motion.div>

            {/* Mode of Transport */}
            <motion.div
              custom={3}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
              className={cn("space-y-1.5", workflow === "sales_rep" && "hidden")}
            >
              <Label htmlFor="transport_company">
                <span className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  Mode of Transport <span className="text-destructive ml-0.5">*</span>
                </span>
              </Label>
              <select
                id="transport_company"
                {...register("transport_company")}
                className={cn(
                  "w-full h-12 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring",
                  errors.transport_company && "border-destructive"
                )}
              >
                <option value="">Select transport company…</option>
                {TRANSPORT_COMPANIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.transport_company && (
                <p className="text-xs text-destructive">{errors.transport_company.message}</p>
              )}
            </motion.div>

            {/* Notes */}
            <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
              <Label htmlFor="notes">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {workflow === "sales_rep" ? "Order Notes" : "Additional Notes"}
                  <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                </span>
              </Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions for your order…"
                rows={3}
                {...register("notes")}
                className="resize-none"
              />
            </motion.div>

            <motion.div custom={5} variants={fieldVariants} initial="hidden" animate="visible">
              <Button
                type="submit"
                size="lg"
                disabled={submitting || repOperationsBlocked}
                className="h-auto min-h-14 w-full whitespace-normal bg-gradient-accent px-4 py-3 text-center text-sm font-semibold text-accent-foreground shadow-glow sm:text-base"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Placing order…
                  </>
                ) : repOperationsBlocked ? (
                  "Enable location to capture route order"
                ) : (
                  `${workflow === "sales_rep" ? "Capture route order" : "Place order"} — ${formatPrice(totalAmount)}`
                )}
              </Button>
            </motion.div>
            {workflow === "sales_rep" && selectedRouteCustomer && (
              <p className="text-xs text-muted-foreground">
                This order will be submitted on behalf of <span className="font-semibold text-foreground">{selectedRouteCustomer.name}</span>.
              </p>
            )}
          </form>
        </motion.div>

        {/* Order Summary */}
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-soft sm:rounded-2xl sm:p-6"
          >
            <h2 className="font-display font-bold text-lg mb-4">Order summary</h2>
            {workflow === "sales_rep" && selectedRouteCustomer && (
              <div className="mb-4 rounded-lg border border-accent/30 bg-accent/5 p-3 text-sm">
                <p className="font-semibold">Route customer order</p>
                <p className="text-muted-foreground">
                  {selectedRouteCustomer.name} • {selectedRouteCustomer.location}
                </p>
              </div>
            )}
            <div className="mb-4 space-y-3 sm:hidden">
              {cartItems.map((i) => {
                const ev = evaluations[i.id];
                const unitPrice = ev ? ev.unit_price : i.price;
                const lineTotal = ev ? ev.line_total : i.price * i.quantity;
                const pricingLabel = ev?.pricing_label;
                const pricingMessage = getCartPricingMessage(ev, i.quantity);
                const wholesaleEligible = isWholesaleEligible(ev);
                const flashSaleApplied = Boolean(ev?.flash_sale_id || pricingLabel === "flash sale");
                return (
                  <div key={i.id} className="rounded-lg border border-border/70 bg-secondary/30 p-3">
                    <div className="flex min-w-0 gap-3">
                      {i.image_url && (
                        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-background">
                          <img src={i.image_url} alt={i.name} className="h-full w-full object-contain p-1.5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold leading-snug">{i.name}</p>
                        {pricingLabel && (
                          <span className={`mt-1 block text-[10px] font-semibold uppercase tracking-wider ${wholesaleEligible || flashSaleApplied ? "text-accent" : "text-muted-foreground"}`}>
                            {pricingLabel}
                          </span>
                        )}
                        {pricingMessage && (
                          <span className={`mt-0.5 block text-[10px] ${wholesaleEligible || flashSaleApplied ? "text-accent" : "text-muted-foreground"}`}>
                            {pricingMessage}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/70 pt-2 text-xs">
                      <div>
                        <span className="block text-muted-foreground">Qty</span>
                        <span className="font-semibold">{i.quantity}</span>
                      </div>
                      <div>
                        <span className="block text-muted-foreground">Each</span>
                        <span className="font-semibold">{formatPrice(unitPrice)}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-muted-foreground">Total</span>
                        <span className="font-bold">{formatPrice(lineTotal)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mb-4 hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[340px] text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="py-2 text-left font-medium">Product</th>
                    <th className="py-2 text-center font-medium">Qty</th>
                    <th className="py-2 text-right font-medium">Price</th>
                    <th className="py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((i) => {
                    const ev = evaluations[i.id];
                    const unitPrice = ev ? ev.unit_price : i.price;
                    const lineTotal = ev ? ev.line_total : i.price * i.quantity;
                    const pricingLabel = ev?.pricing_label;
                    const pricingMessage = getCartPricingMessage(ev, i.quantity);
                    const wholesaleEligible = isWholesaleEligible(ev);
                    const flashSaleApplied = Boolean(ev?.flash_sale_id || pricingLabel === "flash sale");
                    return (
                    <tr key={i.id} className="border-b border-border/50">
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-2">
                          {i.image_url && (
                            <div className="h-8 w-8 rounded-md bg-secondary overflow-hidden flex-shrink-0">
                              <img src={i.image_url} alt={i.name} className="h-full w-full object-contain p-1" />
                            </div>
                          )}
                          <div>
                            <span className="line-clamp-2 leading-snug">{i.name}</span>
                            {pricingLabel && (
                              <span className={`block text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${wholesaleEligible || flashSaleApplied ? "text-accent" : "text-muted-foreground"}`}>
                                {pricingLabel}
                              </span>
                            )}
                            {pricingMessage && (
                              <span className={`block text-[10px] mt-0.5 ${wholesaleEligible || flashSaleApplied ? "text-accent" : "text-muted-foreground"}`}>
                                {pricingMessage}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-center text-muted-foreground">{i.quantity}</td>
                      <td className="py-2.5 text-right whitespace-nowrap">{formatPrice(unitPrice)}</td>
                      <td className="py-2.5 text-right whitespace-nowrap font-semibold">{formatPrice(lineTotal)}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="space-y-1 text-sm pt-3 border-t border-border">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{totalAmount >= 75000 ? "Free" : "Calculated at dispatch"}</span>
              </div>
              <div className="flex justify-between font-display font-bold text-xl pt-2 border-t border-border">
                <span>Total</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>

            {workflow === "self_service" && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment</p>
                </div>
                <div className="rounded-lg bg-secondary/60 p-3 text-xs space-y-1.5">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Method</span>
                    <span className="text-right font-semibold">M-Pesa Buy Goods</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Till Number</span>
                    <span className="font-bold tracking-widest">711714</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Business</span>
                    <span className="font-semibold">XPOSE</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Payment instructions will be shown after placing your order.
                </p>
              </div>
            )}
          </motion.div>
        </aside>
      </div>
    </div>
  );
}
