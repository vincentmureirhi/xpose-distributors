export type CustomerOrderStageKey =
  | "pending"
  | "processing"
  | "dispatched"
  | "completed"
  | "cancelled";

interface CustomerOrderStageInfo {
  key: CustomerOrderStageKey;
  label: string;
  description: string;
}

const CUSTOMER_ORDER_STAGE_INFO: Record<CustomerOrderStageKey, Omit<CustomerOrderStageInfo, "key">> = {
  pending: {
    label: "Order received",
    description: "We have your order and are preparing it for processing.",
  },
  processing: {
    label: "Preparing order",
    description: "Our team is packing your items.",
  },
  dispatched: {
    label: "On the way",
    description: "Your order has been dispatched.",
  },
  completed: {
    label: "Delivered",
    description: "Your order has been completed.",
  },
  cancelled: {
    label: "Cancelled",
    description: "This order will not be fulfilled.",
  },
};

export const CUSTOMER_ORDER_PROGRESS_STAGES: CustomerOrderStageKey[] = [
  "pending",
  "processing",
  "dispatched",
  "completed",
];

const STATUS_TO_STAGE_MAP: Record<string, CustomerOrderStageKey> = {
  pending: "pending",
  payment_pending: "pending",
  awaiting_payment: "pending",
  payment_confirmed: "processing",
  paid: "processing",
  processing: "processing",
  packing: "processing",
  packed: "processing",
  dispatched: "dispatched",
  in_transit: "dispatched",
  shipped: "dispatched",
  out_for_delivery: "dispatched",
  delivered: "completed",
  completed: "completed",
  cancelled: "cancelled",
  canceled: "cancelled",
};

export function resolveCustomerOrderStage(status?: string | null): CustomerOrderStageKey {
  const normalized = status?.toLowerCase() ?? "";
  return STATUS_TO_STAGE_MAP[normalized] || "pending";
}

export function getCustomerOrderStatusInfo(status?: string | null): CustomerOrderStageInfo {
  const key = resolveCustomerOrderStage(status);
  return {
    key,
    ...CUSTOMER_ORDER_STAGE_INFO[key],
  };
}
