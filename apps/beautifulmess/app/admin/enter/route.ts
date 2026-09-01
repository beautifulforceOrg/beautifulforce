import { NextResponse } from "next/server";
import { establishAdminSessionForCustomer } from "../../../lib/admin/auth";
import { getSessionCustomerId } from "../../../lib/auth";

// Target of the site header's "Admin" tab (opened in a new browser tab) --
// bridges an already-logged-in customer session straight into the admin
// dashboard when that customer's email is also an allowlisted AdminUser,
// with no second password prompt. Falls back to the normal admin login
// page for anyone else (not logged in as a customer, or a customer whose
// email isn't an admin).
export async function GET(request: Request) {
  const customerId = await getSessionCustomerId();
  const becameAdmin = customerId ? await establishAdminSessionForCustomer(customerId) : false;
  return NextResponse.redirect(new URL(becameAdmin ? "/admin" : "/admin/login", request.url));
}
