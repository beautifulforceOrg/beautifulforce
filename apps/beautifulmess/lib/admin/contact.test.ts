import { db } from "@storeforge/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { listContactMessages, markContactHandled } from "./contact";

const EMAIL = "admin-contact-test@example.com";

let messageId: string;

async function cleanup() {
  await db.contactMessage.deleteMany({ where: { email: EMAIL } });
}

beforeEach(async () => {
  await cleanup();
  const message = await db.contactMessage.create({
    data: { name: "Admin Contact Test", email: EMAIL, comment: "A question." },
  });
  messageId = message.id;
});

afterAll(cleanup);

describe("listContactMessages / markContactHandled", () => {
  it("lists messages, unhandled by default", async () => {
    const messages = await listContactMessages();
    const found = messages.find((m) => m.id === messageId);
    expect(found?.handledAt).toBeNull();
  });

  it("marks a message handled", async () => {
    await markContactHandled(messageId);
    const message = await db.contactMessage.findUniqueOrThrow({ where: { id: messageId } });
    expect(message.handledAt).not.toBeNull();
  });
});
