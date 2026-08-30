import { db } from "@storeforge/db";
import { isValidEmail } from "./email";

export interface SubmitContactInput {
  name: string;
  email: string;
  phone?: string;
  comment: string;
}

export interface SubmitContactResult {
  error?: string;
}

// Shared by the web Server Action (lib/contact-actions.ts) and
// app/api/mobile/contact/route.ts -- same "one function, two transport
// wrappers" pattern as the rest of app/api/mobile/**.
export async function submitContactFor(input: SubmitContactInput): Promise<SubmitContactResult> {
  const name = input.name.trim();
  const email = input.email.trim();
  const phone = input.phone?.trim() ?? "";
  const comment = input.comment.trim();

  if (!name) {
    return { error: "Please enter your name." };
  }
  if (!isValidEmail(email)) {
    return { error: "Please enter a valid email address." };
  }
  if (!comment) {
    return { error: "Please enter a message." };
  }

  await db.contactMessage.create({
    data: { name, email, phone: phone || null, comment },
  });

  return {};
}
