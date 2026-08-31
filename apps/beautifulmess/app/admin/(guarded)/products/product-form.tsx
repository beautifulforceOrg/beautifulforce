"use client";

import { useState, useTransition } from "react";
import { useToast } from "@storeforge/ui";
import type { ProductInput, AdminActionResult } from "../../../../lib/admin/products";

export type ProductFormValue = ProductInput;

const EMPTY: ProductFormValue = {
  slug: "",
  name: "",
  description: "",
  price: 0,
  sku: "",
  barcode: "",
  brand: "",
  weightGrams: null,
  lengthCm: null,
  widthCm: null,
  heightCm: null,
  packageWeightGrams: null,
  packageLengthCm: null,
  packageWidthCm: null,
  packageHeightCm: null,
  mrp: null,
  hsnCode: "",
  gstRatePercent: null,
  countryOfOrigin: "India",
  manufacturerDetails: "",
  material: "",
  careInstructions: "",
  tags: "",
  isPublished: true,
  lowStockThreshold: null,
};

const inputClassName =
  "w-full rounded-[var(--sf-radius,0.5rem)] border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted";
const labelClassName = "mb-1 block text-xs font-medium uppercase text-muted";

function numberOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function ProductForm({
  initialValue,
  onSubmit,
  submitLabel,
}: {
  initialValue?: Partial<ProductFormValue>;
  onSubmit: (value: ProductFormValue) => Promise<AdminActionResult<unknown>>;
  submitLabel: string;
}) {
  const [value, setValue] = useState<ProductFormValue>({ ...EMPTY, ...initialValue });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();
  const { showToast } = useToast();

  function set<K extends keyof ProductFormValue>(key: K, next: ProductFormValue[K]) {
    setValue((prev) => ({ ...prev, [key]: next }));
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await onSubmit(value);
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
      } else {
        showToast("Saved.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h3 className="mb-3 font-heading text-lg uppercase text-foreground">Basics</h3>
        <div className="grid grid-cols-2 gap-4">
          <label>
            <span className={labelClassName}>Name</span>
            <input className={inputClassName} value={value.name} onChange={(e) => set("name", e.target.value)} />
          </label>
          <label>
            <span className={labelClassName}>Slug</span>
            <input className={inputClassName} value={value.slug} onChange={(e) => set("slug", e.target.value)} />
          </label>
          <label>
            <span className={labelClassName}>Selling price (paise)</span>
            <input
              type="number"
              className={inputClassName}
              value={value.price}
              onChange={(e) => set("price", Number(e.target.value))}
            />
          </label>
          <label>
            <span className={labelClassName}>MRP (paise)</span>
            <input
              type="number"
              className={inputClassName}
              value={value.mrp ?? ""}
              onChange={(e) => set("mrp", numberOrNull(e.target.value))}
            />
          </label>
          <label className="col-span-2">
            <span className={labelClassName}>Description (HTML)</span>
            <textarea
              className={inputClassName}
              rows={4}
              value={value.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.isPublished ?? true}
              onChange={(e) => set("isPublished", e.target.checked)}
            />
            <span className="text-sm text-foreground">Published (visible on the storefront)</span>
          </label>
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-heading text-lg uppercase text-foreground">Identifiers</h3>
        <div className="grid grid-cols-3 gap-4">
          <label>
            <span className={labelClassName}>SKU</span>
            <input className={inputClassName} value={value.sku ?? ""} onChange={(e) => set("sku", e.target.value)} />
          </label>
          <label>
            <span className={labelClassName}>Barcode (UPC/EAN/GTIN)</span>
            <input
              className={inputClassName}
              value={value.barcode ?? ""}
              onChange={(e) => set("barcode", e.target.value)}
            />
          </label>
          <label>
            <span className={labelClassName}>Brand</span>
            <input className={inputClassName} value={value.brand ?? ""} onChange={(e) => set("brand", e.target.value)} />
          </label>
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-heading text-lg uppercase text-foreground">Physical & shipping</h3>
        <div className="grid grid-cols-4 gap-4">
          <label>
            <span className={labelClassName}>Weight (g)</span>
            <input
              type="number"
              className={inputClassName}
              value={value.weightGrams ?? ""}
              onChange={(e) => set("weightGrams", numberOrNull(e.target.value))}
            />
          </label>
          <label>
            <span className={labelClassName}>Length (cm)</span>
            <input
              type="number"
              className={inputClassName}
              value={value.lengthCm ?? ""}
              onChange={(e) => set("lengthCm", numberOrNull(e.target.value))}
            />
          </label>
          <label>
            <span className={labelClassName}>Width (cm)</span>
            <input
              type="number"
              className={inputClassName}
              value={value.widthCm ?? ""}
              onChange={(e) => set("widthCm", numberOrNull(e.target.value))}
            />
          </label>
          <label>
            <span className={labelClassName}>Height (cm)</span>
            <input
              type="number"
              className={inputClassName}
              value={value.heightCm ?? ""}
              onChange={(e) => set("heightCm", numberOrNull(e.target.value))}
            />
          </label>
          <label>
            <span className={labelClassName}>Package weight (g)</span>
            <input
              type="number"
              className={inputClassName}
              value={value.packageWeightGrams ?? ""}
              onChange={(e) => set("packageWeightGrams", numberOrNull(e.target.value))}
            />
          </label>
          <label>
            <span className={labelClassName}>Package length (cm)</span>
            <input
              type="number"
              className={inputClassName}
              value={value.packageLengthCm ?? ""}
              onChange={(e) => set("packageLengthCm", numberOrNull(e.target.value))}
            />
          </label>
          <label>
            <span className={labelClassName}>Package width (cm)</span>
            <input
              type="number"
              className={inputClassName}
              value={value.packageWidthCm ?? ""}
              onChange={(e) => set("packageWidthCm", numberOrNull(e.target.value))}
            />
          </label>
          <label>
            <span className={labelClassName}>Package height (cm)</span>
            <input
              type="number"
              className={inputClassName}
              value={value.packageHeightCm ?? ""}
              onChange={(e) => set("packageHeightCm", numberOrNull(e.target.value))}
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-muted">
          Package weight/dimensions are what gets sent to Shiprocket when an order containing this product ships.
        </p>
      </section>

      <section>
        <h3 className="mb-3 font-heading text-lg uppercase text-foreground">Compliance</h3>
        <div className="grid grid-cols-2 gap-4">
          <label>
            <span className={labelClassName}>HSN code</span>
            <input className={inputClassName} value={value.hsnCode ?? ""} onChange={(e) => set("hsnCode", e.target.value)} />
          </label>
          <label>
            <span className={labelClassName}>GST rate (%)</span>
            <input
              type="number"
              className={inputClassName}
              value={value.gstRatePercent ?? ""}
              onChange={(e) => set("gstRatePercent", numberOrNull(e.target.value))}
            />
          </label>
          <label>
            <span className={labelClassName}>Country of origin</span>
            <input
              className={inputClassName}
              value={value.countryOfOrigin ?? ""}
              onChange={(e) => set("countryOfOrigin", e.target.value)}
            />
          </label>
          <label className="col-span-2">
            <span className={labelClassName}>Manufacturer / packer details</span>
            <textarea
              className={inputClassName}
              rows={2}
              value={value.manufacturerDetails ?? ""}
              onChange={(e) => set("manufacturerDetails", e.target.value)}
            />
          </label>
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-heading text-lg uppercase text-foreground">Merchandising</h3>
        <div className="grid grid-cols-2 gap-4">
          <label>
            <span className={labelClassName}>Material</span>
            <input
              className={inputClassName}
              value={value.material ?? ""}
              onChange={(e) => set("material", e.target.value)}
            />
          </label>
          <label>
            <span className={labelClassName}>Low stock threshold</span>
            <input
              type="number"
              className={inputClassName}
              value={value.lowStockThreshold ?? ""}
              onChange={(e) => set("lowStockThreshold", numberOrNull(e.target.value))}
            />
          </label>
          <label className="col-span-2">
            <span className={labelClassName}>Care instructions</span>
            <textarea
              className={inputClassName}
              rows={2}
              value={value.careInstructions ?? ""}
              onChange={(e) => set("careInstructions", e.target.value)}
            />
          </label>
          <label className="col-span-2">
            <span className={labelClassName}>Search keywords (comma-separated)</span>
            <input className={inputClassName} value={value.tags ?? ""} onChange={(e) => set("tags", e.target.value)} />
          </label>
        </div>
      </section>

      {error ? (
        <p className="text-sm" style={{ color: "#B91C1C" }}>
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-fit rounded-[var(--sf-radius,0.5rem)] bg-brand px-6 py-2.5 text-sm font-medium uppercase text-brand-foreground disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}
