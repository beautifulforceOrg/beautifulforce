import Link from "next/link";
import { DataTable, formatPrice } from "@storeforge/ui";
import { listProducts } from "../../../../lib/admin/products";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const products = await listProducts(q);

  return (
    <main>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-heading text-2xl uppercase text-foreground">Products</h2>
        <Link
          href="/admin/products/new"
          className="rounded-[var(--sf-radius,0.5rem)] bg-brand px-4 py-2 text-sm font-medium uppercase text-brand-foreground"
        >
          New product
        </Link>
      </div>

      <form className="mb-4">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name, slug, or SKU"
          className="w-full max-w-sm rounded-[var(--sf-radius,0.5rem)] border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted"
        />
      </form>

      <DataTable
        rowKey={(product) => product.id}
        rows={products}
        columns={[
          {
            header: "Name",
            cell: (product) => (
              <Link href={`/admin/products/${product.id}`} className="text-brand underline">
                {product.name}
              </Link>
            ),
          },
          { header: "SKU", cell: (product) => product.sku ?? "—" },
          { header: "Price", cell: (product) => formatPrice(product.price), align: "right" },
          { header: "Published", cell: (product) => (product.isPublished ? "Yes" : "No") },
          { header: "Variants", cell: (product) => String(product.variants.length), align: "right" },
        ]}
        emptyMessage="No products yet."
      />
    </main>
  );
}
