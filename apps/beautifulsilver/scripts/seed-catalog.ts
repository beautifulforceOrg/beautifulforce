// Beautiful Silver has no Shopify export to migrate (unlike
// apps/beautifulmess's scripts/import-shopify-catalog.ts) -- it's a
// brand-new storefront, so its catalog is a static, hand-authored array
// seeded directly via Prisma. Same idempotent-upsert convention as
// packages/db/prisma/seed.ts (natural-key upserts, safe to re-run), plus
// deleteMany+createMany for images and `set` for collections so a re-run
// replaces rather than duplicates.
import { createPrismaClient } from "@storeforge/db";

const db = createPrismaClient();

function img(id: string) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;
}

interface SeedVariant {
  name: string;
  value: string;
  price?: number;
  stockQty?: number;
}

interface SeedProduct {
  slug: string;
  name: string;
  description: string;
  price: number; // paise
  collections: string[]; // collection slugs
  images: string[]; // unsplash photo ids
  variants?: SeedVariant[];
}

const COLLECTIONS = [
  { slug: "rings", name: "Rings" },
  { slug: "chains-and-necklaces", name: "Chains & Necklaces" },
  { slug: "earrings", name: "Earrings" },
  { slug: "bangles-and-bracelets", name: "Bangles & Bracelets" },
  { slug: "anklets", name: "Anklets" },
];

const PRODUCTS: SeedProduct[] = [
  // Rings
  {
    slug: "woven-wave-band-ring",
    name: "Woven Wave Band Ring",
    description:
      "<p>A slim sterling silver band with a gently woven wave texture, hand-finished to catch the light from every angle. Comfortable enough for everyday wear.</p>",
    price: 189900,
    collections: ["rings"],
    images: ["1515562141207-7a88fb7ce338"],
    variants: [
      { name: "Ring Size", value: "US 5" },
      { name: "Ring Size", value: "US 6" },
      { name: "Ring Size", value: "US 7" },
      { name: "Ring Size", value: "US 8" },
    ],
  },
  {
    slug: "solitaire-moonstone-ring",
    name: "Solitaire Moonstone Ring",
    description:
      "<p>A single rainbow moonstone set in a brushed silver bezel, with a thin polished band. Understated by day, luminous by candlelight.</p>",
    price: 249900,
    collections: ["rings"],
    images: ["1611652022419-a9419f74343d"],
    variants: [
      { name: "Ring Size", value: "US 5" },
      { name: "Ring Size", value: "US 6" },
      { name: "Ring Size", value: "US 7" },
    ],
  },
  {
    slug: "stacking-threads-ring-set",
    name: "Stacking Threads Ring Set",
    description:
      "<p>Three impossibly thin silver bands, each with a subtle texture -- hammered, twisted, and smooth -- meant to be worn together or apart.</p>",
    price: 219900,
    collections: ["rings"],
    images: ["1611591437281-460bfbe1220a"],
    variants: [
      { name: "Ring Size", value: "US 6" },
      { name: "Ring Size", value: "US 7" },
      { name: "Ring Size", value: "US 8" },
    ],
  },
  {
    slug: "brushed-signet-ring",
    name: "Brushed Signet Ring",
    description:
      "<p>A modern take on the classic signet, with a wide brushed-finish face left blank -- ready to be worn plain or engraved later.</p>",
    price: 279900,
    collections: ["rings"],
    images: ["1573408301185-9146fe634ad0"],
    variants: [
      { name: "Ring Size", value: "US 7" },
      { name: "Ring Size", value: "US 8" },
      { name: "Ring Size", value: "US 9" },
      { name: "Ring Size", value: "US 10" },
    ],
  },

  // Chains & Necklaces
  {
    slug: "fine-box-chain-necklace",
    name: "Fine Box Chain Necklace",
    description:
      "<p>A delicate box-link chain in solid sterling silver -- light enough to layer, sturdy enough to wear alone every single day.</p>",
    price: 329900,
    collections: ["chains-and-necklaces"],
    images: ["1617038260897-41a1f14a8ca0"],
    variants: [
      { name: "Length", value: "16 inch" },
      { name: "Length", value: "18 inch" },
      { name: "Length", value: "20 inch" },
    ],
  },
  {
    slug: "layered-coin-pendant-necklace",
    name: "Layered Coin Pendant Necklace",
    description:
      "<p>Two fine chains of different lengths, each holding a small hammered coin pendant, pre-layered so there's nothing to untangle.</p>",
    price: 389900,
    collections: ["chains-and-necklaces"],
    images: ["1584302179602-e4c3d3fd629d"],
  },
  {
    slug: "rope-chain-choker",
    name: "Rope Chain Choker",
    description:
      "<p>A short, close-fitting rope chain with a bright polished finish -- the kind of piece that looks equally at home with a t-shirt or a silk blouse.</p>",
    price: 259900,
    collections: ["chains-and-necklaces"],
    images: ["1506630448388-4e683c67ddb0"],
    variants: [
      { name: "Length", value: "13 inch" },
      { name: "Length", value: "14 inch" },
    ],
  },
  {
    slug: "engraved-bar-pendant-necklace",
    name: "Engraved Bar Pendant Necklace",
    description:
      "<p>A slim horizontal bar pendant with a hand-engraved wave motif, hung from a fine cable chain. A quiet, everyday signature piece.</p>",
    price: 299900,
    collections: ["chains-and-necklaces"],
    images: ["1535632066927-ab7c9ab60908"],
    variants: [
      { name: "Length", value: "16 inch" },
      { name: "Length", value: "18 inch" },
    ],
  },

  // Earrings
  {
    slug: "hammered-hoop-earrings",
    name: "Hammered Hoop Earrings",
    description:
      "<p>Classic hoops with an all-over hammered texture that scatters light beautifully. Lightweight enough for all-day wear.</p>",
    price: 219900,
    collections: ["earrings"],
    images: ["1611955167811-4711904bb9f8"],
    variants: [
      { name: "Size", value: "Small (18mm)" },
      { name: "Size", value: "Medium (25mm)" },
      { name: "Size", value: "Large (35mm)" },
    ],
  },
  {
    slug: "threader-chain-earrings",
    name: "Threader Chain Earrings",
    description:
      "<p>Long, fine chains that thread through the ear and fall in a soft drape -- an easy way to add movement without any weight.</p>",
    price: 179900,
    collections: ["earrings"],
    images: ["1596944924616-7b38e7cfac36"],
  },
  {
    slug: "cluster-stud-earrings",
    name: "Cluster Stud Earrings",
    description:
      "<p>A small cluster of polished silver beads forming a textured stud -- the kind of everyday earring you forget you're wearing.</p>",
    price: 149900,
    collections: ["earrings"],
    images: ["1573855619003-97b4799dcd8b"],
  },
  {
    slug: "drop-filigree-earrings",
    name: "Drop Filigree Earrings",
    description:
      "<p>Intricate filigree work in a teardrop silhouette, finished with a soft antique patina to bring out every detail of the pattern.</p>",
    price: 269900,
    collections: ["earrings"],
    images: ["1602173574767-37ac01994b2a"],
  },

  // Bangles & Bracelets
  {
    slug: "brushed-cuff-bangle",
    name: "Brushed Cuff Bangle",
    description:
      "<p>An open-ended cuff with a soft brushed finish and a gently curved profile that adjusts to fit most wrists.</p>",
    price: 349900,
    collections: ["bangles-and-bracelets"],
    images: ["1620656798579-1984d9e87df7"],
    variants: [
      { name: "Size", value: "Small" },
      { name: "Size", value: "Medium" },
      { name: "Size", value: "Large" },
    ],
  },
  {
    slug: "charm-link-bracelet",
    name: "Charm Link Bracelet",
    description:
      "<p>A sturdy curb-link chain bracelet with three small starting charms -- a moon, a star, and a single pearl bead -- ready to add more over time.</p>",
    price: 289900,
    collections: ["bangles-and-bracelets"],
    images: ["1600721391689-2564bb8055de"],
    variants: [
      { name: "Length", value: "6.5 inch" },
      { name: "Length", value: "7.5 inch" },
    ],
  },
  {
    slug: "twisted-rope-bangle",
    name: "Twisted Rope Bangle",
    description:
      "<p>A solid bangle twisted from two rounded silver wires, giving it a rope-like texture that holds up beautifully to daily wear.</p>",
    price: 319900,
    collections: ["bangles-and-bracelets"],
    images: ["1621939514649-280e2ee25f60"],
  },
  {
    slug: "cubic-zirconia-tennis-bracelet",
    name: "Cubic Zirconia Tennis Bracelet",
    description:
      "<p>A single line of brilliant-cut cubic zirconia stones set in sterling silver -- the sparkle of a classic tennis bracelet, made for every day.</p>",
    price: 449900,
    collections: ["bangles-and-bracelets"],
    images: ["1520962880247-cfaf541c8724"],
    variants: [
      { name: "Length", value: "6.5 inch" },
      { name: "Length", value: "7 inch" },
    ],
  },

  // Anklets
  {
    slug: "beaded-ball-chain-anklet",
    name: "Beaded Ball Chain Anklet",
    description:
      "<p>A fine ball-chain anklet that catches the light with every step, finished with a small adjustable clasp.</p>",
    price: 129900,
    collections: ["anklets"],
    images: ["1611085583191-a3b181a88401"],
    variants: [
      { name: "Length", value: "9 inch" },
      { name: "Length", value: "10 inch" },
    ],
  },
  {
    slug: "layered-charm-anklet",
    name: "Layered Charm Anklet",
    description:
      "<p>Two fine chains layered together, one plain and one dotted with tiny disc charms, for a look that feels effortlessly finished.</p>",
    price: 169900,
    collections: ["anklets"],
    images: ["1599643477877-530eb83abc8e"],
  },
  {
    slug: "fine-curb-chain-anklet",
    name: "Fine Curb Chain Anklet",
    description:
      "<p>A slim curb-link chain anklet with a bright polished finish -- simple, sturdy, and easy to wear from beach to evening.</p>",
    price: 139900,
    collections: ["anklets"],
    images: ["1605100804763-247f67b3557e"],
    variants: [
      { name: "Length", value: "9 inch" },
      { name: "Length", value: "10 inch" },
      { name: "Length", value: "11 inch" },
    ],
  },
  {
    slug: "temple-bell-anklet-pair",
    name: "Temple Bell Anklet Pair",
    description:
      "<p>A pair of anklets inspired by traditional temple jewellery, each strung with tiny silver bells that give a soft chime with every step.</p>",
    price: 259900,
    collections: ["anklets"],
    images: ["1522312346375-d1a52e2b99b3", "1608042314453-ae338d80c427"],
  },
];

async function main() {
  for (const collection of COLLECTIONS) {
    await db.collection.upsert({
      where: { slug: collection.slug },
      update: { name: collection.name },
      create: collection,
    });
  }

  for (const product of PRODUCTS) {
    const record = await db.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        price: product.price,
      },
      create: {
        slug: product.slug,
        name: product.name,
        description: product.description,
        price: product.price,
      },
    });

    await db.product.update({
      where: { id: record.id },
      data: { collections: { set: product.collections.map((slug) => ({ slug })) } },
    });

    await db.productImage.deleteMany({ where: { productId: record.id } });
    await db.productImage.createMany({
      data: product.images.map((photoId, position) => ({
        productId: record.id,
        url: img(photoId),
        position,
        altText: product.name,
      })),
    });

    for (const variant of product.variants ?? []) {
      await db.productVariant.upsert({
        where: {
          productId_name_value: { productId: record.id, name: variant.name, value: variant.value },
        },
        update: { price: variant.price ?? null, stockQty: variant.stockQty ?? null },
        create: {
          productId: record.id,
          name: variant.name,
          value: variant.value,
          price: variant.price ?? null,
          stockQty: variant.stockQty ?? null,
        },
      });
    }
  }

  console.log(`Seeded ${COLLECTIONS.length} collections and ${PRODUCTS.length} products.`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
