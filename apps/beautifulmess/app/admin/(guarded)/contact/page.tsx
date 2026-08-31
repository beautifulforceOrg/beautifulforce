import { listContactMessages } from "../../../../lib/admin/contact";
import { ContactClient } from "./contact-client";

export default async function AdminContactPage() {
  const messages = await listContactMessages();
  return <ContactClient initialMessages={messages} />;
}
