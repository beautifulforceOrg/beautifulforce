"use server";

import { db } from "@storeforge/db";
import { isValidEmail } from "./email";

export interface SubmitContactResult {
  error?: string;
}

export async function submitContactMessage(formData: FormData): Promise<SubmitContactResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const comment = String(formData.get("comment") ?? "").trim();

  if (!name) {
    return { error: "Please enter your name." };
  }
  if (!isValidEmail(email)) {
    return { error: "Please enter a valid email address." };
  }
  if (!comment) {
    return { error: "Please enter a message." };
  }

  // Stored so a submission is never silently lost -- there's no
  // transactional email provider wired up yet to also notify the
  // merchant in real time, same category of gap as Razorpay/Shiprocket
  // needing a real vendor account before they could be fully wired up.
  await db.contactMessage.create({
    data: { name, email, phone: phone || null, comment },
  });

  return {};
}
