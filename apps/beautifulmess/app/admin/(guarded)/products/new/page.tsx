"use client";

import { ProductForm } from "../product-form";
import { createProductAction } from "../actions";

export default function NewProductPage() {
  return (
    <main>
      <h2 className="font-heading mb-6 text-2xl uppercase text-foreground">New product</h2>
      <ProductForm onSubmit={createProductAction} submitLabel="Create product" />
    </main>
  );
}
