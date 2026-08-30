import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AddressForm, type AddressValue } from "./address-form";

const EMPTY: AddressValue = {
  name: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
};

describe("AddressForm", () => {
  it("renders every field", () => {
    render(<AddressForm value={EMPTY} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone number")).toBeInTheDocument();
    expect(screen.getByLabelText("Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Flat, house number, floor, or landmark")).toBeInTheDocument();
    expect(screen.getByLabelText("City")).toBeInTheDocument();
    expect(screen.getByLabelText("State")).toBeInTheDocument();
    expect(screen.getByLabelText("Pincode")).toBeInTheDocument();
  });

  it("reports a field edit via onChange without touching other fields", async () => {
    const onChange = vi.fn();
    render(<AddressForm value={{ ...EMPTY, name: "Asha" }} onChange={onChange} />);

    await userEvent.type(screen.getByLabelText("City"), "B");

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, name: "Asha", city: "B" });
  });

  it("works as a plain text field with no Google Maps key configured", async () => {
    const onChange = vi.fn();
    render(<AddressForm value={EMPTY} onChange={onChange} />);

    await userEvent.type(screen.getByLabelText("Address"), "1");

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, addressLine1: "1" });
  });

  it("does not crash when a Google Maps key is provided but the script never loads (e.g. offline)", () => {
    expect(() => render(<AddressForm value={EMPTY} onChange={vi.fn()} googleMapsApiKey="test-key" />)).not.toThrow();
  });
});
