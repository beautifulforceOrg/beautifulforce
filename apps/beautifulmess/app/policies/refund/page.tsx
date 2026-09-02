export default function RefundPolicyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-sm text-foreground">
      <h1 className="font-heading mb-4 text-3xl">Refund Policy</h1>
      <p className="text-muted">
        Concerned to protect children&apos;s hygiene and safety, we do not accept returns or exchanges on any
        items. We only make one piece of one size in each style, so we&apos;re unable to exchange or refund
        purchases for that reason either.
      </p>
      <p className="mt-4 text-muted">
        We are a pure ready-to-wear brand, but we do offer free alterations.
      </p>
      <p className="mt-4 text-muted">
        Where a refund is due (a canceled order, a quality defect confirmed on our side), it is processed
        within 15 working days. See our{" "}
        <a href="/policies/terms" className="text-brand underline">
          Terms of Service
        </a>{" "}
        for the full cancellation terms.
      </p>
      <p className="mt-4 text-muted">
        Questions about a specific order? Write to us at{" "}
        <a href="mailto:online.beautifulmess@gmail.com" className="text-brand underline">
          online.beautifulmess@gmail.com
        </a>
        .
      </p>
    </main>
  );
}
