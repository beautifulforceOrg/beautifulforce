import { describe, expect, it, vi } from "vitest";
import { PACKAGE_WEIGHT_KG, PACKAGE_DIMENSIONS_CM, aggregatePackageForItems, shipToAddressFrom } from "./shipping";

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

describe("aggregatePackageForItems", () => {
  it("sums weight (accounting for quantity) and takes the widest length/width across different products", () => {
    const result = aggregatePackageForItems([
      {
        quantity: 2,
        product: { id: "p1", packageWeightGrams: 100, packageLengthCm: 10, packageWidthCm: 8, packageHeightCm: 2 },
      },
      {
        quantity: 1,
        product: { id: "p2", packageWeightGrams: 500, packageLengthCm: 30, packageWidthCm: 5, packageHeightCm: 10 },
      },
    ]);

    // (100*2 + 500*1) grams = 700g = 0.7kg
    expect(result.weightKg).toBeCloseTo(0.7);
    // widest length (30) and width (8) across the two products
    expect(result.dimensionsCm.length).toBe(30);
    expect(result.dimensionsCm.breadth).toBe(8);
    // heights summed across quantity: 2*2 + 1*10 = 14
    expect(result.dimensionsCm.height).toBe(14);
  });

  it("falls back to the flat default for a product missing package data, and logs it", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const result = aggregatePackageForItems([
      {
        quantity: 1,
        product: { id: "p1", packageWeightGrams: null, packageLengthCm: null, packageWidthCm: null, packageHeightCm: null },
      },
    ]);

    expect(result.weightKg).toBeCloseTo(PACKAGE_WEIGHT_KG);
    expect(result.dimensionsCm).toEqual(PACKAGE_DIMENSIONS_CM);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("p1"));

    warnSpy.mockRestore();
  });
});
