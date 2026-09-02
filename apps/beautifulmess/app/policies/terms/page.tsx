export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-sm text-foreground">
      <h1 className="font-heading mb-2 text-3xl">Terms of Service</h1>
      <p className="mb-8 text-muted">
        Beautiful Mess, registered to Anitaa Manish, operates from 102 Railway Parallel Road, Bengaluru,
        Karnataka 560020, and designs and sells luxury children&apos;s lifestyle products.
      </p>

      <h2 className="font-heading mt-6 text-lg">1. Shipping &amp; Delivery</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li>Standard delivery takes 5&ndash;7 working days across India</li>
        <li>Estimated delivery times are provided upon order confirmation</li>
        <li>
          We are not liable for delays caused by weather, flight delays, political disruptions, or other
          unforeseen circumstances, and no compensation is provided for delays beyond our control
        </li>
      </ul>

      <h2 className="font-heading mt-6 text-lg">2. Modifications</h2>
      <p className="mt-2 text-muted">
        Beautiful Mess reserves the right to update these terms without notice. Continued use of the site
        constitutes acceptance of the changes.
      </p>

      <h2 className="font-heading mt-6 text-lg">3. Eligibility</h2>
      <p className="mt-2 text-muted">
        Only individuals capable of forming legally binding contracts may use this site. Users under 18
        require parental or guardian involvement.
      </p>

      <h2 className="font-heading mt-6 text-lg">4. User Conduct</h2>
      <p className="mt-2 text-muted">
        Users must provide accurate information; we may terminate an account if false information is
        discovered. You&apos;ll receive administrative and promotional emails by default and can unsubscribe
        at any time. Prohibited uses include transmitting unlawful content, unauthorized access, copyright
        infringement, and interfering with the site&apos;s network.
      </p>

      <h2 className="font-heading mt-6 text-lg">5. Privacy</h2>
      <p className="mt-2 text-muted">
        Personal data is processed in accordance with our{" "}
        <a href="/policies/privacy" className="text-brand underline">
          Privacy Policy
        </a>
        .
      </p>

      <h2 className="font-heading mt-6 text-lg">6. Disclaimer of Warranties</h2>
      <p className="mt-2 text-muted">
        Products are sold at your own risk. Color variations between product images and the actual item may
        occur due to differences between screens.
      </p>

      <h2 className="font-heading mt-6 text-lg">9. Transactions &amp; Cancellations</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li>Payment declines are not our responsibility</li>
        <li>Orders may be canceled due to limited inventory, pricing errors, or quality defects</li>
        <li>Refunds, where applicable, are processed within 15 working days</li>
        <li>Customers bear all applicable taxes, including GST</li>
      </ul>

      <h2 className="font-heading mt-6 text-lg">10. Customs &amp; International Shipping</h2>
      <p className="mt-2 text-muted">
        International delivery takes 15&ndash;30 working days. Customers are responsible for import duties
        assessed at delivery.
      </p>

      <h2 className="font-heading mt-6 text-lg">11. Return, Replacement &amp; Refund</h2>
      <p className="mt-2 text-muted">
        We only make one piece of one size in each style. As such, we do not exchange or refund any
        purchases. See our{" "}
        <a href="/policies/refund" className="text-brand underline">
          Refund Policy
        </a>{" "}
        for details.
      </p>

      <h2 className="font-heading mt-6 text-lg">12. Shipping &amp; Processing Fees</h2>
      <p className="mt-2 text-muted">
        Shipping is currently free on all orders. See our{" "}
        <a href="/policies/shipping" className="text-brand underline">
          Shipping Policy
        </a>{" "}
        for delivery timelines and other details.
      </p>

      <h2 className="font-heading mt-6 text-lg">13&ndash;21. Additional Provisions</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li>You agree to indemnify Beautiful Mess against third-party claims arising from your use of the site</li>
        <li>These terms are governed by Indian law, with jurisdiction in Bangalore</li>
        <li>Grievances are addressed within 7 days</li>
        <li>Force majeure applies, but a lack of funds is not an excuse for non-performance</li>
        <li>Feedback you submit becomes the non-confidential property of Beautiful Mess</li>
      </ul>
    </main>
  );
}
