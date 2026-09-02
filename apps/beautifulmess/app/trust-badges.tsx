import { GiftIcon, RocketIcon, ShieldIcon, SparkleIcon } from "./icons";

const BADGES = [
  {
    icon: RocketIcon,
    title: "Shipping Worldwide",
    body: "Shipping worldwide, successfully shipped to over 6+ countries",
  },
  {
    icon: GiftIcon,
    title: "Curated Luxury",
    body: "Shipping worldwide, successfully shipped to over 6+ countries",
  },
  {
    icon: ShieldIcon,
    title: "Secure Payments",
    body: "Shipping worldwide, successfully shipped to over 6+ countries",
  },
  {
    icon: SparkleIcon,
    title: "20000+ Happy Moms",
    body: "Trusted by 20000+ happy moms. Shop now and see why we have 500+ reviews.",
  },
];

// Uses the theme's accessible brand shade (bg-brand), not the real site's
// literal pastel #F38B88 -- white text on that pastel is only 2.37:1
// contrast, the same failure axe-core caught on the "Add to cart" button
// (see app/layout.tsx). Same coral family, same section the real site
// uses it for, just the WCAG AA-passing shade.
export function TrustBadges() {
  return (
    <section aria-label="Why shop with us" className="bg-brand py-14 text-brand-foreground">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 text-center sm:grid-cols-4">
        {BADGES.map((badge) => (
          <div key={badge.title} className="flex flex-col items-center">
            <badge.icon className="h-10 w-10" />
            <h2 className="font-heading mt-3 text-sm">{badge.title}</h2>
            <p className="mt-2 text-xs">{badge.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
