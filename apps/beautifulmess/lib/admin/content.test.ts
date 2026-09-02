import { db } from "@storeforge/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createFaqItem, createTestimonial, deleteFaqItem, deleteTestimonial, listFaqItems, listTestimonials } from "./content";

const NAME = "Content Test Customer";
const QUESTION = "Content test question?";

async function cleanup() {
  await db.testimonial.deleteMany({ where: { name: NAME } });
  await db.faqItem.deleteMany({ where: { question: QUESTION } });
}

beforeEach(cleanup);
afterAll(cleanup);

describe("testimonials", () => {
  it("creates and lists a testimonial, ordered by position", async () => {
    await createTestimonial(NAME, "Second", 2);
    const testimonial = await createTestimonial(NAME, "First", 1);

    const list = await listTestimonials();
    const filtered = list.filter((t) => t.name === NAME);
    expect(filtered.map((t) => t.quote)).toEqual(["First", "Second"]);
    expect(testimonial.quote).toBe("First");
  });

  it("deletes a testimonial", async () => {
    const testimonial = await createTestimonial(NAME, "To delete");
    await deleteTestimonial(testimonial.id);
    const list = await listTestimonials();
    expect(list.find((t) => t.id === testimonial.id)).toBeUndefined();
  });
});

describe("FAQ items", () => {
  it("creates and lists an FAQ item, ordered by position", async () => {
    await createFaqItem(QUESTION, "Second answer", 2);
    const item = await createFaqItem(QUESTION, "First answer", 1);

    const list = await listFaqItems();
    const filtered = list.filter((f) => f.question === QUESTION);
    expect(filtered.map((f) => f.answer)).toEqual(["First answer", "Second answer"]);
    expect(item.answer).toBe("First answer");
  });

  it("deletes an FAQ item", async () => {
    const item = await createFaqItem(QUESTION, "To delete");
    await deleteFaqItem(item.id);
    const list = await listFaqItems();
    expect(list.find((f) => f.id === item.id)).toBeUndefined();
  });
});
