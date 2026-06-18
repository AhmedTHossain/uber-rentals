"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/primitives";
import { inviteAdmin, updateAdmin, resetAdminPassword, deleteAdmin } from "./actions";

type Admin = { id: string; name: string; email: string; role: string };

const inputStyle = { width: "100%" } as const;

export function AccessControl({ admins, currentAdminId }: { admins: Admin[]; currentAdminId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [inv, setInv] = useState({ name: "", email: "", role: "Operations" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string; temp?: string } | null>(null);

  function doInvite() {
    setMsg(null);
    start(async () => {
      const r = await inviteAdmin(inv);
      if (!r.ok) setMsg({ ok: false, text: r.error });
      else {
        setMsg({ ok: true, text: `Invited ${inv.email.trim().toLowerCase()}.`, temp: r.tempPassword });
        setInv({ name: "", email: "", role: "Operations" });
        router.refresh();
      }
    });
  }

  return (
    <div style={{ display: "grid", gap: 22 }}>
      {/* Invite */}
      <div className="card" style={{ padding: "20px 22px" }}>
        <h3 style={{ margin: "0 0 14px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18 }}>
          Invite a team member
        </h3>
        <div className="r-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <div className="field-label">Full name</div>
            <input className="input" style={inputStyle} placeholder="Jordan Vega" value={inv.name} onChange={(e) => setInv({ ...inv, name: e.target.value })} />
          </div>
          <div>
            <div className="field-label">Email</div>
            <input className="input" style={inputStyle} placeholder="jordan@urfleettracker.com" value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} />
          </div>
          <div>
            <div className="field-label">Role</div>
            <input className="input" style={inputStyle} placeholder="Operations" value={inv.role} onChange={(e) => setInv({ ...inv, role: e.target.value })} />
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <button className="btn btn-gold" disabled={pending || !inv.name || !inv.email} onClick={doInvite}>
            {pending ? "Working…" : "Add admin"}
          </button>
        </div>
        {msg && (
          <div
            style={{
              marginTop: 14,
              padding: "11px 15px",
              borderRadius: 10,
              fontSize: 13.5,
              lineHeight: 1.5,
              background: msg.ok ? "var(--st-green-bg)" : "var(--st-red-bg)",
              color: msg.ok ? "var(--st-green-fg)" : "var(--st-red-fg)",
            }}
          >
            {msg.text}
            {msg.temp && (
              <>
                {" "}Share this one-time password — it won&apos;t be shown again:
                <div className="mono" style={{ marginTop: 6, fontSize: 14, color: "var(--text)", userSelect: "all" }}>{msg.temp}</div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Members */}
      <div style={{ display: "grid", gap: 12 }}>
        {admins.map((a) => (
          <AdminRow key={a.id} admin={a} isSelf={a.id === currentAdminId} onChanged={() => router.refresh()} />
        ))}
      </div>
    </div>
  );
}

function AdminRow({ admin, isSelf, onChanged }: { admin: Admin; isSelf: boolean; onChanged: () => void }) {
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"view" | "edit" | "reset">("view");
  const [form, setForm] = useState({ name: admin.name, email: admin.email, role: admin.role });
  const [pw, setPw] = useState("");
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const reset = () => {
    setForm({ name: admin.name, email: admin.email, role: admin.role });
    setPw("");
    setMode("view");
    setNote(null);
  };

  function save() {
    setNote(null);
    start(async () => {
      const r = await updateAdmin(admin.id, form);
      if (!r.ok) setNote({ ok: false, text: r.error });
      else { setMode("view"); onChanged(); }
    });
  }
  function setPassword() {
    setNote(null);
    start(async () => {
      const r = await resetAdminPassword(admin.id, pw);
      if (!r.ok) setNote({ ok: false, text: r.error });
      else { setPw(""); setMode("view"); setNote({ ok: true, text: "Password updated." }); }
    });
  }
  function remove() {
    if (!confirm(`Remove ${admin.name} (${admin.email})? They will lose admin access immediately.`)) return;
    setNote(null);
    start(async () => {
      const r = await deleteAdmin(admin.id);
      if (!r.ok) setNote({ ok: false, text: r.error });
      else onChanged();
    });
  }

  return (
    <div className="card" style={{ padding: "16px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Avatar name={admin.name} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 500 }}>
            {admin.name}
            {isSelf && <span style={{ marginLeft: 8, fontSize: 11, color: "var(--accent)", fontFamily: "var(--font-mono)" }}>YOU</span>}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-dim)" }}>{admin.email}</div>
        </div>
        <span style={{ fontSize: 11.5, fontFamily: "var(--font-mono)", color: "var(--text-dim)", marginRight: 6 }}>{admin.role}</span>
        {mode === "view" && (
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button className="btn btn-ghost btn-sm" disabled={pending} onClick={() => setMode("edit")}>Edit</button>
            <button className="btn btn-ghost btn-sm" disabled={pending} onClick={() => setMode("reset")}>Reset password</button>
            {!isSelf && (
              <button className="btn btn-ghost btn-sm" disabled={pending} onClick={remove} style={{ color: "var(--st-red-fg)" }}>Remove</button>
            )}
          </div>
        )}
      </div>

      {mode === "edit" && (
        <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          <div className="r-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div><div className="field-label">Full name</div><input className="input" style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><div className="field-label">Email</div><input className="input" style={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><div className="field-label">Role</div><input className="input" style={inputStyle} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="btn btn-gold btn-sm" disabled={pending} onClick={save}>{pending ? "Saving…" : "Save changes"}</button>
            <button className="btn btn-ghost btn-sm" disabled={pending} onClick={reset}>Cancel</button>
          </div>
        </div>
      )}

      {mode === "reset" && (
        <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          <div className="field-label">New password for {admin.name}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", maxWidth: 420 }}>
            <input className="input" style={{ flex: 1 }} type="text" placeholder="At least 8 characters" value={pw} onChange={(e) => setPw(e.target.value)} />
            <button className="btn btn-gold btn-sm" disabled={pending || pw.length < 8} onClick={setPassword}>{pending ? "Setting…" : "Set password"}</button>
            <button className="btn btn-ghost btn-sm" disabled={pending} onClick={reset}>Cancel</button>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 8 }}>Share the new password with them securely; they sign in with it immediately.</p>
        </div>
      )}

      {note && (
        <div style={{ marginTop: 12, fontSize: 13, color: note.ok ? "var(--st-green-fg)" : "var(--st-red-fg)" }}>{note.text}</div>
      )}
    </div>
  );
}
