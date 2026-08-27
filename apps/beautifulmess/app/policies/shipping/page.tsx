export default function ShippingPolicyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-sm text-foreground">
      <h1 className="font-heading mb-8 text-3xl uppercase">Shipping Policy</h1>

      <h2 className="font-heading mt-6 text-lg uppercase">Do you ship worldwide?</h2>
      <p className="mt-2 text-muted">
        Yes! Beautiful Mess ships to over 200 countries. All our products are made in India and dispatched
        from our fulfillment center in Jaipur.
      </p>

      <h2 className="font-heading mt-6 text-lg uppercase">Shipping charges within India</h2>
      <p className="mt-2 text-muted">
        <strong className="text-foreground">Standard delivery</strong> (15&ndash;18 days, ready-to-ship): ₹299
        flat shipping across India.
      </p>
      <p className="mt-2 text-muted">
        <strong className="text-foreground">Express delivery</strong>, by order value:
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li>Below ₹3,500: ₹399</li>
        <li>₹3,501 &ndash; ₹8,000: ₹650</li>
        <li>₹8,001 &ndash; ₹15,000: ₹1,200</li>
        <li>₹15,001 &ndash; ₹22,000: ₹1,599</li>
        <li>₹22,001 &ndash; ₹30,000: ₹2,000</li>
        <li>₹30,001 &ndash; ₹40,000: ₹2,999</li>
        <li>Above ₹40,001: ₹3,999</li>
      </ul>

      <h2 className="font-heading mt-6 text-lg uppercase">International orders</h2>
      <p className="mt-2 text-muted">
        Standard delivery takes 15&ndash;18 days for ready-to-ship items and custom pieces. International
        Cash on Delivery is currently unavailable. Please provide a complete physical address &mdash; couriers
        such as DHL, FedEx, and UPS do not deliver to P.O. boxes.
      </p>

      <h3 className="mt-4 text-sm font-semibold uppercase text-foreground">
        USA, UK, Australia, New Zealand, Singapore, Hong Kong
      </h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li>DDU free shipping (15&ndash;18 days), applicable customs/taxes payable on delivery</li>
        <li>DDP free shipping (25&ndash;28 days): $20 for orders under $250</li>
      </ul>

      <h3 className="mt-4 text-sm font-semibold uppercase text-foreground">UAE, Kuwait, Qatar, Oman</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li>Below ₹20,000: ₹1,999</li>
        <li>Above ₹20,000: ₹3,999</li>
      </ul>

      <h3 className="mt-4 text-sm font-semibold uppercase text-foreground">Canada, France, Germany, and others</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li>Below ₹10,000: ₹2,950</li>
        <li>Below ₹20,000: ₹4,590</li>
        <li>Below ₹35,000: ₹6,950</li>
        <li>Above ₹35,000: ₹8,950</li>
      </ul>

      <h2 className="font-heading mt-6 text-lg uppercase">Cash on delivery (India only)</h2>
      <p className="mt-2 text-muted">
        A ₹120 additional charge applies, and a 20% advance payment is required at checkout. If a COD order
        is refused or returned, the 20% advance and shipping charges are non-refundable.
      </p>

      <h2 className="font-heading mt-6 text-lg uppercase">Delivery timelines (from dispatch)</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li>Within India: 2&ndash;6 business days</li>
        <li>USA, UK, Canada, UAE, Australia: 3&ndash;6 business days</li>
        <li>Other countries: 5&ndash;7 business days</li>
      </ul>

      <h2 className="font-heading mt-6 text-lg uppercase">Packaging</h2>
      <p className="mt-2 text-muted">
        Every order is securely packed to ensure your items reach you safely and in perfect condition. We
        maintain discreet and eco-friendly packaging standards.
      </p>

      <h2 className="font-heading mt-6 text-lg uppercase">Customs, duties &amp; damaged packages</h2>
      <p className="mt-2 text-muted">
        Import duties, customs, and local taxes are not included in product prices and are the buyer&apos;s
        responsibility. Beautiful Mess does not deliver to P.O. boxes or freight forwarding addresses. If a
        package appears tampered, damaged, or opened, please do not accept delivery &mdash; take photos or
        videos and contact us within 24 hours.
      </p>

      <h2 className="font-heading mt-6 text-lg uppercase">Insurance</h2>
      <p className="mt-2 text-muted">
        All Beautiful Mess orders are insured against theft and damage during transit. Once a package is
        delivered and signed for, insurance coverage ends.
      </p>

      <h2 className="font-heading mt-6 text-lg uppercase">Tracking &amp; receiver information</h2>
      <p className="mt-2 text-muted">
        You&apos;ll receive email or WhatsApp updates with tracking numbers once your order ships. Please
        ensure the recipient&apos;s phone number and name are accurate &mdash; couriers may call to confirm
        delivery.
      </p>

      <h2 className="font-heading mt-6 text-lg uppercase">Delivery partners</h2>
      <p className="mt-2 text-muted">
        We work with trusted partners including DHL, Blue Dart, Aramex, FedEx, UPS, and DTDC.
      </p>

      <h2 className="font-heading mt-6 text-lg uppercase">Contact</h2>
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
