import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator } from "react-native";
import { Button, useTheme } from "@storeforge/ui-native";
import type { Collection } from "@storeforge/api-client";
import { Screen } from "../../components/screen";
import { apiClient } from "../../lib/api-client";

// The mobile equivalent of apps/beautifulmess/app/shop/page.tsx -- a
// plain list of collections, each linking to its own product grid.
export default function ShopIndexScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient.getCollections().then((fetched) => {
      if (!cancelled) setCollections(fetched);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!collections) {
    return (
      <Screen scroll={false}>
        <ActivityIndicator color={theme.colorBrand} />
      </Screen>
    );
  }

  return (
    <Screen>
      {collections.map((collection) => (
        <Button key={collection.id} label={collection.name} variant="outline" onPress={() => router.push(`/shop/${collection.slug}`)} />
      ))}
    </Screen>
  );
}
