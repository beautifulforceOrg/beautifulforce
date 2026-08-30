import { FlatList, View } from "react-native";
import { ProductCard } from "./product-card";

export interface GridProduct {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

export interface ProductGridProps {
  products: GridProduct[];
  onSelectProduct: (id: string) => void;
  numColumns?: number;
}

export function ProductGrid({ products, onSelectProduct, numColumns = 2 }: ProductGridProps) {
  return (
    <FlatList
      style={{ flex: 1 }}
      data={products}
      numColumns={numColumns}
      keyExtractor={(item) => item.id}
      columnWrapperStyle={numColumns > 1 ? { gap: 12 } : undefined}
      contentContainerStyle={{ gap: 16 }}
      renderItem={({ item }) => (
        <View style={{ flex: 1 }}>
          <ProductCard
            name={item.name}
            price={item.price}
            imageUrl={item.imageUrl}
            onPress={() => onSelectProduct(item.id)}
          />
        </View>
      )}
    />
  );
}
