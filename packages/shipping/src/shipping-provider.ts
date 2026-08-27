// The interface every storefront's checkout/fulfillment code depends on.
// It exposes normalized shapes, not Shiprocket's raw response -- swapping
// couriers later means writing a new provider, not touching every caller.

export interface ShipToAddress {
  name: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

export interface ShipmentLineItem {
  name: string;
  sku: string;
  units: number;
  sellingPrice: number; // smallest currency unit (paise)
}

export interface CreateShipmentInput {
  orderId: string;
  orderDate: string; // ISO date
  shipTo: ShipToAddress;
  items: ShipmentLineItem[];
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
