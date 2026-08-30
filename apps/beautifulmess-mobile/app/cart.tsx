import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Text, View } from "react-native";
import { Button, formatPrice, useTheme } from "@storeforge/ui-native";
import { Screen } from "../components/screen";
import { apiClient } from "../lib/api-client";
import { getApiBaseUrl } from "../lib/api-base-url";
import { useCart } from "../lib/cart-context";

export default function CartScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { lines, increment, decrement, remove, clear } = useCart();
  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  async function handleCheckout() {
    const orderLines = lines.map((line) => ({ productId: line.productId, price: line.price, quantity: line.quantity }));
    const result = await apiClient.placeOrder(orderLines);

    if (!result.isMocked) {
      // No native Razorpay SDK usable from Expo Go -- hand off to
      // Razorpay's own hosted Checkout.js in the system browser. The real
      // webhook is the authoritative source for marking the order PAID;
      // the order screen just polls for that once the shopper returns.
      await WebBrowser.openBrowserAsync(`${getApiBaseUrl()}/checkout/mobile-pay/${result.gatewayOrderId}?amount=${result.amount}`);
    }

    clear();
    router.replace(`/orders/${result.gatewayOrderId}`);
  }

  const textStyle = { color: theme.colorForeground, fontFamily: theme.fontSans };

  return (
    <Screen>
      {lines.length === 0 ? <Text style={textStyle}>Your cart is empty.</Text> : null}
      {lines.map((line) => (
        <View key={line.productId} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={[textStyle, { flex: 1 }]}>
            {line.name} x{line.quantity}
          </Text>
          <Text style={textStyle}>{formatPrice(line.price * line.quantity)}</Text>
          <Button label="-" variant="outline" onPress={() => decrement(line.productId)} />
          <Button label="+" variant="outline" onPress={() => increment(line.productId)} />
          <Button label="Remove" variant="outline" onPress={() => remove(line.productId)} />
        </View>
      ))}
      <Text style={[textStyle, { fontWeight: "700" }]}>Total: {formatPrice(total)}</Text>
      <Button label="Checkout" onPress={handleCheckout} disabled={lines.length === 0} />
    </Screen>
  );
}
