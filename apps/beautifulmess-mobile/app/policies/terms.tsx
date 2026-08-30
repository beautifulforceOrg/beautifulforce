import { StaticPage } from "../../components/static-page";

// Real text, transcribed from apps/beautifulmess/app/policies/terms/page.tsx.
export default function TermsOfServiceScreen() {
  return (
    <StaticPage
      title="Terms of Service"
      sections={[
        {
          paragraphs: [
            "Beautiful Mess, registered to Anitaa Manish, operates from 102 Railway Parallel Road, Bengaluru, Karnataka 560020, and designs and sells luxury children's lifestyle products.",
          ],
        },
        {
          heading: "1. Shipping & Delivery",
          bullets: [
            "Standard delivery takes 5-7 working days across India",
            "Estimated delivery times are provided upon order confirmation",
            "We are not liable for delays caused by weather, flight delays, political disruptions, or other unforeseen circumstances, and no compensation is provided for delays beyond our control",
          ],
        },
        {
          heading: "2. Modifications",
          paragraphs: ["Beautiful Mess reserves the right to update these terms without notice. Continued use of the site constitutes acceptance of the changes."],
        },
        {
          heading: "3. Eligibility",
          paragraphs: ["Only individuals capable of forming legally binding contracts may use this site. Users under 18 require parental or guardian involvement."],
        },
        {
          heading: "4. User Conduct",
          paragraphs: [
            "Users must provide accurate information; we may terminate an account if false information is discovered. You'll receive administrative and promotional emails by default and can unsubscribe at any time. Prohibited uses include transmitting unlawful content, unauthorized access, copyright infringement, and interfering with the site's network.",
          ],
        },
        { heading: "5. Privacy", paragraphs: ["Personal data is processed in accordance with our Privacy Policy."] },
        {
          heading: "6. Disclaimer of Warranties",
          paragraphs: ["Products are sold at your own risk. Color variations between product images and the actual item may occur due to differences between screens."],
        },
        {
          heading: "9. Transactions & Cancellations",
          bullets: [
            "Payment declines are not our responsibility",
            "Orders may be canceled due to limited inventory, pricing errors, or quality defects",
            "Refunds, where applicable, are processed within 15 working days",
            "Customers bear all applicable taxes, including GST",
          ],
        },
        {
          heading: "10. Customs & International Shipping",
          paragraphs: ["International delivery takes 15-30 working days. Customers are responsible for import duties assessed at delivery."],
        },
        {
          heading: "11. Return, Replacement & Refund",
          paragraphs: ["We only make one piece of one size in each style. As such, we do not exchange or refund any purchases. See our Refund Policy for details."],
        },
        {
          heading: "12. Shipping & Processing Fees",
          paragraphs: [
            "Regular delivery ranges from ₹100/kg (South India) to ₹150/kg (North India). Express options cost ₹200-250/kg. See our Shipping Policy for the full rate table.",
          ],
        },
        {
          heading: "13-21. Additional Provisions",
          bullets: [
            "You agree to indemnify Beautiful Mess against third-party claims arising from your use of the site",
            "These terms are governed by Indian law, with jurisdiction in Bangalore",
            "Grievances are addressed within 7 days",
            "Force majeure applies, but a lack of funds is not an excuse for non-performance",
            "Feedback you submit becomes the non-confidential property of Beautiful Mess",
          ],
        },
      ]}
    />
  );
}
