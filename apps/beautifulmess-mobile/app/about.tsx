import { StaticPage } from "../components/static-page";

// The real web page (apps/beautifulmess/app/about/page.tsx) is genuinely
// this sparse -- just the heading; the founder story lives on the
// homepage, and the trust-badges band and footer render globally.
export default function AboutScreen() {
  return <StaticPage title="About Us" sections={[]} />;
}
