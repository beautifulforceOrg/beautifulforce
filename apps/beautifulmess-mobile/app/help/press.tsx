import { StaticPage } from "../../components/static-page";

// Real text, transcribed from apps/beautifulmess/app/help/press/page.tsx.
export default function PressScreen() {
  return (
    <StaticPage
      title="PR & Events"
      sections={[
        {
          paragraphs: [
            'Featured in "Varaabysk Editorial Magazine 2023 Edit"',
            "For press and media inquiries, write to us at online.beautifulmess@gmail.com.",
          ],
        },
      ]}
    />
  );
}
