const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

export interface RazorpayCredentials {
  keyId: string;
  keySecret: string;
}

export interface CreateOrderInput {
  amount: number; // smallest currency unit (paise)
  currency?: string;
  receipt: string;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string | null;
  status: string;
}

export async function createRazorpayOrder(
  { amount, currency = "INR", receipt }: CreateOrderInput,
  credentials: RazorpayCredentials
): Promise<RazorpayOrder> {
  const auth = Buffer.from(`${credentials.keyId}:${credentials.keySecret}`).toString("base64");

  const response = await fetch(`${RAZORPAY_API_BASE}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({ amount, currency, receipt }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Razorpay order creation failed (${response.status}): ${body}`);
  }

  return (await response.json()) as RazorpayOrder;
}

export function createRazorpayOrderFromEnv(input: CreateOrderInput): Promise<RazorpayOrder> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set");
  }
  return createRazorpayOrder(input, { keyId, keySecret });
}
