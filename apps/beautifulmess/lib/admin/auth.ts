import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@storeforge/db";
import { hashPassword, verifyPassword } from "../auth";
import { createSessionToken, verifySessionToken } from "../session-token";

// Separate from the customer's bm_session cookie (never a shared-prefix
// name like bm_session_admin, to avoid any substring-match bugs) -- a
// browser holding both a customer and an admin session must never let
// one be mistaken for the other.
const ADMIN_SESSION_COOKIE = "bm_admin_session";
// Materially shorter than the customer's 30-day session: a leaked admin
// cookie exposes full order/PII access and product/discount write access.
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

function allowedAdminEmails(): string[] {
  const raw = process.env.ADMIN_ALLOWED_EMAILS ?? "";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdminEmail(email: string): boolean {
  return allowedAdminEmails().includes(email.trim().toLowerCase());
}

/**
 * Checks the allowlist, the account lock, and the password, in that
 * order. Never distinguishes "email not found" from "wrong password" in
 * its return value -- the caller renders one generic error either way,
 * avoiding user enumeration even though this list is only two people.
 */
export async function authenticateAdmin(email: string, password: string): Promise<string | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!isAllowedAdminEmail(normalizedEmail)) return null;

  const admin = await db.adminUser.findUnique({ where: { email: normalizedEmail } });
  if (!admin) return null;

  if (admin.lockedUntil && admin.lockedUntil > new Date()) return null;

  if (!verifyPassword(password, admin.passwordHash)) {
    const failedAttempts = admin.failedAttempts + 1;
    const lockedUntil =
      failedAttempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null;
    await db.adminUser.update({
      where: { id: admin.id },
      data: { failedAttempts: lockedUntil ? 0 : failedAttempts, lockedUntil },
    });
    return null;
  }

  if (admin.failedAttempts > 0 || admin.lockedUntil) {
    await db.adminUser.update({ where: { id: admin.id }, data: { failedAttempts: 0, lockedUntil: null } });
  }

  return admin.id;
}

export async function createAdminSession(adminUserId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    ADMIN_SESSION_COOKIE,
    createSessionToken(adminUserId, Date.now(), ADMIN_SESSION_MAX_AGE_SECONDS),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
      path: "/",
    }
  );
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

/**
 * Bridges a logged-in customer session into the admin dashboard when that
 * customer's email is both allowlisted and has a real AdminUser row --
 * lets the "Admin" tab in the site header skip the separate admin
 * password entirely for someone who is already both. Deliberately does
 * NOT relax anything else: a non-matching customer, or one whose email
 * was later removed from ADMIN_ALLOWED_EMAILS, still gets nothing.
 */
async function findAdminUserForCustomer(customerId: string) {
  const customer = await db.customer.findUnique({ where: { id: customerId }, select: { email: true } });
  if (!customer) return null;
  const email = customer.email.trim().toLowerCase();
  if (!isAllowedAdminEmail(email)) return null;
  return db.adminUser.findUnique({ where: { email } });
}

export async function isCustomerAnAdmin(customerId: string): Promise<boolean> {
  return (await findAdminUserForCustomer(customerId)) !== null;
}

/** Used by app/admin/enter/route.ts -- writes the real admin session cookie. */
export async function establishAdminSessionForCustomer(customerId: string): Promise<boolean> {
  const admin = await findAdminUserForCustomer(customerId);
  if (!admin) return false;
  await createAdminSession(admin.id);
  return true;
}

export async function getSessionAdminId(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!raw) return null;
  return verifySessionToken(raw);
}

/** For server components (pages) -- redirects rather than throwing. */
export async function requireAdmin(): Promise<string> {
  const adminId = await getSessionAdminId();
  if (!adminId) redirect("/admin/login");
  return adminId;
}

/** For Server Actions / route handlers, where redirect() isn't the right response. */
export async function requireAdminOrThrow(): Promise<string> {
  const adminId = await getSessionAdminId();
  if (!adminId) throw new Error("Unauthorized");
  return adminId;
}

export { hashPassword };
