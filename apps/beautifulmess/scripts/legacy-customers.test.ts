import { describe, expect, it } from "vitest";
import {
  buildImportList,
  dedupeByPhone,
  hasContactInfo,
  isExcludedRow,
  type LegacyContact,
  type LegacyCustomerRow,
  normalizePhone,
  parseRow,
} from "./legacy-customers";

function row(overrides: Partial<LegacyCustomerRow>): LegacyCustomerRow {
  return {
    "Customer ID": "'1000",
    "First Name": "",
    "Last Name": "",
    Email: "",
    "Default Address Company": "",
    "Default Address Phone": "",
    Phone: "",
    "Total Orders": "0",
    ...overrides,
  };
}

function contact(overrides: Partial<LegacyContact>): LegacyContact {
  return { sourceId: 1, name: null, email: null, phone: null, totalOrders: 0, ...overrides };
}

describe("isExcludedRow", () => {
  it("excludes the store's own domain", () => {
    expect(isExcludedRow(row({ Email: "services@thedesigncart.com" }))).toBe(true);
  });

  it("is case-insensitive on the domain", () => {
    expect(isExcludedRow(row({ Email: "Services@TheDesignCart.COM" }))).toBe(true);
  });

  it("excludes a name containing 'test'", () => {
    expect(isExcludedRow(row({ "First Name": "Test", "Last Name": "Account" }))).toBe(true);
  });

  it("excludes a company containing 'test'", () => {
    expect(isExcludedRow(row({ "Default Address Company": "Test Co" }))).toBe(true);
  });

  it("keeps a normal customer", () => {
    expect(isExcludedRow(row({ Email: "jane@gmail.com", "First Name": "Jane" }))).toBe(false);
  });
});

describe("normalizePhone", () => {
  it("strips a +91 country code to a 10-digit number", () => {
    expect(normalizePhone("'+919164605677")).toBe("9164605677");
  });

  it("strips a leading 0 trunk prefix", () => {
    expect(normalizePhone("09916346438")).toBe("9916346438");
  });

  it("keeps a plain 10-digit number as-is", () => {
    expect(normalizePhone("'9377711145")).toBe("9377711145");
  });

  it("keeps a non-Indian number in +<digits> form", () => {
    expect(normalizePhone("'+16692489935")).toBe("+16692489935");
  });

  it("returns null for an empty value", () => {
    expect(normalizePhone("")).toBeNull();
  });

  it("returns null for a too-short garbage value", () => {
    expect(normalizePhone("123")).toBeNull();
  });
});

describe("parseRow", () => {
  it("combines first and last name, lowercases email, prefers Phone over Default Address Phone", () => {
    const result = parseRow(
      row({
        "Customer ID": "'7171159654596",
        "First Name": "Jane",
        "Last Name": "Doe",
        Email: "Jane@Example.com",
        Phone: "'+919164605677",
        "Default Address Phone": "'9999999999",
        "Total Orders": "3",
      })
    );
    expect(result).toEqual({
      sourceId: 7171159654596,
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "9164605677",
      totalOrders: 3,
    });
  });

  it("falls back to Default Address Phone when Phone is blank", () => {
    const result = parseRow(row({ "Default Address Phone": "'9999999999" }));
    expect(result.phone).toBe("9999999999");
  });

  it("returns null name/email/phone for blank fields", () => {
    const result = parseRow(row({}));
    expect(result).toEqual({ sourceId: 1000, name: null, email: null, phone: null, totalOrders: 0 });
  });
});

describe("hasContactInfo", () => {
  it("is true with only an email", () => {
    expect(hasContactInfo(contact({ email: "a@example.com" }))).toBe(true);
  });

  it("is true with only a phone", () => {
    expect(hasContactInfo(contact({ phone: "9876543210" }))).toBe(true);
  });

  it("is false with neither", () => {
    expect(hasContactInfo(contact({}))).toBe(false);
  });
});

describe("dedupeByPhone", () => {
  it("keeps the contact with more orders when phones match", () => {
    const a = contact({ sourceId: 1, phone: "9876543210", totalOrders: 0, name: "A" });
    const b = contact({ sourceId: 2, phone: "9876543210", totalOrders: 3, name: "B" });
    const result = dedupeByPhone([a, b]);
    expect(result).toEqual([b]);
  });

  it("breaks a tie in order count by the higher (more recent) source id", () => {
    const a = contact({ sourceId: 1, phone: "9876543210", totalOrders: 0, name: "A" });
    const b = contact({ sourceId: 2, phone: "9876543210", totalOrders: 0, name: "B" });
    const result = dedupeByPhone([a, b]);
    expect(result).toEqual([b]);
  });

  it("leaves phone-less contacts untouched, even if there are several", () => {
    const a = contact({ sourceId: 1, phone: null, email: "a@example.com" });
    const b = contact({ sourceId: 2, phone: null, email: "b@example.com" });
    const result = dedupeByPhone([a, b]);
    expect(result).toHaveLength(2);
  });

  it("leaves unique phones untouched", () => {
    const a = contact({ sourceId: 1, phone: "9876543210" });
    const b = contact({ sourceId: 2, phone: "9876543211" });
    expect(dedupeByPhone([a, b])).toHaveLength(2);
  });
});

describe("buildImportList", () => {
  it("excludes test/own-domain rows, drops no-contact rows, and dedupes by phone", () => {
    const rows: LegacyCustomerRow[] = [
      row({ "Customer ID": "'1", Email: "services@thedesigncart.com" }),
      row({ "Customer ID": "'2", "First Name": "Test" }),
      row({ "Customer ID": "'3" }), // no email or phone
      row({ "Customer ID": "'4", Email: "keep@example.com" }),
      row({ "Customer ID": "'5", Phone: "'9876543210", "Total Orders": "0" }),
      row({ "Customer ID": "'6", Phone: "'9876543210", "Total Orders": "2" }),
    ];
    const result = buildImportList(rows);
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.sourceId).sort()).toEqual([4, 6]);
  });
});
