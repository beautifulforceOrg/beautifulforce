import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text } from "react-native";
import { Button, useTheme } from "@storeforge/ui-native";
import { Screen } from "../../components/screen";
import { apiClient } from "../../lib/api-client";

export default function OrderStatusScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { gatewayOrderId } = useLocalSearchParams<{ gatewayOrderId: string }>();
  const [status, setStatus] = useState("Checking...");

  useEffect(() => {
    let cancelled = false;

    function poll() {
      apiClient
        .getOrderStatus(gatewayOrderId)
        .then((order) => {
          if (!cancelled) setStatus(order.status);
        })
        .catch(() => {
          if (!cancelled) setStatus("Unknown");
        });
    }

    poll();
    // The Razorpay webhook (not this app) is the authoritative source for
    // marking the order PAID -- this just re-checks periodically so the
    // status updates once it arrives, same as the web order page's
    // eventual-consistency model.
    const interval = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [gatewayOrderId]);

  const textStyle = { color: theme.colorForeground, fontFamily: theme.fontSans };

  return (
    <Screen>
      <Text style={textStyle}>Order {gatewayOrderId}</Text>
      <Text style={[textStyle, { fontWeight: "700" }]}>Status: {status}</Text>
      <Button label="Back to shop" onPress={() => router.replace("/")} />
    </Screen>
  );
}
