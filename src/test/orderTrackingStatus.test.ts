import { describe, expect, it } from "vitest";
import {
  CUSTOMER_ORDER_PROGRESS_STAGES,
  getCustomerOrderStatusInfo,
  resolveCustomerOrderStage,
} from "@/lib/orderTrackingStatus";

describe("resolveCustomerOrderStage", () => {
  it("maps lifecycle statuses to customer tracking stages", () => {
    expect(resolveCustomerOrderStage("pending")).toBe("pending");
    expect(resolveCustomerOrderStage("processing")).toBe("processing");
    expect(resolveCustomerOrderStage("dispatched")).toBe("dispatched");
    expect(resolveCustomerOrderStage("completed")).toBe("completed");
    expect(resolveCustomerOrderStage("cancelled")).toBe("cancelled");
  });

  it("normalizes related backend statuses", () => {
    expect(resolveCustomerOrderStage("paid")).toBe("processing");
    expect(resolveCustomerOrderStage("shipped")).toBe("dispatched");
    expect(resolveCustomerOrderStage("delivered")).toBe("completed");
    expect(resolveCustomerOrderStage("canceled")).toBe("cancelled");
  });
});

describe("getCustomerOrderStatusInfo", () => {
  it("returns customer-friendly labels and descriptions", () => {
    expect(getCustomerOrderStatusInfo("pending")).toMatchObject({
      key: "pending",
      label: "Order received",
      description: "We have your order and are preparing it for processing.",
    });

    expect(getCustomerOrderStatusInfo("processing")).toMatchObject({
      key: "processing",
      label: "Preparing order",
      description: "Our team is packing your items.",
    });

    expect(getCustomerOrderStatusInfo("dispatched")).toMatchObject({
      key: "dispatched",
      label: "On the way",
      description: "Your order has been dispatched.",
    });

    expect(getCustomerOrderStatusInfo("completed")).toMatchObject({
      key: "completed",
      label: "Delivered",
      description: "Your order has been completed.",
    });

    expect(getCustomerOrderStatusInfo("cancelled")).toMatchObject({
      key: "cancelled",
      label: "Cancelled",
      description: "This order will not be fulfilled.",
    });
  });
});

describe("CUSTOMER_ORDER_PROGRESS_STAGES", () => {
  it("contains the standard visible progress flow", () => {
    expect(CUSTOMER_ORDER_PROGRESS_STAGES).toEqual([
      "pending",
      "processing",
      "dispatched",
      "completed",
    ]);
  });
});
