// Pure, DB-free transform logic for scripts/import-legacy-customers.ts --
// separated out so the filtering/dedupe rules can be unit tested without
// a database. See that file for how this is actually used against a real
// Shopify customer export CSV.

export interface LegacyCustomerRow {
  "Customer ID": string;
  "First Name": string;
  "Last Name": string;
  Email: string;
  "Default Address Company": string;
  "Default Address Phone": string;
  Phone: string;
  "Total Orders": string;
}

export interface LegacyContact {
  /** Numeric part of the Shopify Customer ID, used for recency tie-breaks. */
  sourceId: number;
  name: string | null;
  email: string | null;
  /** Normalized phone: a plain 10-digit string for Indian numbers (matching
   *  this app's Address.phone convention), or "+<digits>" for anything
   *  that isn't a 12-digit +91/11-digit 0-prefixed/10-digit Indian number. */
  phone: string | null;
  totalOrders: number;
}

/** Store-owned domains and obvious test/service accounts to exclude entirely. */
const EXCLUDED_EMAIL_DOMAINS = ["thedesigncart.com"];

export function isExcludedRow(row: LegacyCustomerRow): boolean {
  const email = row.Email.trim().toLowerCase();
  if (email && EXCLUDED_EMAIL_DOMAINS.some((domain) => email.endsWith(`@${domain}`))) return true;

  const nameAndCompany = `${row["First Name"]} ${row["Last Name"]} ${row["Default Address Company"]}`.toLowerCase();
  if (nameAndCompany.includes("test")) return true;

  return false;
}

/**
 * Normalizes a raw Shopify phone value (leading `'` to defeat Excel,
 * optional `+`, optional country/trunk prefix) to a comparable form.
 * Returns null for anything that isn't a plausible phone number.
 */
export function normalizePhone(raw: string): string | null {
  const digits = raw.trim().replace(/^'/, "").replace(/\D/g, "");
  if (!digits) return null;

  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  if (digits.length === 10) return digits;
  // Not a recognizable Indian mobile number -- keep it as a full
  // international number rather than discarding real contact info.
  if (digits.length >= 8) return `+${digits}`;
  return null;
}

export function parseRow(row: LegacyCustomerRow): LegacyContact {
  const email = row.Email.trim().toLowerCase() || null;
  const rawPhone = row.Phone.trim() || row["Default Address Phone"].trim();
  const phone = rawPhone ? normalizePhone(rawPhone) : null;
  const name = `${row["First Name"].trim()} ${row["Last Name"].trim()}`.trim() || null;
  const sourceId = Number(row["Customer ID"].replace(/\D/g, ""));
  const totalOrders = Number(row["Total Orders"]) || 0;
  return { sourceId, name, email, phone, totalOrders };
}

export function hasContactInfo(contact: LegacyContact): boolean {
  return contact.email !== null || contact.phone !== null;
}

/**
 * Collapses contacts that share a normalized phone number (people who
 * signed up more than once) down to one -- the one with the most orders,
 * tie-broken by the highest source id (Shopify's customer ids increase
 * over time, so this favors the more recent signup). Contacts with no
 * phone can't collide this way and always pass through untouched.
 */
export function dedupeByPhone(contacts: LegacyContact[]): LegacyContact[] {
  const byPhone = new Map<string, LegacyContact>();
  const noPhone: LegacyContact[] = [];

  for (const contact of contacts) {
    if (!contact.phone) {
      noPhone.push(contact);
      continue;
    }
    const existing = byPhone.get(contact.phone);
    if (!existing) {
      byPhone.set(contact.phone, contact);
      continue;
    }
    const winner =
      contact.totalOrders !== existing.totalOrders
        ? contact.totalOrders > existing.totalOrders
          ? contact
          : existing
        : contact.sourceId > existing.sourceId
          ? contact
          : existing;
    byPhone.set(contact.phone, winner);
  }

  return [...byPhone.values(), ...noPhone];
}

export interface ImportAnalysis {
  totalRows: number;
  excludedTestOrOwnDomain: number;
  excludedNoContactInfo: number;
  duplicatePhoneRowsCollapsed: number;
  finalContacts: LegacyContact[];
}

/** Same filtering/dedupe as buildImportList, but reports counts at each stage for a dry-run report. */
export function analyzeRows(rows: LegacyCustomerRow[]): ImportAnalysis {
  const notExcluded = rows.filter((row) => !isExcludedRow(row));
  const withContactInfo = notExcluded.map(parseRow).filter(hasContactInfo);
  const finalContacts = dedupeByPhone(withContactInfo);

  return {
    totalRows: rows.length,
    excludedTestOrOwnDomain: rows.length - notExcluded.length,
    excludedNoContactInfo: notExcluded.length - withContactInfo.length,
    duplicatePhoneRowsCollapsed: withContactInfo.length - finalContacts.length,
    finalContacts,
  };
}

export function buildImportList(rows: LegacyCustomerRow[]): LegacyContact[] {
  return analyzeRows(rows).finalContacts;
}
