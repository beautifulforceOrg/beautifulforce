// One-time migration of the homepage's real testimonials/FAQ (previously
// hardcoded in app/page.tsx) into the database, now that they're managed
// from /admin/content. Idempotent: upserts by the same unique-in-practice
// text, safe to re-run.
import { db } from "@storeforge/db";

const TESTIMONIALS = [
  {
    name: "Anjali Gautham",
    quote:
      "The one stop for all mother's to make daughter Princess. Unique collection and nothing is repeated. From accessories to return favors for your darling Princess.",
  },
  {
    name: "Ashim Lakhpat",
    quote:
      "Great place to shop for kids clothes. The folks that own the place are very warm, helpful and knowledgeable. I highly recommend this place.",
  },
  {
    name: "Hitesh Malhotra",
    quote:
      "The collection of clothes at this place is very elegant, and stylish. Manish and Anita, the store owners, provided extra care and attention to pick the perfect clothes for the occasion.",
  },
  {
    name: "Pooja Chhajer",
    quote:
      "Amazing stylish clothes and accessories, alluring ambiance, My Daughter was loaded with compliments for her dressing from Beautiful Mess.",
  },
];

const FAQ = [
  {
    question: "What is the return policy?",
    answer: "Concerned to protect children's hygiene and safety, we do not accept returns or exchanges on any items.",
  },
  {
    question: "Can you customise the pieces to size as per body measurements?",
    answer: "We are a pure ready-to-wear brand, but we do offer free alterations.",
  },
  {
    question: "How do we maintain the dresses?",
    answer: "Recommended to dry clean for the first time at least, followed by regular machine wash at home.",
  },
  {
    question: "Do you have an offline store presence?",
    answer: "Yes, our flagship store is at Kumara Park West, Bangalore.",
  },
];

async function main() {
  const existingTestimonials = await db.testimonial.count();
  if (existingTestimonials === 0) {
    await db.testimonial.createMany({
      data: TESTIMONIALS.map((t, i) => ({ ...t, position: i })),
    });
    console.log(`Seeded ${TESTIMONIALS.length} testimonials.`);
  } else {
    console.log(`Skipped testimonials -- ${existingTestimonials} already exist.`);
  }

  const existingFaq = await db.faqItem.count();
  if (existingFaq === 0) {
    await db.faqItem.createMany({
      data: FAQ.map((f, i) => ({ ...f, position: i })),
    });
    console.log(`Seeded ${FAQ.length} FAQ items.`);
  } else {
    console.log(`Skipped FAQ items -- ${existingFaq} already exist.`);
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
