"use server";

import { submitContactFor, type SubmitContactResult } from "./contact-submission";

export type { SubmitContactResult };

export async function submitContactMessage(formData: FormData): Promise<SubmitContactResult> {
  return submitContactFor({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    comment: String(formData.get("comment") ?? ""),
  });
}
