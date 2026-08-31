import { formatPrice } from "@storeforge/ui";
import { revenueByDay, topProducts } from "../../../lib/admin/analytics";

export default async function AdminDashboardHomePage() {
  const [revenue, products] = await Promise.all([revenueByDay(14), topProducts(5, 30)]);
  const maxRevenue = Math.max(1, ...revenue.map((point) => point.amountPaise));

  return (
    <main className="flex flex-col gap-10">
      <h2 className="font-heading text-2xl uppercase text-foreground">Dashboard</h2>

      <section>
        <h3 className="font-heading mb-1 text-lg uppercase text-foreground">Revenue, last 14 days</h3>
        <p className="mb-4 text-xs text-muted">Amount actually charged (after discounts), for PAID/FULFILLED orders.</p>
        {revenue.length === 0 ? (
          <p className="text-muted">No revenue in this period yet.</p>
        ) : (
          <div className="flex h-40 items-end gap-1">
            {revenue.map((point) => (
              <div key={point.date} className="flex flex-1 flex-col items-center justify-end gap-1" title={point.date}>
                <div
                  className="w-full rounded-t bg-brand"
                  style={{ height: `${Math.max(2, (point.amountPaise / maxRevenue) * 100)}%` }}
                />
                <span className="text-[10px] text-muted">{point.date.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="font-heading mb-3 text-lg uppercase text-foreground">Top products, last 30 days</h3>
        {products.length === 0 ? (
          <p className="text-muted">No sales in this period yet.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {products.map((product) => (
              <li key={product.productId} className="flex justify-between border-b border-border py-2">
                <span>
                  {product.name} <span className="text-muted">({product.unitsSold} sold)</span>
                </span>
                <span>{formatPrice(product.revenuePaise)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
