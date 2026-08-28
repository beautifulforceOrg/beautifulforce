import Image from "next/image";
import Link from "next/link";
import { getCollections, getFeaturedProducts, getWishlistedProductIds } from "../lib/catalog";
import { CatalogGrid } from "./catalog-grid";
import { InstagramIcon, StarIcon } from "./icons";

// Icon filenames read directly off the live site's Our Ethos section
// (services.svg / services_1.svg / services_2.svg), one per pillar.
const ETHOS = [
  {
    title: "International Design",
    body: "Each piece is thoughtfully crafted to delight little ones, blending elegant design with pure childhood moments",
    icon: "https://beautifulmess.in/cdn/shop/files/services.svg?v=1760093091&width=1200",
  },
  {
    title: "Comfort & Quality",
    body: "We obsess over the details and strive to deliver the best products every time.",
    icon: "https://beautifulmess.in/cdn/shop/files/services_1.svg?v=1760093091&width=1200",
  },
  {
    title: "Trending Designs",
    body: "Fresh looks, playful vibes discover new designs every month to inspire your child's unique style and imagination",
    icon: "https://beautifulmess.in/cdn/shop/files/services_2.svg?v=1760093091&width=1200",
  },
];

// Real, plain text row from the live homepage -- no icons or body copy,
// sitting between the store-info section and the trust badges.
const ETHOS_WORDS = ["LUXURY", "STYLISH", "COMFORT"];

const TESTIMONIALS = [
  {
    name: "Anjali Gautham",
    quote:
      "The one stop for all mother's to make daughter Princess. Unique collection and nothing is repeated. From accessories to return favors for your darling Princess.",
  },
  {
    name: "Ashim Lakhpat",
    quote:
      "Great place to shop for kids clothes. The folks that own the place are very warm, helpful and knowledgeable. I highly recommend this place.",
  },
  {
    name: "Hitesh Malhotra",
    quote:
      "The collection of clothes at this place is very elegant, and stylish. Manish and Anita, the store owners, provided extra care and attention to pick the perfect clothes for the occasion.",
  },
  {
    name: "Pooja Chhajer",
    quote:
      "Amazing stylish clothes and accessories, alluring ambiance, My Daughter was loaded with compliments for her dressing from Beautiful Mess.",
  },
];

const FAQ = [
  {
    q: "What is the return policy?",
    a: "Concerned to protect children's hygiene and safety, we do not accept returns or exchanges on any items.",
  },
  {
    q: "Can you customise the pieces to size as per body measurements?",
    a: "We are a pure ready-to-wear brand, but we do offer free alterations.",
  },
  {
    q: "How do we maintain the dresses?",
    a: "Recommended to dry clean for the first time at least, followed by regular machine wash at home.",
  },
  {
    q: "Do you have an offline store presence?",
    a: "Yes, our flagship store is at Kumara Park West, Bangalore.",
  },
];

const INSTAGRAM_URL = "https://instagram.com/beautifulmessbyann";

// Read directly off the live site (same hero/founder images it currently
// serves, via its own CDN) rather than derived from arbitrary catalog
// order -- see apps/beautifulmess/README.md's audit section.
const HERO_IMAGE = "https://beautifulmess.in/cdn/shop/files/WhatsApp_Image_2026-07-09_at_10.00.57.jpg?v=1783590607&width=1600";
const FOUNDER_IMAGE = "https://beautifulmess.in/cdn/shop/files/WhatsApp_Image_2026-07-09_at_15.23.34.jpg?height=540&v=1783590954";

// The real site's "shop the look" strip: each tile is a specific product
// card (verified via each tile's own href on the live site), not a
// decorative image -- clicking one there goes straight to that product,
// so it does here too. All eight slugs are real products in this
// storefront's own catalog.

// The real site's own Instagram-teaser photos (not a live embed on either
// site) and press-mention logos -- both read directly off the live
// homepage, not invented. One press logo's filename didn't identify the
// publication, so no brand name is asserted for it; the other three are
// GQ, Elle, and Rolling Stone.
const INSTAGRAM_IMAGES = [
  "https://beautifulmess.in/cdn/shop/files/mother-daughter-sharing-hot-beverages.jpg?v=1760329482",
  "https://beautifulmess.in/cdn/shop/files/a-wooden-figurine-of-mother-and-child.jpg?v=1760329773",
  "https://beautifulmess.in/cdn/shop/files/girl-in-dress-on-bed.jpg?v=1760329801",
  "https://beautifulmess.in/cdn/shop/files/girl-blowing-bubbles-at-park.jpg?v=1760329827",
];
const PRESS_LOGOS = [
  "https://beautifulmess.in/cdn/shop/files/gq_35c9e59f-d64a-4f2a-b636-78149a2c87de.avif?v=1760096282&width=1200",
  "https://beautifulmess.in/cdn/shop/files/Adobe_Express_-_file.png?v=1761837237&width=1200",
  "https://beautifulmess.in/cdn/shop/files/elle_0265bd0c-2d96-4739-a3cb-9674b7a9e2cb.avif?v=1760096283&width=1200",
  "https://beautifulmess.in/cdn/shop/files/RollingStone_logo-2.avif?v=1760096283&width=1200",
];

const STRIP_PRODUCTS = [
  { slug: "beige-sleeveless-3d-floral-frock", name: "Beige Sleeveless 3D Floral Frock", image: "https://beautifulmess.in/cdn/shop/files/WhatsAppImage2026-06-23at13.19.49.jpg?v=1782901586&width=832" },
  { slug: "black-ruffle-seq-frock", name: "Black Ruffle Seq Frock", image: "https://beautifulmess.in/cdn/shop/files/WhatsAppImage2026-06-23at13.19.44_1.jpg?v=1782968804&width=832" },
  { slug: "black-sparkle-net-frock", name: "Black Sparkle Net Frock", image: "https://beautifulmess.in/cdn/shop/files/WhatsAppImage2026-06-23at13.19.48_2.jpg?v=1782970013&width=832" },
  { slug: "blue-frock-with-big-bow-on-shoulder", name: "Blue Frock With Big Bow On Shoulder", image: "https://beautifulmess.in/cdn/shop/files/WhatsAppImage2026-04-23at10.51.39_bfdb5891-ddd8-426f-9421-8243f8f3bc31.jpg?v=1782359983&width=832" },
  { slug: "bm-gift-card", name: "BM Gift Card", image: "https://beautifulmess.in/cdn/shop/files/WhatsAppImage2026-07-01at3.36.25PM.jpg?v=1782900418&width=832" },
  { slug: "brown-sleeveless-floral-frock", name: "Brown Sleeveless Floral Frock", image: "https://beautifulmess.in/cdn/shop/files/WhatsAppImage2026-06-23at13.19.48.jpg?v=1782966077&width=832" },
  { slug: "cream-pearl-embellished-ruffle-neckline-seq-frock", name: "Cream Pearl Embellished Ruffle Neckline Seq Frock", image: "https://beautifulmess.in/cdn/shop/files/WhatsApp_Image_2026-07-02_at_10.42.21_AM_2.jpg?v=1782971733&width=832" },
  { slug: "cream-ruffle-neck-seq-frock", name: "Cream Ruffle Neck Seq Frock", image: "https://beautifulmess.in/cdn/shop/files/WhatsAppImage2026-06-23at13.19.41_963d6662-4ecb-4068-8b23-cf2b4a6e889f.jpg?v=1782966809&width=832" },
];

export default async function HomePage() {
  const [products, collections, wishlistedIds] = await Promise.all([
    getFeaturedProducts(9),
    getCollections(),
    getWishlistedProductIds(),
  ]);

  return (
    <main>
      <h1 className="sr-only">Beautiful Mess — playful, elegant kidswear and accessories</h1>
      <Link href="/shop" className="relative block aspect-[16/7] w-full overflow-hidden">
        <Image src={HERO_IMAGE} alt="Beautiful Mess" fill sizes="100vw" priority className="object-cover" />
      </Link>

      <div className="grid grid-cols-2 sm:grid-cols-4">
        {STRIP_PRODUCTS.map((item) => (
          <Link
            key={item.slug}
            href={`/products/${item.slug}`}
            aria-label={item.name}
            className="group relative block aspect-square overflow-hidden"
          >
            <Image
              src={item.image}
              alt=""
              fill
              sizes="25vw"
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            />
          </Link>
        ))}
      </div>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-heading mb-8 text-center text-2xl uppercase text-foreground">Most Loved Products</h2>
        <CatalogGrid products={products} wishlistedIds={wishlistedIds} />
      </section>

      <section className="bg-brand py-16 text-brand-foreground">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-heading mb-10 text-center text-2xl uppercase">Most Searched</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {collections.map((collection) => (
              <Link key={collection.id} href={`/shop/${collection.slug}`} className="flex flex-col items-center gap-3">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-background text-sm font-semibold uppercase text-brand">
                  {collection.name.slice(0, 1)}
                </span>
                <span className="text-sm uppercase">{collection.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 px-6 py-16 md:grid-cols-2">
        <div>
          <h2 className="font-heading mb-4 text-2xl uppercase text-foreground">Anitaa Manish (Founder)</h2>
          <p className="text-sm text-muted">
            Meet Anitaa Manish, the heart and soul behind Beautiful Mess. Anitaa&apos;s journey in fashion began
            uniquely, initially as a jewelry designer where she developed her keen eye for style and aesthetics.
          </p>
          <p className="mt-4 text-sm text-muted">
            Her passion for children and design inspired her to overcome numerous challenges and pursue her
            entrepreneurial dream.
          </p>
          <p className="mt-4 text-sm text-muted">
            Fueled by her love for fashion and children, Anitaa founded Beautiful Mess with a vision to blend
            playful elegance with childhood joy. Her dedication to celebrating each child&apos;s individuality is
            evident in every stylish, high-quality piece that carries the Beautiful Mess name.
          </p>
        </div>
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[var(--sf-radius,0.5rem)]">
          <Image src={FOUNDER_IMAGE} alt="Anitaa Manish, founder of Beautiful Mess" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
        </div>
      </section>

      <section className="bg-brand py-16 text-brand-foreground">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-heading mb-10 text-center text-2xl uppercase">Our Ethos</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {ETHOS.map((pillar) => (
              <div key={pillar.title} className="text-center">
                <div className="relative mx-auto mb-3 h-12 w-12">
                  <Image src={pillar.icon} alt="" fill sizes="48px" className="object-contain" />
                </div>
                <h3 className="font-heading text-lg uppercase">{pillar.title}</h3>
                <p className="mt-2 text-sm ">{pillar.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <h2 className="font-heading mb-3 text-2xl uppercase text-foreground">Stay Cute &amp; Stylish</h2>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer"
          className="mb-8 inline-flex items-center gap-2 text-sm text-brand underline"
        >
          <InstagramIcon className="h-4 w-4" />
          Follow us on Instagram
        </a>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {INSTAGRAM_IMAGES.map((src) => (
            <a
              key={src}
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="View on Instagram"
              className="relative block aspect-square overflow-hidden"
            >
              <Image src={src} alt="" fill sizes="25vw" className="object-cover" />
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="font-heading mb-8 text-2xl uppercase text-foreground">As Appreciated On</h2>
        <div className="flex flex-wrap items-center justify-center gap-10">
          {PRESS_LOGOS.map((src) => (
            <div key={src} className="relative h-10 w-32">
              <Image src={src} alt="" fill sizes="128px" className="object-contain" />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 flex items-center justify-center gap-1 text-brand">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon key={i} className="h-4 w-4" />
          ))}
        </div>
        <h2 className="font-heading mb-10 text-center text-2xl uppercase text-foreground">Our Motivations</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {TESTIMONIALS.map((testimonial) => (
            <blockquote key={testimonial.name} className="rounded-[var(--sf-radius,0.5rem)] bg-brand p-6 text-sm text-brand-foreground">
              <div className="mb-3 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} className="h-3 w-3" />
                ))}
              </div>
              <p>&ldquo;{testimonial.quote}&rdquo;</p>
              <footer className="mt-3 text-xs uppercase tracking-wide ">{testimonial.name}</footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="font-heading mb-8 text-center text-2xl uppercase text-foreground">
          Frequently Asked Questions
        </h2>
        <div className="divide-y divide-border border-y border-border">
          {FAQ.map((item) => (
            <details key={item.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium uppercase text-foreground">
                {item.q}
                <span className="text-brand transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-brand py-16 text-brand-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 sm:grid-cols-2">
          <div>
            <h2 className="font-heading mb-4 text-2xl uppercase">Bangalore Store</h2>
            <p className="text-sm font-semibold uppercase">Flagship Store</p>
            <p className="mt-1 text-sm ">
              102, Railway Parallel Road, 6th Cross, Kumara Park West, Bengaluru, Karnataka 560020
            </p>
            <p className="mt-4 text-sm font-semibold uppercase">Contact</p>
            <p className="mt-1 text-sm ">+91 8088339455</p>
            <Link
              href="/help/contact"
              className="mt-6 inline-block rounded-[var(--sf-radius,0.5rem)] bg-background px-6 py-3 text-sm font-medium uppercase text-brand"
            >
              Visit us here
            </Link>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase">Store timing</p>
            <p className="mt-1 text-sm ">12:00PM &ndash; 7:00PM</p>
            <p className="mt-1 text-sm ">Sunday Holiday</p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-2 py-10 text-center">
        {ETHOS_WORDS.map((word) => (
          <h2 key={word} className="font-heading text-xl uppercase text-foreground">
            {word}
          </h2>
        ))}
      </div>
    </main>
  );
}
