"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, useToast } from "@storeforge/ui";
import type { getProduct, listCollections } from "../../../../../lib/admin/products";
import { ProductForm, type ProductFormValue } from "../product-form";
import { deleteProductAction } from "../actions";
import {
  addVariantAction,
  deleteProductImageAction,
  deleteVariantAction,
  reorderImagesAction,
  setProductCollectionsAction,
  updateProductAction,
  updateVariantAction,
} from "./actions";
import { ImageUploader } from "./image-uploader";

type Product = NonNullable<Awaited<ReturnType<typeof getProduct>>>;
type Collection = Awaited<ReturnType<typeof listCollections>>[number];

export function ProductEditClient({ product, allCollections }: { product: Product; allCollections: Collection[] }) {
  const router = useRouter();

  return (
    <main className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl uppercase text-foreground">{product.name}</h2>
        <DeleteProductButton productId={product.id} />
      </div>

      <ProductForm
        initialValue={product as unknown as ProductFormValue}
        onSubmit={(value) => updateProductAction(product.id, value)}
        submitLabel="Save changes"
      />

      <VariantsSection productId={product.id} variants={product.variants} onChange={() => router.refresh()} />
      <ImagesSection productId={product.id} images={product.images} onChange={() => router.refresh()} />
      <CollectionsSection
        productId={product.id}
        allCollections={allCollections}
        selectedIds={product.collections.map((c) => c.id)}
        onChange={() => router.refresh()}
      />
    </main>
  );
}

function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteProductAction(productId);
      if (!result.ok) {
        showToast(result.error ?? "Could not delete this product.", "error");
      } else {
        router.push("/admin/products");
      }
    });
  }

  return (
    <Button variant="outline" onClick={handleDelete} disabled={isPending}>
      Delete product
    </Button>
  );
}

function VariantsSection({
  productId,
  variants,
  onChange,
}: {
  productId: string;
  variants: Product["variants"];
  onChange: () => void;
}) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [value, setValueField] = useState("");
  const [sku, setSku] = useState("");
  const [stockQty, setStockQty] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    startTransition(async () => {
      const result = await addVariantAction(productId, {
        name,
        value: valueField(),
        sku: sku || null,
        stockQty: stockQty === "" ? null : Number(stockQty),
      });
      if (!result.ok) {
        showToast(result.error ?? "Could not add variant.", "error");
      } else {
        setName("");
        setValueField("");
        setSku("");
        setStockQty("");
        onChange();
      }
    });
  }

  function valueField() {
    return value;
  }

  function handleDelete(variantId: string) {
    startTransition(async () => {
      await deleteVariantAction(productId, variantId);
      onChange();
    });
  }

  return (
    <section>
      <h3 className="font-heading mb-3 text-lg uppercase text-foreground">Variants</h3>
      {variants.length === 0 ? (
        <p className="mb-4 text-muted">No variants -- sold as a single item.</p>
      ) : (
        <ul className="mb-4 flex flex-col gap-2">
          {variants.map((variant) => (
            <VariantRow key={variant.id} productId={productId} variant={variant} onDelete={handleDelete} onChange={onChange} />
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <input placeholder="Name (e.g. Size)" value={name} onChange={(e) => setName(e.target.value)} className="rounded-[var(--sf-radius,0.5rem)] border border-border px-3 py-2 text-sm" />
        <input placeholder="Value (e.g. M)" value={value} onChange={(e) => setValueField(e.target.value)} className="rounded-[var(--sf-radius,0.5rem)] border border-border px-3 py-2 text-sm" />
        <input placeholder="SKU (optional)" value={sku} onChange={(e) => setSku(e.target.value)} className="rounded-[var(--sf-radius,0.5rem)] border border-border px-3 py-2 text-sm" />
        <input placeholder="Stock qty" value={stockQty} onChange={(e) => setStockQty(e.target.value)} className="w-24 rounded-[var(--sf-radius,0.5rem)] border border-border px-3 py-2 text-sm" />
        <Button onClick={handleAdd} disabled={isPending || !name || !value}>
          Add variant
        </Button>
      </div>
    </section>
  );
}

function VariantRow({
  productId,
  variant,
  onDelete,
  onChange,
}: {
  productId: string;
  variant: Product["variants"][number];
  onDelete: (variantId: string) => void;
  onChange: () => void;
}) {
  const [stockQty, setStockQty] = useState(variant.stockQty === null ? "" : String(variant.stockQty));
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function saveStock() {
    startTransition(async () => {
      const result = await updateVariantAction(productId, variant.id, {
        name: variant.name,
        value: variant.value,
        sku: variant.sku,
        stockQty: stockQty === "" ? null : Number(stockQty),
      });
      if (!result.ok) showToast(result.error ?? "Could not update stock.", "error");
      else onChange();
    });
  }

  return (
    <li className="flex items-center justify-between gap-4 border-b border-border py-2 text-sm">
      <span>
        {variant.name}: {variant.value} {variant.sku ? `(SKU ${variant.sku})` : ""}
      </span>
      <span className="flex items-center gap-2">
        <input
          type="number"
          value={stockQty}
          onChange={(e) => setStockQty(e.target.value)}
          placeholder="Untracked"
          className="w-20 rounded-[var(--sf-radius,0.5rem)] border border-border px-2 py-1 text-sm"
        />
        <button type="button" onClick={saveStock} disabled={isPending} className="text-brand underline">
          Save
        </button>
        <button type="button" onClick={() => onDelete(variant.id)} className="text-muted underline">
          Remove
        </button>
      </span>
    </li>
  );
}

function ImagesSection({
  productId,
  images,
  onChange,
}: {
  productId: string;
  images: Product["images"];
  onChange: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function move(index: number, direction: -1 | 1) {
    const reordered = [...images];
    const target = index + direction;
    if (target < 0 || target >= reordered.length) return;
    [reordered[index], reordered[target]] = [reordered[target]!, reordered[index]!];
    startTransition(async () => {
      await reorderImagesAction(productId, reordered.map((image) => image.id));
      onChange();
    });
  }

  function handleDelete(imageId: string) {
    startTransition(async () => {
      await deleteProductImageAction(productId, imageId);
      onChange();
    });
  }

  return (
    <section>
      <h3 className="font-heading mb-3 text-lg uppercase text-foreground">Images</h3>
      <div className="mb-4 flex flex-wrap gap-4">
        {images.map((image, index) => (
          <div key={image.id} className="flex w-32 flex-col gap-1">
            <div className="relative aspect-square w-32 overflow-hidden rounded border border-border">
              <Image src={image.url} alt={image.altText ?? ""} fill sizes="128px" className="object-cover" unoptimized />
            </div>
            <div className="flex justify-between text-xs">
              <button type="button" onClick={() => move(index, -1)} disabled={isPending || index === 0}>
                ↑
              </button>
              <button type="button" onClick={() => move(index, 1)} disabled={isPending || index === images.length - 1}>
                ↓
              </button>
              <button type="button" onClick={() => handleDelete(image.id)} disabled={isPending} className="text-muted underline">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <ImageUploader productId={productId} onUploaded={onChange} />
    </section>
  );
}

function CollectionsSection({
  productId,
  allCollections,
  selectedIds,
  onChange,
}: {
  productId: string;
  allCollections: Collection[];
  selectedIds: string[];
  onChange: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function toggle(collectionId: string, checked: boolean) {
    const next = checked ? [...selectedIds, collectionId] : selectedIds.filter((id) => id !== collectionId);
    startTransition(async () => {
      await setProductCollectionsAction(productId, next);
      onChange();
    });
  }

  return (
    <section>
      <h3 className="font-heading mb-3 text-lg uppercase text-foreground">Collections</h3>
      <div className="flex flex-wrap gap-4">
        {allCollections.map((collection) => (
          <label key={collection.id} className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={selectedIds.includes(collection.id)}
              disabled={isPending}
              onChange={(e) => toggle(collection.id, e.target.checked)}
            />
            {collection.name}
          </label>
        ))}
      </div>
    </section>
  );
}

