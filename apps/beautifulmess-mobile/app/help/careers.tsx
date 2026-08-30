import { StaticPage } from "../../components/static-page";

// Real text, transcribed from apps/beautifulmess/app/help/careers/page.tsx.
export default function CareersScreen() {
  return (
    <StaticPage
      title="Build Your Career"
      sections={[
        {
          paragraphs: [
            "Join the Beautiful Mess Team",
            "Beautiful Mess stands for thoughtful, stylish children's luxury apparel designed with care and creativity. Our success stems from the passion and brilliance of our team, who thrive in an inspiring and dynamic environment that encourages both personal growth and professional achievement. At Beautiful Mess, you don't just work -- you lead, innovate, and make a meaningful difference in children's luxury fashion.",
          ],
        },
        {
          heading: "What We Seek",
          paragraphs: [
            "We look for passionate, imaginative individuals committed to excellence and creativity. Team players who push boundaries with integrity, who are collaborative, and who value strong relationships and thoughtful craftsmanship.",
          ],
        },
        {
          heading: "What We Offer",
          paragraphs: [
            "At Beautiful Mess, you'll be empowered with responsibility and leadership opportunities that foster your growth. Work across multiple channels and disciplines in a diverse and inclusive workplace where talent is celebrated and rewarded. Embark on your career journey with India's emerging leader in children's luxury fashion.",
          ],
        },
        {
          heading: "Careers",
          paragraphs: [
            "If you are excited to be part of the Beautiful Mess family, please share your resume with us at beautifulmessbyann@gmail.com. Mention the role you're interested in and your preferred location (Bangalore/Hyderabad). You may also contact us at +91 8088339455.",
          ],
        },
      ]}
    />
  );
}
