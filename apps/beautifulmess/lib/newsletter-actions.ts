"use server";

import { db } from "@storeforge/db";
import { isValidEmail } from "./email";

export interface SubscribeResult {
  error?: string;
}

export async function subscribeToNewsletter(formData: FormData): Promise<SubscribeResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!isValidEmail(email)) {
    return { error: "Please enter a valid email address." };
  }

  // Re-subscribing is a harmless no-op, not an error -- email is unique.
  await db.newsletterSubscriber.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  return {};
}
