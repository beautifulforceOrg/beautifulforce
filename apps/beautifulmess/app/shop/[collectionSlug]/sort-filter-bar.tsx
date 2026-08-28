"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SORT_OPTIONS } from "../../../lib/product-list";

export function SortFilterBar({ count }: { count: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4 text-sm">
      <p className="text-muted">
        {count} item{count === 1 ? "" : "s"}
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2">
          <span className="text-foreground">Availability</span>
          <select
            aria-label="Filter by availability"
            defaultValue={searchParams.get("availability") ?? ""}
            onChange={(e) => setParam("availability", e.target.value)}
            className="rounded border border-border bg-background px-2 py-1 text-foreground"
          >
            <option value="">All</option>
            <option value="in-stock">In stock</option>
            <option value="out-of-stock">Out of stock</option>
          </select>
        </label>
        <fieldset className="flex items-center gap-2">
          <legend className="sr-only">Filter by price (rupees)</legend>
          <span className="text-foreground">Price</span>
          <input
            type="number"
            aria-label="Minimum price"
            placeholder="Min"
            defaultValue={searchParams.get("minPrice") ?? ""}
            onBlur={(e) => setParam("minPrice", e.target.value)}
            className="w-20 rounded border border-border bg-background px-2 py-1 text-foreground"
          />
          <span className="text-muted">&ndash;</span>
          <input
            type="number"
            aria-label="Maximum price"
            placeholder="Max"
            defaultValue={searchParams.get("maxPrice") ?? ""}
            onBlur={(e) => setParam("maxPrice", e.target.value)}
            className="w-20 rounded border border-border bg-background px-2 py-1 text-foreground"
          />
        </fieldset>
        <label className="flex items-center gap-2">
          <span className="text-foreground">Sort by</span>
          <select
            aria-label="Sort products"
            defaultValue={searchParams.get("sort") ?? "featured"}
            onChange={(e) => setParam("sort", e.target.value)}
            className="rounded border border-border bg-background px-2 py-1 text-foreground"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
