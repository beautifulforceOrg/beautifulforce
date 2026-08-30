import { createShiprocketProviderFromEnv, type ShipToAddress } from "@storeforge/shipping";
import { db } from "@storeforge/db";

// Shiprocket requires a non-zero package weight/size per order -- sized
// for a folded frock/accessory in a poly mailer, not a general default
// (see packages/shipping's README: every business ships different
// things; apps/beautifulsilver uses a much smaller jewellery-box default).
export const PACKAGE_WEIGHT_KG = 0.3;
export const PACKAGE_DIMENSIONS_CM = { length: 25, breadth: 20, height: 5 };

function loadOrderForShipment(orderId: string) {
  return db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: { include: { product: true, variant: true } } },
  });
}

interface OrderAddressFields {
  shipToName: string | null;
  shipToEmail: string | null;
  shipToPhone: string | null;
  shipToAddressLine1: string | null;
  shipToAddressLine2: string | null;
  shipToCity: string | null;
  shipToState: string | null;
  shipToPincode: string | null;
}

export function shipToAddressFrom(order: OrderAddressFields): ShipToAddress | null {
  if (!order.shipToName || !order.shipToEmail || !order.shipToPhone || !order.shipToAddressLine1 || !order.shipToCity || !order.shipToState || !order.shipToPincode) {
    return null;
  }
  return {
    name: order.shipToName,
    email: order.shipToEmail,
    phone: order.shipToPhone,
    addressLine1: order.shipToAddressLine1,
    addressLine2: order.shipToAddressLine2 ?? undefined,
    city: order.shipToCity,
    state: order.shipToState,
    pincode: order.shipToPincode,
  };
}

/**
 * Creates the Shiprocket shipment for a just-PAID order and records the
 * result on the row. Called from app/api/webhooks/razorpay/route.ts, which
 * already guards against calling this twice for the same order (skips it
 * once `shipmentId` is set). Under E2E_MOCK_EXTERNAL_APIS, skips the real
 * Shiprocket call the same way lib/checkout.ts skips the real Razorpay
 * order-creation call.
 */
export async function createShipmentForOrder(orderId: string): Promise<void> {
  const order = await loadOrderForShipment(orderId);

  if (process.env.E2E_MOCK_EXTERNAL_APIS === "1") {
    await db.order.update({
      where: { id: order.id },
      data: { shipmentId: `shipment_e2e_${Date.now()}`, awbCode: "AWB_E2E_MOCK", courierName: "Mock Courier" },
    });
    return;
  }

  const shipTo = shipToAddressFrom(order);
  if (!shipTo) {
    // No address on file -- guest/mobile checkout without one, or an order
    // that predates this field. Left for manual follow-up rather than
    // sending Shiprocket an incomplete address.
    return;
  }

  const provider = createShiprocketProviderFromEnv();
  const shipment = await provider.createShipment({
    orderId: order.id,
    orderDate: order.createdAt.toISOString(),
    shipTo,
    items: order.items.map((item) => ({
      name: item.variant ? `${item.product.name} (${item.variant.value})` : item.product.name,
      sku: item.variant?.sku ?? item.product.slug,
      units: item.quantity,
      sellingPrice: item.variant?.price ?? item.product.price,
    })),
    packageWeightKg: PACKAGE_WEIGHT_KG,
    dimensionsCm: PACKAGE_DIMENSIONS_CM,
  });

  await db.order.update({
    where: { id: order.id },
    data: { shipmentId: shipment.shipmentId, awbCode: shipment.awbCode, courierName: shipment.courierName },
  });
}
