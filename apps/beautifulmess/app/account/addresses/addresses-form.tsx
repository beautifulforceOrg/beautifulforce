"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createAddress, deleteAddress, setDefaultAddress, updateAddress } from "../../../lib/account-actions";
import type { AddressInput, SavedAddress } from "../../../lib/account-settings";

const EMPTY_FORM: AddressInput & { label: string } = {
  label: "",
  name: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
};

const inputClassName =
  "w-full rounded-[var(--sf-radius,0.5rem)] border border-border px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted";

export function AddressesForm({ initialAddresses }: { initialAddresses: SavedAddress[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(initialAddresses.length === 0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  function startEdit(address: SavedAddress) {
    setEditingId(address.id);
    setShowAddForm(false);
    setForm({
      label: address.label,
      name: address.name,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    });
  }

  function cancelForm() {
    setEditingId(null);
    setShowAddForm(false);
    setForm(EMPTY_FORM);
    setError(null);
  }

  function handleSubmit() {
    setError(null);
    const { label, ...address } = form;
    startTransition(async () => {
      const result = editingId ? await updateAddress(editingId, label, address) : await createAddress(label, address);
      if (result.error) {
        setError(result.error);
        return;
      }
      cancelForm();
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteAddress(id);
      router.refresh();
    });
  }

  function handleSetDefault(id: string) {
    startTransition(async () => {
      await setDefaultAddress(id);
      router.refresh();
    });
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-heading mb-2 text-3xl text-foreground">Saved addresses</h1>
      <p className="mb-8 text-sm text-muted">
        <Link href="/account/settings" className="text-brand underline">
          Back to account settings
        </Link>
      </p>

      <ul className="space-y-4">
        {initialAddresses.map((address) => (
          <li key={address.id} className="rounded-[var(--sf-radius,0.5rem)] border border-border p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">{address.label}</span>
              {address.isDefault ? <span className="text-xs uppercase text-brand">Default</span> : null}
            </div>
            <p className="mt-1 text-muted">
              {address.name} &middot; {address.phone}
            </p>
            <p className="text-muted">
              {address.addressLine1}
              {address.addressLine2 ? `, ${address.addressLine2}` : ""}, {address.city}, {address.state}{" "}
              {address.pincode}
            </p>
            <div className="mt-3 flex gap-4">
              <button type="button" onClick={() => startEdit(address)} className="text-brand underline">
                Edit
              </button>
              {!address.isDefault ? (
                <button type="button" onClick={() => handleSetDefault(address.id)} className="text-brand underline">
                  Set as default
                </button>
              ) : null}
              <button type="button" onClick={() => handleDelete(address.id)} className="text-muted underline">
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      {initialAddresses.length === 0 ? <p className="mt-4 text-sm text-muted">No saved addresses yet.</p> : null}

      {!showAddForm && !editingId ? (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="mt-6 rounded-[var(--sf-radius,0.5rem)] border border-brand px-4 py-2 text-sm font-medium uppercase text-brand"
        >
          Add a new address
        </button>
      ) : (
        <div className="mt-6 space-y-3 border-t border-border pt-6">
          <h2 className="font-heading text-lg text-foreground">{editingId ? "Edit address" : "Add address"}</h2>
          <input
            placeholder="Label (e.g. Home, Office)"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            className={inputClassName}
          />
          <input
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClassName}
          />
          <input
            placeholder="Phone number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={inputClassName}
          />
          <input
            placeholder="Address"
            value={form.addressLine1}
            onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
            className={inputClassName}
          />
          <input
            placeholder="Flat / house no., floor, landmark (optional)"
            value={form.addressLine2}
            onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
            className={inputClassName}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className={inputClassName}
            />
            <input
              placeholder="State"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className={inputClassName}
            />
          </div>
          <input
            placeholder="Pincode"
            value={form.pincode}
            onChange={(e) => setForm({ ...form, pincode: e.target.value })}
            className={inputClassName}
          />
          {error ? (
            <p className="text-sm" style={{ color: "#B91C1C" }}>
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                isPending || !form.label || !form.name || !form.phone || !form.addressLine1 || !form.city || !form.state || !form.pincode
              }
              className="rounded-[var(--sf-radius,0.5rem)] bg-brand px-4 py-2 text-sm font-medium uppercase text-brand-foreground disabled:opacity-50"
            >
              {isPending ? "Saving..." : editingId ? "Save changes" : "Add address"}
            </button>
            <button type="button" onClick={cancelForm} className="text-sm text-muted underline">
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
