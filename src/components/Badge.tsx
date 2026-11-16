import { statusMeta } from "@/lib/status";

export function Badge({
  status,
  children,
}: {
  status: string;
  children?: React.ReactNode;
}) {
  const meta = statusMeta(status);
  return <span className={`badge ${meta.cls}`}>{children ?? meta.label}</span>;
}
