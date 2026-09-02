import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
      <h1 className="font-heading text-3xl text-foreground">Page not found</h1>
      <p className="mt-4 text-sm text-muted">
        The page you&apos;re looking for doesn&apos;t exist, or may have moved.
      </p>
      <Link
        href="/shop"
        className="mt-8 rounded-[var(--sf-radius,0.5rem)] bg-brand px-6 py-2.5 text-sm font-medium uppercase text-brand-foreground"
      >
        Continue shopping
      </Link>
    </main>
  );
}
