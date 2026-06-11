// Status → badge class + label mapping. Ported from biz.statusMeta().
// Pure: safe on client and server.

export type BadgeClass =
  | "badge-neutral"
  | "badge-amber"
  | "badge-green"
  | "badge-red"
  | "badge-blue"
  | "badge-violet";

export interface StatusMeta {
  cls: BadgeClass;
  label: string;
}

const MAP: Record<string, StatusMeta> = {
  REQUESTED: { cls: "badge-neutral", label: "Requested" },
  UNDER_REVIEW: { cls: "badge-amber", label: "Under Review" },
  APPROVED: { cls: "badge-green", label: "Approved" },
  REJECTED: { cls: "badge-red", label: "Rejected" },
  ACTIVE: { cls: "badge-blue", label: "Active" },
  COMPLETED: { cls: "badge-neutral", label: "Completed" },
  AVAILABLE: { cls: "badge-green", label: "Available" },
  RENTED: { cls: "badge-blue", label: "Rented" },
  MAINTENANCE: { cls: "badge-amber", label: "Maintenance" },
  ARCHIVED: { cls: "badge-neutral", label: "Archived" },
  PAID: { cls: "badge-green", label: "Paid" },
  DUE: { cls: "badge-amber", label: "Due" },
  OVERDUE: { cls: "badge-red", label: "Overdue" },
  VERIFIED: { cls: "badge-green", label: "Verified" },
  PENDING: { cls: "badge-amber", label: "Pending" },
};

export function statusMeta(status: string): StatusMeta {
  return MAP[status] ?? { cls: "badge-neutral", label: status };
}
