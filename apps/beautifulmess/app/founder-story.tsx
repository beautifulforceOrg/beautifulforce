import Image from "next/image";

// Real, transcribed founder story -- shared by the homepage and the About
// Us page (which previously had no body copy of its own even though this
// exact content already existed on the homepage).
const FOUNDER_IMAGE = "https://ik.imagekit.io/beautifulforce/beautifulmess/WhatsApp_Image_2026-07-09_at_15.23.34.jpg";

export function FounderStory() {
  return (
    <section className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 px-6 py-16 md:grid-cols-2">
      <div>
        <h2 className="font-heading mb-4 text-2xl text-foreground">Anitaa Manish (Founder)</h2>
        <p className="text-sm text-muted">
          Meet Anitaa Manish, the heart and soul behind Beautiful Mess. Anitaa&apos;s journey in fashion began
          uniquely, initially as a jewelry designer where she developed her keen eye for style and aesthetics.
        </p>
        <p className="mt-4 text-sm text-muted">
          Her passion for children and design inspired her to overcome numerous challenges and pursue her
          entrepreneurial dream.
        </p>
        <p className="mt-4 text-sm text-muted">
          Fueled by her love for fashion and children, Anitaa founded Beautiful Mess with a vision to blend
          playful elegance with childhood joy. Her dedication to celebrating each child&apos;s individuality is
          evident in every stylish, high-quality piece that carries the Beautiful Mess name.
        </p>
      </div>
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[var(--sf-radius,0.5rem)]">
        <Image
          src={FOUNDER_IMAGE}
          alt="Anitaa Manish, founder of Beautiful Mess"
          fill
          sizes="(min-width: 768px) 40vw, 100vw"
          className="object-cover"
        />
      </div>
    </section>
  );
}
