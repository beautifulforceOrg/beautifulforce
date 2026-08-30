import { Image, Pressable, Text, View, StyleSheet } from "react-native";
import { useTheme } from "../theme/theme-provider";
import { formatPrice } from "../lib/format-price";

export interface ProductCardProps {
  name: string;
  price: number; // paise, matches packages/payments' convention
  imageUrl?: string;
  onPress: () => void;
}

export function ProductCard({ name, price, imageUrl, onPress }: ProductCardProps) {
  const theme = useTheme();

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={[styles.imageWrap, { backgroundColor: theme.colorMuted, borderRadius: theme.radius ?? 8 }]}>
        {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" /> : null}
      </View>
      <Text style={{ color: theme.colorBrand, fontFamily: theme.fontSans, marginTop: 8 }} numberOfLines={2}>
        {name}
      </Text>
      <Text style={{ color: theme.colorForeground, fontFamily: theme.fontSans, marginTop: 2 }}>
        {formatPrice(price)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  imageWrap: {
    aspectRatio: 3 / 4,
    width: "100%",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
