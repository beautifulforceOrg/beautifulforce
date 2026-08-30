import { db } from "@storeforge/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { POST } from "./route";

const EMAIL = "mobile-contact-test@example.com";

function contactRequest(body: unknown): Request {
  return new Request("http://localhost/api/mobile/contact", { method: "POST", body: JSON.stringify(body) });
}

async function cleanup() {
  await db.contactMessage.deleteMany({ where: { email: EMAIL } });
}

beforeEach(cleanup);
afterAll(cleanup);

describe("POST /api/mobile/contact", () => {
  it("stores a valid contact message", async () => {
    const response = await POST(contactRequest({ name: "Mobile Tester", email: EMAIL, comment: "Hello from mobile" }));
    expect(response.status).toBe(200);
    const stored = await db.contactMessage.findFirst({ where: { email: EMAIL } });
    expect(stored?.comment).toBe("Hello from mobile");
  });

  it("400s for an invalid email", async () => {
    const response = await POST(contactRequest({ name: "Mobile Tester", email: "not-an-email", comment: "Hi" }));
    expect(response.status).toBe(400);
  });

  it("400s for a missing comment", async () => {
    const response = await POST(contactRequest({ name: "Mobile Tester", email: EMAIL, comment: "" }));
    expect(response.status).toBe(400);
  });
});
