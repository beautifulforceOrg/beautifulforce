"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DataTable, useToast } from "@storeforge/ui";
import type { listContactMessages } from "../../../../lib/admin/contact";
import { markContactHandledAction } from "./actions";

type ContactMessage = Awaited<ReturnType<typeof listContactMessages>>[number];

export function ContactClient({ initialMessages }: { initialMessages: ContactMessage[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showHandled, setShowHandled] = useState(false);

  const visible = showHandled ? initialMessages : initialMessages.filter((m) => !m.handledAt);

  function handleMarkHandled(id: string) {
    startTransition(async () => {
      await markContactHandledAction(id);
      showToast("Marked handled.");
      router.refresh();
    });
  }

  return (
    <main>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-heading text-2xl uppercase text-foreground">Contact messages</h2>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={showHandled} onChange={(e) => setShowHandled(e.target.checked)} />
          Show handled
        </label>
      </div>
      <DataTable
        rowKey={(message) => message.id}
        rows={visible}
        columns={[
          { header: "Name", cell: (message) => message.name },
          { header: "Email", cell: (message) => message.email },
          { header: "Message", cell: (message) => message.comment },
          { header: "Received", cell: (message) => message.createdAt.toLocaleDateString() },
          {
            header: "",
            cell: (message) =>
              message.handledAt ? (
                <span className="text-muted">Handled</span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleMarkHandled(message.id)}
                  disabled={isPending}
                  className="text-brand underline"
                >
                  Mark handled
                </button>
              ),
          },
        ]}
        emptyMessage="No unhandled messages."
      />
    </main>
  );
}
