import { statusMeta } from "@/lib/status";

export function Badge({
  status,
  children,
}: {
  status: string;
  children?: React.ReactNode;
}) {
  const meta = statusMeta(status);
  return (
    <span className={`badge ${meta.cls}`}>
      <span className="dot" />
      {children ?? meta.label}
    </span>
  );
}
