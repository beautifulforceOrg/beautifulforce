import { notFound } from "next/navigation";
import { getOrderStatus } from "../../../../lib/checkout";
import { MobilePayClient } from "./mobile-pay-client";

export default async function MobilePayPage({
  params,
  searchParams,
}: {
  params: Promise<{ gatewayOrderId: string }>;
  searchParams: Promise<{ amount?: string }>;
}) {
  const { gatewayOrderId } = await params;
  const { amount } = await searchParams;
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  const order = await getOrderStatus(gatewayOrderId);
  if (!order || !amount || !keyId) {
    notFound();
  }

  return <MobilePayClient gatewayOrderId={gatewayOrderId} amount={Number(amount)} keyId={keyId} />;
}
