import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { VariantPicker, type VariantOption } from "./variant-picker";

const options: VariantOption[] = [
  { id: "v1", value: "5-6 years" },
  { id: "v2", value: "6-7 years" },
  { id: "v3", value: "7-8 years", available: false },
];

describe("VariantPicker", () => {
  it("renders every option and marks the selected one", () => {
    render(<VariantPicker label="Size" options={options} selectedId="v2" onSelect={vi.fn()} />);

    expect(screen.getByRole("radio", { name: "6-7 years" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "5-6 years" })).toHaveAttribute("aria-checked", "false");
  });

  it("calls onSelect with the clicked option's id", async () => {
    const onSelect = vi.fn();
    render(<VariantPicker label="Size" options={options} selectedId="v1" onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("radio", { name: "6-7 years" }));

    expect(onSelect).toHaveBeenCalledWith("v2");
  });

  it("disables an unavailable option", () => {
    render(<VariantPicker label="Size" options={options} selectedId="v1" onSelect={vi.fn()} />);

    expect(screen.getByRole("radio", { name: "7-8 years" })).toBeDisabled();
  });
});
