import { getSessionCustomerId } from "../../lib/auth";
import { CartClient } from "./cart-client";

export default async function CartPage() {
  const isLoggedIn = Boolean(await getSessionCustomerId());
  return <CartClient isLoggedIn={isLoggedIn} />;
}
