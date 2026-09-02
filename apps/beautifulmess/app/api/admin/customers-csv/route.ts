import { NextResponse } from "next/server";
import { requireAdminOrThrow } from "../../../../lib/admin/auth";
import { customersToCsv, listCustomers } from "../../../../lib/admin/customers";

// Outside app/admin/(guarded)/ (a route.ts can't share a segment with that
// group's page.tsx), so middleware.ts's /admin/:path* matcher and the
// guarded layout's requireAdmin() don't cover it -- this checks directly.
export async function GET() {
  await requireAdminOrThrow();

  const customers = await listCustomers();
  const csv = customersToCsv(customers);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="customers.csv"',
    },
  });
}
