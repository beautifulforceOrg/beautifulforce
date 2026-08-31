"use client";

import { useState, useTransition } from "react";
import type { OrderStatus } from "@storeforge/db";
import { useToast } from "@storeforge/ui";
import { setOrderStatusAction } from "./actions";

const STATUSES: OrderStatus[] = ["PENDING", "PAID", "FULFILLED", "CANCELLED"];

export function OrderStatusControl({
  orderId,
  currentStatus,
  hasAwb,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  hasAwb: boolean;
}) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function handleChange(next: OrderStatus) {
    if (
      next === "CANCELLED" &&
      hasAwb &&
      !confirm(
        "This order already has a Shiprocket shipment. Changing the status here does NOT cancel the shipment or courier pickup -- do that manually in the Shiprocket dashboard. Continue?"
      )
    ) {
      return;
    }

    setStatus(next);
    startTransition(async () => {
      await setOrderStatusAction(orderId, next);
      showToast("Order status updated.");
    });
  }

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-foreground" htmlFor="order-status-select">
        Status
      </label>
      <select
        id="order-status-select"
        value={status}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value as OrderStatus)}
        className="rounded-[var(--sf-radius,0.5rem)] border border-border px-3 py-2 text-sm text-foreground"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {hasAwb ? (
        <span className="text-xs text-muted">This order has a real Shiprocket shipment.</span>
      ) : null}
    </div>
  );
}
