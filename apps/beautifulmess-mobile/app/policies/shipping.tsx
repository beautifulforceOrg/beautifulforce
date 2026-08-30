import { StaticPage } from "../../components/static-page";

// Real text, transcribed from apps/beautifulmess/app/policies/shipping/page.tsx.
export default function ShippingPolicyScreen() {
  return (
    <StaticPage
      title="Shipping Policy"
      sections={[
        {
          heading: "Do you ship worldwide?",
          paragraphs: [
            "Yes! Beautiful Mess ships to over 200 countries. All our products are made in India and dispatched from our fulfillment center in Jaipur.",
          ],
        },
        {
          heading: "Shipping charges within India",
          paragraphs: ["Standard delivery (15-18 days, ready-to-ship): ₹299 flat shipping across India.", "Express delivery, by order value:"],
          bullets: [
            "Below ₹3,500: ₹399",
            "₹3,501 - ₹8,000: ₹650",
            "₹8,001 - ₹15,000: ₹1,200",
            "₹15,001 - ₹22,000: ₹1,599",
            "₹22,001 - ₹30,000: ₹2,000",
            "₹30,001 - ₹40,000: ₹2,999",
            "Above ₹40,001: ₹3,999",
          ],
        },
        {
          heading: "International orders",
          paragraphs: [
            "Standard delivery takes 15-18 days for ready-to-ship items and custom pieces. International Cash on Delivery is currently unavailable. Please provide a complete physical address -- couriers such as DHL, FedEx, and UPS do not deliver to P.O. boxes.",
          ],
        },
        {
          heading: "USA, UK, Australia, New Zealand, Singapore, Hong Kong",
          bullets: ["DDU free shipping (15-18 days), applicable customs/taxes payable on delivery", "DDP free shipping (25-28 days): $20 for orders under $250"],
        },
        {
          heading: "UAE, Kuwait, Qatar, Oman",
          bullets: ["Below ₹20,000: ₹1,999", "Above ₹20,000: ₹3,999"],
        },
        {
          heading: "Canada, France, Germany, and others",
          bullets: ["Below ₹10,000: ₹2,950", "Below ₹20,000: ₹4,590", "Below ₹35,000: ₹6,950", "Above ₹35,000: ₹8,950"],
        },
        {
          heading: "Cash on delivery (India only)",
          paragraphs: [
            "A ₹120 additional charge applies, and a 20% advance payment is required at checkout. If a COD order is refused or returned, the 20% advance and shipping charges are non-refundable.",
          ],
        },
        {
          heading: "Delivery timelines (from dispatch)",
          bullets: ["Within India: 2-6 business days", "USA, UK, Canada, UAE, Australia: 3-6 business days", "Other countries: 5-7 business days"],
        },
        {
          heading: "Packaging",
          paragraphs: [
            "Every order is securely packed to ensure your items reach you safely and in perfect condition. We maintain discreet and eco-friendly packaging standards.",
          ],
        },
        {
          heading: "Customs, duties & damaged packages",
          paragraphs: [
            "Import duties, customs, and local taxes are not included in product prices and are the buyer's responsibility. Beautiful Mess does not deliver to P.O. boxes or freight forwarding addresses. If a package appears tampered, damaged, or opened, please do not accept delivery -- take photos or videos and contact us within 24 hours.",
          ],
        },
        {
          heading: "Insurance",
          paragraphs: [
            "All Beautiful Mess orders are insured against theft and damage during transit. Once a package is delivered and signed for, insurance coverage ends.",
          ],
        },
        {
          heading: "Tracking & receiver information",
          paragraphs: [
            "You'll receive email or WhatsApp updates with tracking numbers once your order ships. Please ensure the recipient's phone number and name are accurate -- couriers may call to confirm delivery.",
          ],
        },
        {
          heading: "Delivery partners",
          paragraphs: ["We work with trusted partners including DHL, Blue Dart, Aramex, FedEx, UPS, and DTDC."],
        },
        {
          heading: "Contact",
          paragraphs: [
            "102, Railway Parallel Road, 6th Cross, Kumara Park West, Bengaluru, Karnataka 560020",
            "online.beautifulmess@gmail.com · +91 8088339455 · Monday-Saturday, 12:00PM-7:00PM IST",
          ],
        },
      ]}
    />
  );
}
