import type {
  CreateShipmentInput,
  Shipment,
  ShippingProvider,
  TrackingUpdate,
} from "./shipping-provider";

const SHIPROCKET_API_BASE = "https://apiv2.shiprocket.in/v1/external";

export interface ShiprocketCredentials {
  email: string;
  password: string;
  // The pickup address's nickname exactly as configured in the Shiprocket
  // dashboard (Settings -> Pickup Addresses) -- an account-level setting,
  // not something a shopper provides, and Shiprocket's API rejects an
  // order without it.
  pickupLocation: string;
}

async function getAuthToken(credentials: ShiprocketCredentials): Promise<string> {
  const response = await fetch(`${SHIPROCKET_API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Shiprocket authentication failed (${response.status}): ${body}`);
  }

  const { token } = (await response.json()) as { token: string };
  return token;
}

async function shiprocketFetch(
  path: string,
  token: string,
  init: RequestInit = {}
): Promise<unknown> {
  const response = await fetch(`${SHIPROCKET_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Shiprocket request to ${path} failed (${response.status}): ${body}`);
  }

  return response.json();
}

export function createShiprocketProvider(credentials: ShiprocketCredentials): ShippingProvider {
  return {
    async createShipment(input: CreateShipmentInput): Promise<Shipment> {
      const token = await getAuthToken(credentials);
      const subTotal = input.items.reduce((sum, item) => sum + (item.sellingPrice / 100) * item.units, 0);

      const raw = (await shiprocketFetch("/orders/create/adhoc", token, {
        method: "POST",
        body: JSON.stringify({
          order_id: input.orderId,
          order_date: input.orderDate,
          pickup_location: credentials.pickupLocation,
          // Every order in this repo is paid up front via Razorpay before
          // a shipment is ever created -- see each app's
          // app/api/webhooks/razorpay/route.ts.
          payment_method: "Prepaid",
          billing_customer_name: input.shipTo.name,
          billing_email: input.shipTo.email,
          billing_phone: input.shipTo.phone,
          billing_address: input.shipTo.addressLine1,
          billing_address_2: input.shipTo.addressLine2 ?? "",
          billing_city: input.shipTo.city,
          billing_state: input.shipTo.state,
          billing_pincode: input.shipTo.pincode,
          billing_country: "India",
          // We only ever collect one address -- tell Shiprocket to ship to
          // the billing address rather than expecting a separate one.
          shipping_is_billing: true,
          order_items: input.items.map((item) => ({
            name: item.name,
            sku: item.sku,
            units: item.units,
            selling_price: item.sellingPrice / 100,
          })),
          sub_total: subTotal,
          length: input.dimensionsCm.length,
          breadth: input.dimensionsCm.breadth,
          height: input.dimensionsCm.height,
          weight: input.packageWeightKg,
        }),
      })) as { shipment_id: number; awb_code?: string; courier_name?: string; status: string };

      return {
        shipmentId: String(raw.shipment_id),
        awbCode: raw.awb_code ?? null,
        courierName: raw.courier_name ?? null,
        status: raw.status,
      };
    },

    async trackShipment(awbCode: string): Promise<TrackingUpdate> {
      const token = await getAuthToken(credentials);
      const raw = (await shiprocketFetch(`/courier/track/awb/${awbCode}`, token)) as {
        tracking_data: {
          shipment_status: string;
          shipment_track_activities: { status: string; location: string; date: string }[];
        };
      };

      return {
        awbCode,
        status: raw.tracking_data.shipment_status,
        checkpoints: raw.tracking_data.shipment_track_activities.map((activity) => ({
          status: activity.status,
          location: activity.location,
          timestamp: activity.date,
        })),
      };
    },
  };
}

export function createShiprocketProviderFromEnv(): ShippingProvider {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION;
  if (!email || !password || !pickupLocation) {
    throw new Error("SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD, and SHIPROCKET_PICKUP_LOCATION must be set");
  }
  return createShiprocketProvider({ email, password, pickupLocation });
}
