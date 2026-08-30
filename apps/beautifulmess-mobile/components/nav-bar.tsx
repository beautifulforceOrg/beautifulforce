import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@storeforge/ui-native";

// A simple always-available nav row -- the mobile analogue of the web
// site header's Shop/Search/Account/Cart links, since this app uses a
// plain Stack (no persistent tab bar).
export function NavBar({ cartCount }: { cartCount: number }) {
  const theme = useTheme();
  const linkStyle = { color: theme.colorBrand, fontFamily: theme.fontSans, fontWeight: "600" as const };

  return (
    <View style={styles.row}>
      <Link href="/shop" style={linkStyle}>
        Shop
      </Link>
      <Link href="/search" style={linkStyle}>
        Search
      </Link>
      <Link href="/account/login" style={linkStyle}>
        Account
      </Link>
      <Link href="/cart" style={linkStyle}>
        <Text style={linkStyle}>Cart ({cartCount})</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
