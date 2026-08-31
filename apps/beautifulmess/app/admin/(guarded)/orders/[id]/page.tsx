import { notFound } from "next/navigation";
import { formatPrice } from "@storeforge/ui";
import { getOrderDetail } from "../../../../../lib/admin/orders";
import { OrderStatusControl } from "./order-status-control";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderDetail(id);
  if (!order) notFound();

  return (
    <main className="flex flex-col gap-8">
      <div>
        <h2 className="font-heading text-2xl uppercase text-foreground">Order {order.gatewayOrderId ?? order.id}</h2>
        <p className="text-muted">Placed {order.createdAt.toLocaleString()}</p>
      </div>

      <OrderStatusControl orderId={order.id} currentStatus={order.status} hasAwb={Boolean(order.awbCode)} />

      <section>
        <h3 className="font-heading mb-3 text-lg uppercase text-foreground">Items</h3>
        <ul className="flex flex-col gap-2 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between border-b border-border py-2">
              <span>
                {item.product.name}
                {item.variant ? ` (${item.variant.name}: ${item.variant.value})` : ""} × {item.quantity}
              </span>
              <span>{formatPrice((item.variant?.price ?? item.product.price) * item.quantity)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="font-heading mb-3 text-lg uppercase text-foreground">Shipping address</h3>
        {order.shipToAddressLine1 ? (
          <address className="text-sm not-italic text-foreground">
            {order.shipToName}
            <br />
            {order.shipToEmail} · {order.shipToPhone}
            <br />
            {order.shipToAddressLine1}
            {order.shipToAddressLine2 ? `, ${order.shipToAddressLine2}` : ""}
            <br />
            {order.shipToCity}, {order.shipToState} {order.shipToPincode}
          </address>
        ) : (
          <p className="text-muted">No address on file for this order.</p>
        )}
      </section>

      <section>
        <h3 className="font-heading mb-3 text-lg uppercase text-foreground">Payment & fulfillment</h3>
        <p className="text-sm text-foreground">
          {order.amountPaid !== null ? `Amount paid: ${formatPrice(order.amountPaid)}` : "Amount paid: not recorded"}
          {order.discountAmount ? ` (discount applied: ${formatPrice(order.discountAmount)})` : ""}
        </p>
        <p className="text-sm text-foreground">
          {order.shipmentId
            ? order.awbCode
              ? `Tracking: ${order.courierName ?? "Courier"} — AWB ${order.awbCode}`
              : "Shipment created — tracking number pending"
            : "No Shiprocket shipment created yet."}
        </p>
      </section>
    </main>
  );
}
