"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DataTable, useToast } from "@storeforge/ui";
import type { listDiscounts } from "../../../../lib/admin/discounts";
import { createDiscountAction, deactivateDiscountAction } from "./actions";

type Discount = Awaited<ReturnType<typeof listDiscounts>>[number];

export function DiscountsClient({ initialDiscounts }: { initialDiscounts: Discount[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [code, setCode] = useState("");
  const [percentOff, setPercentOff] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createDiscountAction({ code, percentOff: Number(percentOff), active: true });
      if (!result.ok) {
        setError(result.error ?? "Could not create discount.");
      } else {
        setCode("");
        setPercentOff("");
        showToast("Discount created.");
        router.refresh();
      }
    });
  }

  function handleDeactivate(id: string) {
    startTransition(async () => {
      await deactivateDiscountAction(id);
      showToast("Discount deactivated.");
      router.refresh();
    });
  }

  return (
    <main>
      <h2 className="font-heading mb-6 text-2xl uppercase text-foreground">Discount codes</h2>

      <DataTable
        rowKey={(discount) => discount.id}
        rows={initialDiscounts}
        columns={[
          { header: "Code", cell: (discount) => discount.code },
          { header: "Percent off", cell: (discount) => `${discount.percentOff}%`, align: "right" },
          { header: "Active", cell: (discount) => (discount.active ? "Yes" : "No") },
          {
            header: "",
            cell: (discount) =>
              discount.active ? (
                <button type="button" onClick={() => handleDeactivate(discount.id)} className="text-muted underline">
                  Deactivate
                </button>
              ) : null,
          },
        ]}
        emptyMessage="No discount codes yet."
      />

      <div className="mt-6 flex flex-wrap items-end gap-2">
        <input
          placeholder="Code (e.g. WELCOME10)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="rounded-[var(--sf-radius,0.5rem)] border border-border px-3 py-2 text-sm"
        />
        <input
          placeholder="Percent off"
          type="number"
          value={percentOff}
          onChange={(e) => setPercentOff(e.target.value)}
          className="w-32 rounded-[var(--sf-radius,0.5rem)] border border-border px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={isPending || !code || !percentOff}
          className="rounded-[var(--sf-radius,0.5rem)] bg-brand px-4 py-2 text-sm font-medium uppercase text-brand-foreground disabled:opacity-50"
        >
          Create
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-sm" style={{ color: "#B91C1C" }}>
          {error}
        </p>
      ) : null}
    </main>
  );
}
