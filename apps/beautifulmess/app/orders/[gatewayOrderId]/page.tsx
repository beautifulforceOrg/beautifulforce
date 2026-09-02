import { notFound } from "next/navigation";
import { db } from "@storeforge/db";
import { CheckoutSteps } from "@storeforge/ui";

const STEPS = ["Cart", "Checkout", "Payment", "Confirmation"];

function stepForStatus(status: string): number {
  if (status === "PAID" || status === "FULFILLED") return 3;
  return 2;
}

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ gatewayOrderId: string }>;
}) {
  const { gatewayOrderId } = await params;
  const order = await db.order.findUnique({ where: { gatewayOrderId } });
  if (!order) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-heading mb-8 text-3xl text-foreground">Order {order.gatewayOrderId}</h1>
      <CheckoutSteps steps={STEPS} currentStep={stepForStatus(order.status)} />
      <p className="mt-6 text-foreground" data-testid="order-status">
        Status: {order.status}
      </p>
      {order.shipmentId ? (
        <p className="mt-2 text-muted" data-testid="order-tracking">
          {order.awbCode
            ? `Tracking: ${order.courierName ?? "Courier"} — AWB ${order.awbCode}`
            : "Shipment created — tracking number pending"}
        </p>
      ) : null}
    </main>
  );
}
