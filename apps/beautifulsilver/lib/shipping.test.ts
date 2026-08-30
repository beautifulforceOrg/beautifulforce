import { describe, expect, it } from "vitest";
import { shipToAddressFrom } from "./shipping";

const COMPLETE = {
  shipToName: "Asha",
  shipToEmail: "asha@example.com",
  shipToPhone: "9999999999",
  shipToAddressLine1: "12 MG Road",
  shipToAddressLine2: "Flat 4B",
  shipToCity: "Bengaluru",
  shipToState: "Karnataka",
  shipToPincode: "560001",
};

describe("shipToAddressFrom", () => {
  it("maps a fully-populated order onto Shiprocket's ShipToAddress shape", () => {
    expect(shipToAddressFrom(COMPLETE)).toEqual({
      name: "Asha",
      email: "asha@example.com",
      phone: "9999999999",
      addressLine1: "12 MG Road",
      addressLine2: "Flat 4B",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
    });
  });

  it("omits addressLine2 rather than sending null when it wasn't provided", () => {
    const result = shipToAddressFrom({ ...COMPLETE, shipToAddressLine2: null });
    expect(result?.addressLine2).toBeUndefined();
  });

  it("returns null for an order placed before shipping address was collected", () => {
    expect(shipToAddressFrom({ ...COMPLETE, shipToPincode: null })).toBeNull();
  });
});
