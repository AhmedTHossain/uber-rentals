"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { Avatar, Empty } from "@/components/primitives";

type Admin = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export function TeamModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [invited, setInvited] = useState<{ email: string; tempPassword: string } | null>(null);

  useEffect(() => {
    if (!open) {
      setInvited(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch("/api/admins")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Admin[]) => {
        if (!cancelled) setAdmins(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function addAdmin() {
    if (!name || !email || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      if (res.ok) {
        const created = (await res.json()) as Admin & { tempPassword?: string };
        setAdmins((prev) => [...prev, created]);
        if (created.tempPassword) {
          setInvited({ email: created.email, tempPassword: created.tempPassword });
        }
        setName("");
        setEmail("");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={560}
      eyebrow="Access control"
      title="Team & admins"
      footer={
        <button className="btn btn-ghost" onClick={onClose}>
          Done
        </button>
      }
    >
      <div className="card" style={{ padding: "4px 0", marginBottom: 18 }}>
        {loading && admins.length === 0 ? (
          <Empty text="Loading team…" />
        ) : admins.length === 0 ? (
          <Empty text="No admins yet." />
        ) : (
          admins.map((a) => (
            <div
              key={a.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 18px",
                borderTop: "1px solid var(--border)",
              }}
            >
              <Avatar name={a.name} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14 }}>{a.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{a.email}</div>
              </div>
              <span style={{ fontSize: 11.5, fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
                {a.role}
              </span>
            </div>
          ))
        )}
      </div>
      {invited && (
        <div
          style={{
            marginBottom: 14,
            padding: "12px 16px",
            borderRadius: 10,
            background: "var(--st-green-bg)",
            color: "var(--st-green-fg)",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          Invited <b>{invited.email}</b>. Share this one-time password — it won&apos;t be shown again:
          <div className="mono" style={{ marginTop: 6, fontSize: 14, color: "var(--text)", userSelect: "all" }}>
            {invited.tempPassword}
          </div>
        </div>
      )}
      <div className="field-label">Invite admin</div>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
        <input
          className="input"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="input"
          placeholder="email@uberrentals.co"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          className="btn btn-gold"
          disabled={!name || !email || saving}
          onClick={addAdmin}
          style={{ flexShrink: 0 }}
        >
          Add
        </button>
      </div>
    </Modal>
  );
}
