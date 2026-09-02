import { redirect } from "next/navigation";
import { listAddresses } from "../../../lib/account-actions";
import { getSessionCustomerId } from "../../../lib/auth";
import { AddressesForm } from "./addresses-form";

export default async function AccountAddressesPage() {
  const customerId = await getSessionCustomerId();
  if (!customerId) redirect("/account/login");

  const addresses = await listAddresses();
  return <AddressesForm initialAddresses={addresses} />;
}
