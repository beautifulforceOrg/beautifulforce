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
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Order {order.gatewayOrderId}</h1>
      <CheckoutSteps steps={STEPS} currentStep={stepForStatus(order.status)} />
      <p className="mt-6 text-foreground" data-testid="order-status">
        Status: {order.status}
      </p>
    </main>
  );
}
