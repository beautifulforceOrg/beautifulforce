import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CheckoutSteps } from "./checkout-steps";

describe("CheckoutSteps", () => {
  it("marks the current step with aria-current", () => {
    render(<CheckoutSteps steps={["Cart", "Shipping", "Payment", "Confirmation"]} currentStep={1} />);

    const current = screen.getByText("Shipping").closest("li");
    expect(current).toHaveAttribute("aria-current", "step");

    const notCurrent = screen.getByText("Cart").closest("li");
    expect(notCurrent).not.toHaveAttribute("aria-current");
  });

  it("renders every step label in order", () => {
    render(<CheckoutSteps steps={["Cart", "Shipping", "Payment"]} currentStep={0} />);
    const items = screen.getAllByRole("listitem").map((el) => el.textContent);

    expect(items).toEqual(["1Cart", "2Shipping", "3Payment"]);
  });
});
