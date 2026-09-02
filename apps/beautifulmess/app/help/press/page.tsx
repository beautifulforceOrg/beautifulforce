// The real page (/pages/press-recognition) is genuinely this short --
// verified directly, not abbreviated by us.
export default function PressPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-sm text-foreground">
      <h1 className="font-heading mb-4 text-3xl">PR &amp; Events</h1>
      <p className="text-muted">Featured in &ldquo;Varaabysk Editorial Magazine 2023 Edit&rdquo;</p>
      <p className="mt-6 text-muted">
        For press and media inquiries, write to us at{" "}
        <a href="mailto:online.beautifulmess@gmail.com" className="text-brand underline">
          online.beautifulmess@gmail.com
        </a>
        .
      </p>
    </main>
  );
}
