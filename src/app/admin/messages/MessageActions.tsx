"use client";

import { useTransition } from "react";
import { setMessageStatus } from "./actions";

export function MessageActions({ id, status }: { id: string; status: "NEW" | "READ" | "ARCHIVED" }) {
  const [pending, start] = useTransition();
  const act = (next: "NEW" | "READ" | "ARCHIVED") => start(() => void setMessageStatus(id, next));

  return (
    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
      {status !== "READ" && status !== "ARCHIVED" && (
        <button className="btn btn-ghost btn-sm" disabled={pending} onClick={() => act("READ")}>
          Mark read
        </button>
      )}
      {status === "READ" && (
        <button className="btn btn-ghost btn-sm" disabled={pending} onClick={() => act("NEW")}>
          Mark unread
        </button>
      )}
      {status !== "ARCHIVED" ? (
        <button className="btn btn-ghost btn-sm" disabled={pending} onClick={() => act("ARCHIVED")}>
          Archive
        </button>
      ) : (
        <button className="btn btn-ghost btn-sm" disabled={pending} onClick={() => act("READ")}>
          Restore
        </button>
      )}
    </div>
  );
}
