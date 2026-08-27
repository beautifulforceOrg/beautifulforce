export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-sm text-foreground">
      <h1 className="font-heading mb-8 text-3xl uppercase">Privacy Policy</h1>

      <h2 className="font-heading mt-6 text-lg uppercase">Information We Collect</h2>
      <p className="mt-2 text-muted">
        Our site automatically collects &ldquo;Device Information&rdquo; including your IP address, browser
        type, and cookies. When you make a purchase, we also gather &ldquo;Order Information&rdquo; such as
        your name, address, payment details, and email.
      </p>

      <h2 className="font-heading mt-6 text-lg uppercase">How We Use Your Data</h2>
      <p className="mt-2 text-muted">Personal information is used to:</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li>Process orders and payments</li>
        <li>Communicate with customers</li>
        <li>Screen for fraud</li>
        <li>Provide targeted advertising (with consent)</li>
        <li>Improve site functionality through analytics</li>
      </ul>

      <h2 className="font-heading mt-6 text-lg uppercase">Third-Party Sharing</h2>
      <p className="mt-2 text-muted">Data is shared with service providers including our platform provider, analytics, and payment processors.</p>
      <p className="mt-2 text-muted">
        You can opt out of targeted ads through Facebook, Google, and Bing&apos;s own privacy settings.
      </p>

      <h2 className="font-heading mt-6 text-lg uppercase">Your Rights</h2>
      <p className="mt-2 text-muted">
        European residents can request access, correction, or deletion of their personal data. You can opt
        out of marketing emails via the unsubscribe link in any email we send.
      </p>

      <h2 className="font-heading mt-6 text-lg uppercase">Data Retention</h2>
      <p className="mt-2 text-muted">
        Order information is retained unless you request its deletion. We do not honor &ldquo;Do Not
        Track&rdquo; browser signals. This policy does not cover third-party websites we may link to.
      </p>

      <h2 className="font-heading mt-6 text-lg uppercase">Governing Law &amp; Contact</h2>
      <p className="mt-2 text-muted">
        This policy is governed by Indian law. For questions, write to{" "}
        <a href="mailto:online.beautifulmess@gmail.com" className="text-brand underline">
          online.beautifulmess@gmail.com
        </a>{" "}
        or reach us at 102, Railway Parallel Road, 6th Cross, Kumara Park West, Bengaluru, Karnataka 560020.
      </p>
    </main>
  );
}
