import { db, type FaqItem, type Testimonial } from "@storeforge/db";

export async function listTestimonials(): Promise<Testimonial[]> {
  return db.testimonial.findMany({ orderBy: { position: "asc" } });
}

export async function createTestimonial(name: string, quote: string, position = 0): Promise<Testimonial> {
  return db.testimonial.create({ data: { name, quote, position } });
}

export async function deleteTestimonial(id: string): Promise<void> {
  await db.testimonial.delete({ where: { id } });
}

export async function listFaqItems(): Promise<FaqItem[]> {
  return db.faqItem.findMany({ orderBy: { position: "asc" } });
}

export async function createFaqItem(question: string, answer: string, position = 0): Promise<FaqItem> {
  return db.faqItem.create({ data: { question, answer, position } });
}

export async function deleteFaqItem(id: string): Promise<void> {
  await db.faqItem.delete({ where: { id } });
}
