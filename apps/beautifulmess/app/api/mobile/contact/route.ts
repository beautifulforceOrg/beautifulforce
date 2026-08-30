import { NextResponse } from "next/server";
import { submitContactFor } from "../../../../lib/contact-submission";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = await submitContactFor({
    name: typeof body?.name === "string" ? body.name : "",
    email: typeof body?.email === "string" ? body.email : "",
    phone: typeof body?.phone === "string" ? body.phone : undefined,
    comment: typeof body?.comment === "string" ? body.comment : "",
  });

  if (result.error) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
