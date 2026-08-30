import { describe, expect, it } from "vitest";
import { shipToAddressFrom } from "./shipping";

const COMPLETE = {
  shipToName: "Priya",
  shipToEmail: "priya@example.com",
  shipToPhone: "9999999999",
  shipToAddressLine1: "221 Residency Road",
  shipToAddressLine2: "Flat 12",
  shipToCity: "Bengaluru",
  shipToState: "Karnataka",
  shipToPincode: "560025",
};

describe("shipToAddressFrom", () => {
  it("maps a fully-populated order onto Shiprocket's ShipToAddress shape", () => {
    expect(shipToAddressFrom(COMPLETE)).toEqual({
      name: "Priya",
      email: "priya@example.com",
      phone: "9999999999",
      addressLine1: "221 Residency Road",
      addressLine2: "Flat 12",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560025",
    });
  });

  it("omits addressLine2 rather than sending null when it wasn't provided", () => {
    const result = shipToAddressFrom({ ...COMPLETE, shipToAddressLine2: null });
    expect(result?.addressLine2).toBeUndefined();
  });

  it("returns null for a guest/mobile order placed without an address", () => {
    expect(shipToAddressFrom({ ...COMPLETE, shipToName: null })).toBeNull();
  });
});
