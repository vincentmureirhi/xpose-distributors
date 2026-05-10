import type { SalesRepProfile } from "@/lib/api/sales-rep-auth";

export type SessionActor = "sales_rep" | "normal_customer" | "unauthenticated_visitor";

export function resolveSessionActor(salesRep: SalesRepProfile | null, pathname = ""): SessionActor {
  if (salesRep) return "sales_rep";
  return pathname.startsWith("/checkout") ? "normal_customer" : "unauthenticated_visitor";
}

export function getSalesRepDisplayName(salesRep: SalesRepProfile | null) {
  return salesRep?.full_name || salesRep?.username || "Sales rep";
}
