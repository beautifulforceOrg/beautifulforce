import { db } from "@storeforge/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { addTicketComment, createTicket, getTicket, listTickets, setTicketStatus } from "./tickets";

const EMAIL = "admin-tickets-test@example.com";
const EMAIL_2 = "admin-tickets-test-2@example.com";

let adminId: string;
let adminId2: string;

async function cleanup() {
  await db.ticket.deleteMany({ where: { createdBy: { email: { in: [EMAIL, EMAIL_2] } } } });
  await db.adminUser.deleteMany({ where: { email: { in: [EMAIL, EMAIL_2] } } });
}

beforeEach(async () => {
  await cleanup();
  const admin = await db.adminUser.create({ data: { email: EMAIL, passwordHash: "irrelevant" } });
  const admin2 = await db.adminUser.create({ data: { email: EMAIL_2, passwordHash: "irrelevant" } });
  adminId = admin.id;
  adminId2 = admin2.id;
});

afterAll(cleanup);

describe("createTicket / listTickets / getTicket", () => {
  it("creates a ticket and lists it", async () => {
    const created = await createTicket(adminId, { subject: "Fix the footer", description: "It's broken", category: "BUG" });
    const tickets = await listTickets();
    expect(tickets.map((t) => t.id)).toContain(created.id);
  });

  it("filters by status and category", async () => {
    const created = await createTicket(adminId, { subject: "Add a feature", description: "Please", category: "FEATURE" });

    expect((await listTickets({ category: "FEATURE" })).map((t) => t.id)).toContain(created.id);
    expect((await listTickets({ category: "BUG" })).map((t) => t.id)).not.toContain(created.id);
    expect((await listTickets({ status: "OPEN" })).map((t) => t.id)).toContain(created.id);
  });

  it("another admin can comment on a ticket filed by a different admin", async () => {
    const created = await createTicket(adminId, { subject: "Change the logo", description: "Too small", category: "CHANGE" });
    await addTicketComment(created.id, adminId2, "On it, will update tomorrow.");

    const ticket = await getTicket(created.id);
    expect(ticket?.comments).toHaveLength(1);
    expect(ticket?.comments[0]?.author.email).toBe(EMAIL_2);
  });

  it("changes a ticket's status", async () => {
    const created = await createTicket(adminId, { subject: "Bug", description: "Details", category: "BUG" });
    await setTicketStatus(created.id, "RESOLVED");

    expect((await getTicket(created.id))?.status).toBe("RESOLVED");
  });
});
