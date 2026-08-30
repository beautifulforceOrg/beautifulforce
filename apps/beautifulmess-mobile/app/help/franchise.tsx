import { StaticPage } from "../../components/static-page";

// Real text, transcribed from apps/beautifulmess/app/help/franchise/page.tsx.
export default function FranchiseScreen() {
  return (
    <StaticPage
      title="Franchise"
      sections={[
        {
          paragraphs: [
            "Why a Beautiful Mess by Ann franchise? Empower your business with children's luxury fashion.",
            "At Beautiful Mess, we believe that every child deserves to be styled with elegance, creativity, and comfort. As a leading brand in children's luxury apparel and accessories, we are excited to expand our footprint through franchising. Join us and become part of a thriving network dedicated to redefining kids' fashion.",
          ],
        },
        {
          heading: "Why Franchise With Beautiful Mess?",
          bullets: [
            "A trusted brand: established reputation in children's luxury fashion with high-quality, honest materials",
            "Comprehensive support: from training, marketing, and operations to inventory management, we guide our franchise partners every step of the way",
            "Innovative designs: stay ahead of trends with our monthly new collections, exclusive designs, and classic timeless styles",
            "Profitability & growth: tap into a growing market with a brand that values excellence, creativity, and customer satisfaction",
          ],
        },
        {
          heading: "What We Look For",
          bullets: [
            "Passionate entrepreneurs with a love for children's fashion",
            "Strong understanding of retail and customer service",
            "Commitment to maintaining our brand standards",
            "A strategic mindset for business growth",
          ],
        },
        {
          heading: "Become a Franchise Partner",
          paragraphs: [
            "Ready to grow with us? Explore the opportunity to bring Beautiful Mess to your city. Email us at beautifulmessbyann@gmail.com or call +91 8088339455 to discuss your interest and learn more about our franchise model.",
          ],
        },
      ]}
    />
  );
}
