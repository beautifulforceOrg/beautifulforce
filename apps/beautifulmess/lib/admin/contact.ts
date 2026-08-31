import { db } from "@storeforge/db";

export async function listContactMessages() {
  return db.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
}

export async function markContactHandled(id: string): Promise<void> {
  await db.contactMessage.update({ where: { id }, data: { handledAt: new Date() } });
}
