"use server";

import { redirect } from "next/navigation";
import { authenticateAdmin, createAdminSession, destroyAdminSession } from "./auth";

export interface AdminAuthResult {
  error?: string;
}

export async function adminLogIn(formData: FormData): Promise<AdminAuthResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const adminId = await authenticateAdmin(email, password);
  if (!adminId) {
    // Never distinguish "not an admin" / "wrong password" / "locked out"
    // in the response -- avoid enumeration even though this list is only
    // two people.
    return { error: "Invalid credentials." };
  }

  await createAdminSession(adminId);
  redirect("/admin");
}

export async function adminLogOut(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin/login");
}
