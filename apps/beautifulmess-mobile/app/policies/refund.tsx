import { StaticPage } from "../../components/static-page";

// Real text, transcribed from apps/beautifulmess/app/policies/refund/page.tsx.
export default function RefundPolicyScreen() {
  return (
    <StaticPage
      title="Refund Policy"
      sections={[
        {
          paragraphs: [
            "Concerned to protect children's hygiene and safety, we do not accept returns or exchanges on any items. We only make one piece of one size in each style, so we're unable to exchange or refund purchases for that reason either.",
            "We are a pure ready-to-wear brand, but we do offer free alterations.",
            "Where a refund is due (a canceled order, a quality defect confirmed on our side), it is processed within 15 working days. See our Terms of Service for the full cancellation terms.",
            "Questions about a specific order? Write to us at online.beautifulmess@gmail.com.",
          ],
        },
      ]}
    />
  );
}
