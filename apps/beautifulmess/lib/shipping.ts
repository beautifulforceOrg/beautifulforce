import { createShiprocketProviderFromEnv, type ShipToAddress } from "@storeforge/shipping";
import { db } from "@storeforge/db";

// Fallback only -- used per-item when a product is missing its own real
// package weight/dimensions (e.g. a legacy catalog row from before these
// fields existed). Sized for a folded frock/accessory in a poly mailer
// (apps/beautifulsilver uses a much smaller jewellery-box fallback).
export const PACKAGE_WEIGHT_KG = 0.3;
export const PACKAGE_DIMENSIONS_CM = { length: 25, breadth: 20, height: 5 };

interface PackageableItem {
  quantity: number;
  product: {
    id: string;
    packageWeightGrams: number | null;
    packageLengthCm: number | null;
    packageWidthCm: number | null;
    packageHeightCm: number | null;
  };
}

/**
 * Aggregates real per-product package weight/dimensions across an
 * order's line items, instead of sending Shiprocket the same flat
 * constant for every order regardless of contents. Not a real 3D bin-
 * packing model -- a conservative bounding-envelope approximation: the
 * widest length/width across all items, with heights summed (as if
 * items are stacked). Falls back to the flat constants, per item, only
 * when that item's product is missing this data, logging so gaps get
 * noticed and backfilled rather than silently mis-shipped forever.
 */
export function aggregatePackageForItems(items: PackageableItem[]): {
  weightKg: number;
  dimensionsCm: { length: number; breadth: number; height: number };
} {
  let totalWeightGrams = 0;
  let maxLength = 0;
  let maxWidth = 0;
  let totalHeight = 0;

  for (const item of items) {
    const { product } = item;
    const missingData =
      product.packageWeightGrams === null ||
      product.packageLengthCm === null ||
      product.packageWidthCm === null ||
      product.packageHeightCm === null;
    if (missingData) {
      console.warn(
        `Product ${product.id} is missing package weight/dimensions -- using the default estimate for shipment creation.`
      );
    }

    const weightGrams = product.packageWeightGrams ?? PACKAGE_WEIGHT_KG * 1000;
    const lengthCm = product.packageLengthCm ?? PACKAGE_DIMENSIONS_CM.length;
    const widthCm = product.packageWidthCm ?? PACKAGE_DIMENSIONS_CM.breadth;
    const heightCm = product.packageHeightCm ?? PACKAGE_DIMENSIONS_CM.height;

    totalWeightGrams += weightGrams * item.quantity;
    maxLength = Math.max(maxLength, lengthCm);
    maxWidth = Math.max(maxWidth, widthCm);
    totalHeight += heightCm * item.quantity;
  }

  return {
    weightKg: totalWeightGrams / 1000,
    dimensionsCm: { length: maxLength, breadth: maxWidth, height: totalHeight },
  };
}

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

  const { weightKg, dimensionsCm } = aggregatePackageForItems(order.items);

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
    packageWeightKg: weightKg,
    dimensionsCm,
  });

  await db.order.update({
    where: { id: order.id },
    data: { shipmentId: shipment.shipmentId, awbCode: shipment.awbCode, courierName: shipment.courierName },
  });
}
