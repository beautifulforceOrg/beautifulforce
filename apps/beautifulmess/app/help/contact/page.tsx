export default function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-heading mb-8 text-3xl uppercase text-foreground">Contact</h1>
      <dl className="space-y-4 text-sm text-foreground">
        <div>
          <dt className="font-medium uppercase text-muted">Store address</dt>
          <dd className="mt-1">
            102, Railway Parallel Road, 6th Cross, Kumara Park West, Bengaluru, Karnataka 560020
          </dd>
        </div>
        <div>
          <dt className="font-medium uppercase text-muted">Phone</dt>
          <dd className="mt-1">+91 8088339455</dd>
        </div>
        <div>
          <dt className="font-medium uppercase text-muted">Email</dt>
          <dd className="mt-1">online.beautifulmess@gmail.com</dd>
        </div>
        <div>
          <dt className="font-medium uppercase text-muted">Store hours</dt>
          <dd className="mt-1">12:00PM - 7:00PM · Sunday Holiday</dd>
        </div>
      </dl>
    </main>
  );
}
