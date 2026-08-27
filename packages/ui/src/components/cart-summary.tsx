import { formatPrice } from "../lib/format-price";
import { Button } from "./button";

export interface CartLine {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  // A selected option's label (a size, a denomination, ...), shown under
  // the name when a storefront's product has variants. Optional so a
  // single-variant catalog's lines look exactly as before.
  variantLabel?: string;
}

export function CartItem({
  line,
  onIncrement,
  onDecrement,
  onRemove,
}: {
  line: CartLine;
  onIncrement?: (productId: string) => void;
  onDecrement?: (productId: string) => void;
  onRemove?: (productId: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 text-foreground">
      <div>
        <p className="font-medium">{line.name}</p>
        {line.variantLabel ? <p className="text-muted text-sm">{line.variantLabel}</p> : null}
        <p className="text-muted text-sm">{formatPrice(line.price)} each</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => onDecrement?.(line.productId)} aria-label={`Decrease ${line.name} quantity`}>
          -
        </Button>
        <span aria-label={`${line.name} quantity`}>{line.quantity}</span>
        <Button variant="outline" onClick={() => onIncrement?.(line.productId)} aria-label={`Increase ${line.name} quantity`}>
          +
        </Button>
      </div>
      <p className="w-24 text-right font-medium">{formatPrice(line.price * line.quantity)}</p>
      <Button variant="ghost" onClick={() => onRemove?.(line.productId)}>
        Remove
      </Button>
    </div>
  );
}

export function CartSummary({
  lines,
  onIncrement,
  onDecrement,
  onRemove,
}: {
  lines: CartLine[];
  onIncrement?: (productId: string) => void;
  onDecrement?: (productId: string) => void;
  onRemove?: (productId: string) => void;
}) {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  return (
    <div className="flex flex-col gap-2">
      {lines.map((line) => (
        <CartItem
          key={line.productId}
          line={line}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
          onRemove={onRemove}
        />
      ))}
      <div className="flex items-center justify-between pt-3 font-semibold text-foreground">
        <span>Subtotal</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
    </div>
  );
}
