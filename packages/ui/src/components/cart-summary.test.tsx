import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CartSummary, type CartLine } from "./cart-summary";

const lines: CartLine[] = [
  { productId: "p1", name: "Sample Item", price: 5500, quantity: 1 },
  { productId: "p2", name: "Second Item", price: 1200, quantity: 2 },
];

describe("CartSummary", () => {
  it("computes the subtotal across all lines", () => {
    render(<CartSummary lines={lines} />);

    // 5500*1 + 1200*2 = 7900 paise = ₹79
    expect(screen.getByText("₹79")).toBeInTheDocument();
  });

  it("calls onIncrement/onDecrement with the right product id", async () => {
    const onIncrement = vi.fn();
    const onDecrement = vi.fn();
    render(<CartSummary lines={lines} onIncrement={onIncrement} onDecrement={onDecrement} />);

    await userEvent.click(screen.getByLabelText("Increase Second Item quantity"));
    await userEvent.click(screen.getByLabelText("Decrease Sample Item quantity"));

    expect(onIncrement).toHaveBeenCalledWith("p2");
    expect(onDecrement).toHaveBeenCalledWith("p1");
  });

  it("calls onRemove with the right product id", async () => {
    const onRemove = vi.fn();
    render(<CartSummary lines={lines} onRemove={onRemove} />);

    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    await userEvent.click(removeButtons[0]!);

    expect(onRemove).toHaveBeenCalledWith("p1");
  });
});
