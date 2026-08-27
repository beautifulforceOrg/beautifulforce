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
      const raw = (await shiprocketFetch("/orders/create/adhoc", token, {
        method: "POST",
        body: JSON.stringify({
          order_id: input.orderId,
          order_date: input.orderDate,
          billing_customer_name: input.shipTo.name,
          billing_address: input.shipTo.addressLine1,
          billing_city: input.shipTo.city,
          billing_state: input.shipTo.state,
          billing_pincode: input.shipTo.pincode,
          billing_phone: input.shipTo.phone,
          order_items: input.items.map((item) => ({
            name: item.name,
            sku: item.sku,
            units: item.units,
            selling_price: item.sellingPrice / 100,
          })),
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
  if (!email || !password) {
    throw new Error("SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD must be set");
  }
  return createShiprocketProvider({ email, password });
}
