import { listDiscounts } from "../../../../lib/admin/discounts";
import { DiscountsClient } from "./discounts-client";

export default async function AdminDiscountsPage() {
  const discounts = await listDiscounts();
  return <DiscountsClient initialDiscounts={discounts} />;
}
