export default function ShippingPolicyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-sm text-foreground">
      <h1 className="font-heading mb-8 text-3xl">Shipping Policy</h1>

      <h2 className="font-heading mt-6 text-lg">Do you ship worldwide?</h2>
      <p className="mt-2 text-muted">
        Yes! Beautiful Mess ships to over 200 countries. All our products are made in India and dispatched
        from our fulfillment center in Jaipur.
      </p>

      <h2 className="font-heading mt-6 text-lg">Shipping charges</h2>
      <p className="mt-2 text-muted">
        Shipping is currently free on all orders, within India and internationally &mdash; there&apos;s no
        separate shipping charge added at checkout.
      </p>

      <h2 className="font-heading mt-6 text-lg">International orders</h2>
      <p className="mt-2 text-muted">
        International Cash on Delivery is currently unavailable. Please provide a complete physical address
        &mdash; couriers such as DHL, FedEx, and UPS do not deliver to P.O. boxes.
      </p>

      <h2 className="font-heading mt-6 text-lg">Delivery timelines (from dispatch)</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li>Within India: 2&ndash;6 business days</li>
        <li>USA, UK, Canada, UAE, Australia: 3&ndash;6 business days</li>
        <li>Other countries: 5&ndash;7 business days</li>
      </ul>

      <h2 className="font-heading mt-6 text-lg">Packaging</h2>
      <p className="mt-2 text-muted">
        Every order is securely packed to ensure your items reach you safely and in perfect condition. We
        maintain discreet and eco-friendly packaging standards.
      </p>

      <h2 className="font-heading mt-6 text-lg">Customs, duties &amp; damaged packages</h2>
      <p className="mt-2 text-muted">
        Import duties, customs, and local taxes are not included in product prices and are the buyer&apos;s
        responsibility. Beautiful Mess does not deliver to P.O. boxes or freight forwarding addresses. If a
        package appears tampered, damaged, or opened, please do not accept delivery &mdash; take photos or
        videos and contact us within 24 hours.
      </p>

      <h2 className="font-heading mt-6 text-lg">Insurance</h2>
      <p className="mt-2 text-muted">
        All Beautiful Mess orders are insured against theft and damage during transit. Once a package is
        delivered and signed for, insurance coverage ends.
      </p>

      <h2 className="font-heading mt-6 text-lg">Tracking &amp; receiver information</h2>
      <p className="mt-2 text-muted">
        You&apos;ll receive email or WhatsApp updates with tracking numbers once your order ships. Please
        ensure the recipient&apos;s phone number and name are accurate &mdash; couriers may call to confirm
        delivery.
      </p>

      <h2 className="font-heading mt-6 text-lg">Delivery partners</h2>
      <p className="mt-2 text-muted">
        We work with trusted partners including DHL, Blue Dart, Aramex, FedEx, UPS, and DTDC.
      </p>

      <h2 className="font-heading mt-6 text-lg">Contact</h2>
      <p className="mt-2 text-muted">
        102, Railway Parallel Road, 6th Cross, Kumara Park West, Bengaluru, Karnataka 560020
        <br />
        <a href="mailto:online.beautifulmess@gmail.com" className="text-brand underline">
          online.beautifulmess@gmail.com
        </a>{" "}
        · +91 8088339455 · Monday&ndash;Saturday, 12:00PM&ndash;7:00PM IST
      </p>
    </main>
  );
}
