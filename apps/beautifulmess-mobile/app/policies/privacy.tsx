import { StaticPage } from "../../components/static-page";

// Real text, transcribed from apps/beautifulmess/app/policies/privacy/page.tsx.
export default function PrivacyPolicyScreen() {
  return (
    <StaticPage
      title="Privacy Policy"
      sections={[
        {
          heading: "Information We Collect",
          paragraphs: [
            "Our site automatically collects \"Device Information\" including your IP address, browser type, and cookies. When you make a purchase, we also gather \"Order Information\" such as your name, address, payment details, and email.",
          ],
        },
        {
          heading: "How We Use Your Data",
          paragraphs: ["Personal information is used to:"],
          bullets: [
            "Process orders and payments",
            "Communicate with customers",
            "Screen for fraud",
            "Provide targeted advertising (with consent)",
            "Improve site functionality through analytics",
          ],
        },
        {
          heading: "Third-Party Sharing",
          paragraphs: [
            "Data is shared with service providers including our platform provider, analytics, and payment processors.",
            "You can opt out of targeted ads through Facebook, Google, and Bing's own privacy settings.",
          ],
        },
        {
          heading: "Your Rights",
          paragraphs: [
            "European residents can request access, correction, or deletion of their personal data. You can opt out of marketing emails via the unsubscribe link in any email we send.",
          ],
        },
        {
          heading: "Data Retention",
          paragraphs: [
            'Order information is retained unless you request its deletion. We do not honor "Do Not Track" browser signals. This policy does not cover third-party websites we may link to.',
          ],
        },
        {
          heading: "Governing Law & Contact",
          paragraphs: [
            "This policy is governed by Indian law. For questions, write to online.beautifulmess@gmail.com or reach us at 102, Railway Parallel Road, 6th Cross, Kumara Park West, Bengaluru, Karnataka 560020.",
          ],
        },
      ]}
    />
  );
}
