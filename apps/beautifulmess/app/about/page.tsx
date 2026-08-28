// The real About Us page is genuinely this sparse -- just the heading;
// the founder story lives on the homepage, and the trust-badges band and
// footer render globally from the root layout. Verified directly (an
// audit read the real page's full text content), not guessed.
export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-heading text-3xl uppercase text-foreground">About Us</h1>
    </main>
  );
}
