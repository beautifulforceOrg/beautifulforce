import { useState } from "react";
import { useRouter } from "expo-router";
import { Text, TextInput, View } from "react-native";
import { ProductGrid, useTheme } from "@storeforge/ui-native";
import type { ProductSummary } from "@storeforge/api-client";
import { apiClient } from "../lib/api-client";

export default function SearchScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSummary[] | null>(null);

  function handleSearch(text: string) {
    setQuery(text);
    if (!text.trim()) {
      setResults(null);
      return;
    }
    apiClient.search(text).then(setResults);
  }

  function handleSelectProduct(productId: string) {
    const product = results?.find((p) => p.id === productId);
    if (product) router.push(`/products/${product.slug}`);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colorBackground }}>
      <TextInput
        placeholder="Search products"
        value={query}
        onChangeText={handleSearch}
        style={{ borderWidth: 1, borderColor: theme.colorBorder, color: theme.colorForeground, borderRadius: 8, margin: 16, padding: 12 }}
      />
      {results === null ? (
        <Text style={{ color: theme.colorForeground, fontFamily: theme.fontSans, paddingHorizontal: 16 }}>
          Type a product name above to search.
        </Text>
      ) : results.length === 0 ? (
        <Text style={{ color: theme.colorForeground, fontFamily: theme.fontSans, paddingHorizontal: 16 }}>
          No products found for &quot;{query}&quot;
        </Text>
      ) : (
        <ProductGrid products={results} onSelectProduct={handleSelectProduct} />
      )}
    </View>
  );
}
