import { listFaqItems, listTestimonials } from "../../../../lib/admin/content";
import { ContentClient } from "./content-client";

export default async function AdminContentPage() {
  const [testimonials, faqItems] = await Promise.all([listTestimonials(), listFaqItems()]);
  return <ContentClient initialTestimonials={testimonials} initialFaqItems={faqItems} />;
}
