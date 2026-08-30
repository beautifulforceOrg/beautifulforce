// The interface every storefront's checkout/fulfillment code depends on.
// It exposes normalized shapes, not Shiprocket's raw response -- swapping
// couriers later means writing a new provider, not touching every caller.

export interface ShipToAddress {
  name: string;
  email: string;
  phone: string;
  // The Google Places Autocomplete-resolved line (street number + route).
  addressLine1: string;
  // Free text for anything the autocomplete doesn't capture -- flat/house/
  // villa number, floor, building name, a landmark.
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface ShipmentLineItem {
  name: string;
  sku: string;
  units: number;
  sellingPrice: number; // smallest currency unit (paise)
}

export interface PackageDimensionsCm {
  length: number;
  breadth: number;
  height: number;
}

export interface CreateShipmentInput {
  orderId: string;
  orderDate: string; // ISO date
  shipTo: ShipToAddress;
  items: ShipmentLineItem[];
  // Shiprocket requires a non-zero package weight/size per order. Every
  // business ships different things, so callers supply their own default
  // rather than this package guessing one -- see each storefront's own
  // lib/shipping.ts for its actual value.
  packageWeightKg: number;
  dimensionsCm: PackageDimensionsCm;
}

export interface Shipment {
  shipmentId: string;
  awbCode: string | null;
  courierName: string | null;
  status: string;
}

export interface TrackingUpdate {
  awbCode: string;
  status: string;
  checkpoints: { status: string; location: string; timestamp: string }[];
}

export interface ShippingProvider {
  createShipment(input: CreateShipmentInput): Promise<Shipment>;
  trackShipment(awbCode: string): Promise<TrackingUpdate>;
}
