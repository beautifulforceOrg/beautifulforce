import { FounderStory } from "../founder-story";

// The real client site's dedicated About Us page has no body copy of its
// own -- but the real founder story (transcribed from the live site) does
// exist, just only on the homepage. Reusing that same real content here
// rather than inventing new brand copy for this page.
export default function AboutPage() {
  return (
    <main>
      <h1 className="font-heading mx-auto max-w-3xl px-6 pt-16 text-3xl text-foreground">About Us</h1>
      <FounderStory />
    </main>
  );
}
