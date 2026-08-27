import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProductGrid, type Product } from "./product-grid";

const products: Product[] = [
  { id: "p1", slug: "sample-item", name: "Sample Item", price: 5500 },
  { id: "p2", slug: "second-item", name: "Second Item", price: 1200 },
];

describe("ProductGrid", () => {
  it("renders every product with a formatted price", () => {
    render(<ProductGrid products={products} />);

    expect(screen.getByText("Sample Item")).toBeInTheDocument();
    expect(screen.getByText("₹55")).toBeInTheDocument();
    expect(screen.getByText("Second Item")).toBeInTheDocument();
    expect(screen.getByText("₹12")).toBeInTheDocument();
  });

  it("calls onAddToCart with the clicked product's id", async () => {
    const onAddToCart = vi.fn();
    render(<ProductGrid products={products} onAddToCart={onAddToCart} />);

    const addToCartButtons = screen.getAllByRole("button", { name: "Add to cart" });
    await userEvent.click(addToCartButtons[1]!);

    expect(onAddToCart).toHaveBeenCalledWith("p2");
  });
});
