import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders its label and fires onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Add to cart</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Add to cart" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("uses token-based classes, never a literal color", () => {
    render(<Button>Checkout</Button>);
    const button = screen.getByRole("button", { name: "Checkout" });

    expect(button.className).toContain("bg-brand");
    expect(button.className).not.toMatch(/#[0-9a-fA-F]{3,6}/);
  });

  it("supports an outline variant without changing behavior", async () => {
    const onClick = vi.fn();
    render(
      <Button variant="outline" onClick={onClick}>
        Cancel
      </Button>
    );
    const button = screen.getByRole("button", { name: "Cancel" });

    expect(button.className).toContain("border-border");
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
