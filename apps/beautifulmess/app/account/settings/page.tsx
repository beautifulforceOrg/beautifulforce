import { redirect } from "next/navigation";
import { getSessionCustomerId } from "../../../lib/auth";
import { AccountSettingsForm } from "./settings-form";

export default async function AccountSettingsPage() {
  const customerId = await getSessionCustomerId();
  if (!customerId) redirect("/account/login");

  return <AccountSettingsForm />;
}
