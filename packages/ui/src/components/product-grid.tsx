import { formatPrice } from "../lib/format-price";
import { Button } from "./button";

export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  imageUrl?: string;
}

export function ProductCard({
  product,
  onAddToCart,
}: {
  product: Product;
  onAddToCart?: (productId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[var(--sf-radius,0.5rem)] border border-border bg-background p-4 text-foreground">
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.name} className="aspect-square w-full rounded object-cover" />
      ) : null}
      <span className="font-medium">{product.name}</span>
      <span className="text-muted">{formatPrice(product.price)}</span>
      <Button onClick={() => onAddToCart?.(product.id)}>Add to cart</Button>
    </div>
  );
}

export function ProductGrid({
  products,
  onAddToCart,
}: {
  products: Product[];
  onAddToCart?: (productId: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
}
