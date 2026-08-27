const ADDRESS = "102, Railway Parallel Road, 6th Cross, Kumara Park West, Bengaluru, Karnataka 560020";
const MAP_SRC = `https://www.google.com/maps?q=${encodeURIComponent(ADDRESS)}&output=embed`;

export default function ContactPage() {
  return (
    <main>
      <div className="aspect-[16/6] w-full">
        <iframe
          src={MAP_SRC}
          title="Beautiful Mess flagship store location"
          className="h-full w-full border-0"
          loading="lazy"
        />
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:grid-cols-2">
        <div>
          <h1 className="font-heading mb-4 text-2xl uppercase text-foreground">Welcome to our flagship store</h1>
          <p className="text-sm text-muted">{ADDRESS}</p>

          <p className="mt-6 text-sm text-foreground">
            <span className="font-medium">Queries &amp; helpline</span>{" "}
            <a href="tel:+918088339455" className="text-brand underline">
              +91 8088339455
            </a>
          </p>
          <p className="mt-2 text-sm text-foreground">
            <span className="font-medium">Email:</span>{" "}
            <a href="mailto:online.beautifulmess@gmail.com" className="text-brand underline">
              online.beautifulmess@gmail.com
            </a>
          </p>

          <p className="mt-6 text-sm font-medium uppercase text-foreground">Customer service</p>
          <p className="text-sm text-muted">12 PM to 5 PM · Saturday / Sunday Holiday</p>

          <p className="mt-4 text-sm font-medium uppercase text-foreground">Timings for flagship store</p>
          <p className="text-sm text-muted">12 PM to 7 PM · Sunday Holiday</p>
        </div>

        <div>
          <h2 className="font-heading mb-4 text-lg uppercase text-foreground">Any queries or feedback</h2>
          <form action="mailto:online.beautifulmess@gmail.com" method="post" encType="text/plain" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="Name"
                required
                placeholder="Name"
                className="rounded-[var(--sf-radius,0.5rem)] border border-border px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted"
              />
              <input
                type="email"
                name="Email"
                required
                placeholder="Email"
                className="rounded-[var(--sf-radius,0.5rem)] border border-border px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted"
              />
            </div>
            <input
              type="tel"
              name="Phone"
              placeholder="Phone"
              className="w-full rounded-[var(--sf-radius,0.5rem)] border border-border px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted"
            />
            <textarea
              name="Comment"
              rows={5}
              placeholder="Comment"
              className="w-full rounded-[var(--sf-radius,0.5rem)] border border-border px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted"
            />
            <button
              type="submit"
              className="rounded-[var(--sf-radius,0.5rem)] bg-brand px-6 py-3 text-sm font-medium uppercase text-brand-foreground"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
