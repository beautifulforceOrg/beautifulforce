import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Text } from "react-native";
import { ProductGrid, useTheme } from "@storeforge/ui-native";
import type { CollectionDetail } from "@storeforge/api-client";
import { apiClient } from "../../lib/api-client";

export default function CollectionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { collectionSlug } = useLocalSearchParams<{ collectionSlug: string }>();
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .getCollection(collectionSlug)
      .then((fetched) => {
        if (!cancelled) setCollection(fetched);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [collectionSlug]);

  if (notFound) {
    return <Text style={{ color: theme.colorForeground, padding: 16 }}>Collection not found.</Text>;
  }
  if (!collection) {
    return <ActivityIndicator color={theme.colorBrand} style={{ marginTop: 32 }} />;
  }

  function handleSelectProduct(productId: string) {
    const product = collection?.products.find((p) => p.id === productId);
    if (product) router.push(`/products/${product.slug}`);
  }

  return <ProductGrid products={collection.products} onSelectProduct={handleSelectProduct} />;
}
