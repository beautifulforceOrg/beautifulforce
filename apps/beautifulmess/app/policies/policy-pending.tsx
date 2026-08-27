// These three policies (Privacy, Terms, Shipping) weren't in the CSV/theme
// exports we migrated from Shopify -- unlike the Refund Policy, which
// could be sourced from the site's real FAQ copy. Placeholder rather than
// invented legal text; per the onboarding plan, this is real content the
// client needs to provide before launch.
export function PolicyPending({ title }: { title: string }) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-heading mb-4 text-3xl uppercase text-foreground">{title}</h1>
      <p className="text-sm text-muted">
        This policy is being finalized. In the meantime, write to us at{" "}
        <a href="mailto:online.beautifulmess@gmail.com" className="text-brand underline">
          online.beautifulmess@gmail.com
        </a>{" "}
        with any questions.
      </p>
    </main>
  );
}
