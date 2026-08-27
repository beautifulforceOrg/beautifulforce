import Link from "next/link";
import { getFeaturedProducts } from "../lib/catalog";
import { CatalogGrid } from "./catalog-grid";

const ETHOS = [
  {
    title: "International Design",
    body: "Each piece is thoughtfully crafted to delight little ones, blending elegant design with pure childhood moments",
  },
  {
    title: "Comfort & Quality",
    body: "We obsess over the details and strive to deliver the best products every time.",
  },
  {
    title: "Trending Designs",
    body: "Fresh looks, playful vibes discover new designs every month to inspire your child's unique style and imagination",
  },
];

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

export default async function HomePage() {
  const products = await getFeaturedProducts(8);

  return (
    <main>
      <section className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-6 py-16">
          <p className="text-sm uppercase tracking-widest text-muted">New arrival</p>
          <h1 className="font-heading text-4xl uppercase text-foreground sm:text-5xl">
            Beige Sleeveless 3D Floral Frock
          </h1>
          <Link
            href="/products/beige-sleeveless-3d-floral-frock"
            className="mt-2 rounded-[var(--sf-radius,0.5rem)] bg-brand px-6 py-3 text-sm font-medium uppercase text-brand-foreground"
          >
            Shop now
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-heading mb-8 text-2xl uppercase text-foreground">Featured</h2>
        <CatalogGrid products={products} />
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-heading mb-8 text-2xl uppercase text-foreground">Shop by category</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            href="/shop/frocks"
            className="rounded-[var(--sf-radius,0.5rem)] border border-border bg-background p-8 text-center font-heading text-xl uppercase text-foreground hover:bg-muted"
          >
            Frocks
          </Link>
          <Link
            href="/shop/bags"
            className="rounded-[var(--sf-radius,0.5rem)] border border-border bg-background p-8 text-center font-heading text-xl uppercase text-foreground hover:bg-muted"
          >
            Bags
          </Link>
          <Link
            href="/products/bm-gift-card"
            className="rounded-[var(--sf-radius,0.5rem)] border border-border bg-background p-8 text-center font-heading text-xl uppercase text-foreground hover:bg-muted"
          >
            Gift Cards
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h2 className="font-heading mb-4 text-2xl uppercase text-foreground">Our Founder</h2>
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
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-heading mb-8 text-center text-2xl uppercase text-foreground">Our Ethos</h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {ETHOS.map((pillar) => (
            <div key={pillar.title} className="text-center">
              <h3 className="font-heading text-lg uppercase text-foreground">{pillar.title}</h3>
              <p className="mt-2 text-sm text-muted">{pillar.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-heading mb-8 text-center text-2xl uppercase text-foreground">
          What our customers say
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {TESTIMONIALS.map((testimonial) => (
            <blockquote
              key={testimonial.name}
              className="rounded-[var(--sf-radius,0.5rem)] border border-border p-6 text-sm text-foreground"
            >
              <p>&ldquo;{testimonial.quote}&rdquo;</p>
              <footer className="mt-3 text-xs uppercase tracking-wide text-muted">{testimonial.name}</footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="font-heading mb-8 text-center text-2xl uppercase text-foreground">
          Frequently asked questions
        </h2>
        <dl className="space-y-6">
          {FAQ.map((item) => (
            <div key={item.q} className="border-b border-border pb-6">
              <dt className="font-medium uppercase text-foreground">{item.q}</dt>
              <dd className="mt-2 text-sm text-muted">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
