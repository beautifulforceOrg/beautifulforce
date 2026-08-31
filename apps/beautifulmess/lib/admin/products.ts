import { db, Prisma } from "@storeforge/db";

export interface ProductInput {
  slug: string;
  name: string;
  description?: string | null;
  price: number;
  sku?: string | null;
  barcode?: string | null;
  brand?: string | null;
  weightGrams?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  packageWeightGrams?: number | null;
  packageLengthCm?: number | null;
  packageWidthCm?: number | null;
  packageHeightCm?: number | null;
  mrp?: number | null;
  hsnCode?: string | null;
  gstRatePercent?: number | null;
  countryOfOrigin?: string | null;
  manufacturerDetails?: string | null;
  material?: string | null;
  careInstructions?: string | null;
  tags?: string | null;
  isPublished?: boolean;
  lowStockThreshold?: number | null;
}

export interface AdminActionResult<T = void> {
  ok: boolean;
  error?: string;
  data?: T;
}

function isUniqueConstraintError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

// Picks only the known scalar fields out of whatever's passed in --
// callers (e.g. the edit page) may hand us a whole Prisma Product object
// that also carries relation arrays (images/variants/collections), which
// Prisma's `update`/`create` `data` rejects outright if passed through
// as-is.
function toScalarProductData(input: ProductInput): ProductInput {
  const {
    slug,
    name,
    description,
    price,
    sku,
    barcode,
    brand,
    weightGrams,
    lengthCm,
    widthCm,
    heightCm,
    packageWeightGrams,
    packageLengthCm,
    packageWidthCm,
    packageHeightCm,
    mrp,
    hsnCode,
    gstRatePercent,
    countryOfOrigin,
    manufacturerDetails,
    material,
    careInstructions,
    tags,
    isPublished,
    lowStockThreshold,
  } = input;
  return {
    slug,
    name,
    description,
    price,
    sku,
    barcode,
    brand,
    weightGrams,
    lengthCm,
    widthCm,
    heightCm,
    packageWeightGrams,
    packageLengthCm,
    packageWidthCm,
    packageHeightCm,
    mrp,
    hsnCode,
    gstRatePercent,
    countryOfOrigin,
    manufacturerDetails,
    material,
    careInstructions,
    tags,
    isPublished,
    lowStockThreshold,
  };
}

export async function listProducts(search?: string) {
  return db.product.findMany({
    where: search
      ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { slug: { contains: search, mode: "insensitive" } }, { sku: { contains: search, mode: "insensitive" } }] }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: { images: { orderBy: { position: "asc" } }, variants: true, collections: true },
  });
}

export async function getProduct(id: string) {
  return db.product.findUnique({
    where: { id },
    include: { images: { orderBy: { position: "asc" } }, variants: true, collections: true },
  });
}

export async function createProduct(input: ProductInput): Promise<AdminActionResult<{ id: string }>> {
  try {
    const product = await db.product.create({ data: toScalarProductData(input) });
    return { ok: true, data: { id: product.id } };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const target = (error.meta?.target as string[] | undefined)?.join(", ") ?? "slug/SKU";
      return { ok: false, error: `A product with this ${target} already exists.` };
    }
    throw error;
  }
}

export async function updateProduct(id: string, input: ProductInput): Promise<AdminActionResult> {
  try {
    await db.product.update({ where: { id }, data: toScalarProductData(input) });
    return { ok: true };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const target = (error.meta?.target as string[] | undefined)?.join(", ") ?? "slug/SKU";
      return { ok: false, error: `A product with this ${target} already exists.` };
    }
    throw error;
  }
}

export async function deleteProduct(id: string): Promise<AdminActionResult> {
  try {
    await db.product.delete({ where: { id } });
    return { ok: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return { ok: false, error: "This product has existing orders and can't be deleted -- unpublish it instead." };
    }
    throw error;
  }
}

export interface VariantInput {
  name: string;
  value: string;
  sku?: string | null;
  price?: number | null;
  stockQty?: number | null;
}

export async function addVariant(productId: string, input: VariantInput): Promise<AdminActionResult<{ id: string }>> {
  try {
    const variant = await db.productVariant.create({ data: { productId, ...input } });
    return { ok: true, data: { id: variant.id } };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const target = (error.meta?.target as string[] | undefined) ?? [];
      if (target.includes("sku")) {
        return { ok: false, error: "That SKU is already in use by another variant." };
      }
      return { ok: false, error: "This product already has a variant with that name and value." };
    }
    throw error;
  }
}

export async function updateVariant(id: string, input: VariantInput): Promise<AdminActionResult> {
  try {
    await db.productVariant.update({ where: { id }, data: input });
    return { ok: true };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const target = (error.meta?.target as string[] | undefined) ?? [];
      if (target.includes("sku")) {
        return { ok: false, error: "That SKU is already in use by another variant." };
      }
      return { ok: false, error: "This product already has a variant with that name and value." };
    }
    throw error;
  }
}

export async function deleteVariant(id: string): Promise<void> {
  await db.productVariant.delete({ where: { id } });
}

export async function addProductImage(
  productId: string,
  input: { url: string; altText?: string | null }
): Promise<{ id: string }> {
  const maxPosition = await db.productImage.aggregate({ where: { productId }, _max: { position: true } });
  const image = await db.productImage.create({
    data: { productId, url: input.url, altText: input.altText, position: (maxPosition._max.position ?? -1) + 1 },
  });
  return { id: image.id };
}

export async function reorderImages(orderedImageIds: string[]): Promise<void> {
  await db.$transaction(
    orderedImageIds.map((imageId, position) => db.productImage.update({ where: { id: imageId }, data: { position } }))
  );
}

export async function deleteProductImage(imageId: string): Promise<void> {
  await db.productImage.delete({ where: { id: imageId } });
}

export async function setProductCollections(productId: string, collectionIds: string[]): Promise<void> {
  await db.product.update({
    where: { id: productId },
    data: { collections: { set: collectionIds.map((id) => ({ id })) } },
  });
}

export async function listCollections() {
  return db.collection.findMany({ orderBy: { name: "asc" } });
}
