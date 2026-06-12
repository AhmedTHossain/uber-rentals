"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { Field } from "@/components/primitives";
import { PhotoSlot } from "@/components/PhotoSlot";
import { Badge } from "@/components/Badge";
import { statusMeta } from "@/lib/status";
import { money } from "@/lib/format";
import { VEHICLE_VIEW_LABELS } from "@/lib/views";
import {
  createVehicle,
  updateVehicle,
  setVehicleStatus,
  deleteVehicle,
  setVehiclePhoto,
  setVehiclePhotoPosition,
  removeVehiclePhoto,
} from "./actions";

type PhotoEntry = { url: string; pos: string | null };

export type VehicleCard = {
  id: string;
  year: number;
  make: string;
  model: string;
  plate: string;
  vin: string;
  color: string;
  seats: number;
  transmission: string;
  weeklyPrice: number;
  status: string;
  photos: Record<string, PhotoEntry>;
  liveCount: number;
  hasHistory: boolean;
};

const VSTATUS = ["AVAILABLE", "RENTED", "MAINTENANCE", "ARCHIVED"] as const;
const NV0 = { make: "", model: "", year: "2025", weekly_price: "", vin: "", color: "", seats: "5", transmission: "Automatic" };

export function VehiclesGrid({ vehicles }: { vehicles: VehicleCard[] }) {
  const router = useRouter();
  const [sel, setSel] = useState<VehicleCard | null>(null);
  const [adding, setAdding] = useState(false);
  const [del, setDel] = useState<VehicleCard | null>(null);
  const [nv, setNv] = useState(NV0);
  const [edit, setEdit] = useState({ weeklyPrice: "", color: "", vin: "" });
  const [pending, startTransition] = useTransition();
  const refresh = () => router.refresh();

  function openEdit(v: VehicleCard) {
    setEdit({ weeklyPrice: String(v.weeklyPrice), color: v.color, vin: v.vin });
    setSel(v);
  }
  function saveEdit() {
    if (!sel) return;
    startTransition(async () => {
      await updateVehicle(sel.id, {
        weeklyPrice: edit.weeklyPrice,
        color: edit.color,
        vin: edit.vin,
      });
      setSel(null);
      refresh();
    });
  }
  function changeStatus(v: VehicleCard, s: (typeof VSTATUS)[number]) {
    startTransition(async () => {
      await setVehicleStatus(v.id, s);
      setSel((cur) => (cur ? { ...cur, status: s } : cur));
      refresh();
    });
  }
  function create() {
    startTransition(async () => {
      const res = await createVehicle({
        make: nv.make,
        model: nv.model,
        year: nv.year,
        weeklyPrice: nv.weekly_price,
        color: nv.color,
        seats: nv.seats,
        transmission: nv.transmission,
        vin: nv.vin,
      });
      if (res.ok) {
        setAdding(false);
        setNv(NV0);
        refresh();
      }
    });
  }
  function remove(v: VehicleCard, mode: "archive" | "delete") {
    startTransition(async () => {
      await deleteVehicle(v.id, mode);
      setDel(null);
      setSel(null);
      refresh();
    });
  }
  function onPhoto(view: string, url: string) {
    if (!sel) return;
    startTransition(async () => {
      await setVehiclePhoto(sel.id, view as "cover", url);
      setSel((cur) => (cur ? { ...cur, photos: { ...cur.photos, [view]: { url, pos: null } } } : cur));
      refresh();
    });
  }
  function onReframe(view: string, pos: string) {
    if (!sel) return;
    startTransition(async () => {
      await setVehiclePhotoPosition(sel.id, view as "cover", pos);
      setSel((cur) => {
        if (!cur || !cur.photos[view]) return cur;
        return { ...cur, photos: { ...cur.photos, [view]: { ...cur.photos[view], pos } } };
      });
      refresh();
    });
  }
  function onPhotoRemove(view: string) {
    if (!sel) return;
    startTransition(async () => {
      await removeVehiclePhoto(sel.id, view as "cover");
      setSel((cur) => {
        if (!cur) return cur;
        const photos = { ...cur.photos };
        delete photos[view];
        return { ...cur, photos };
      });
      refresh();
    });
  }

  const setN = (k: keyof typeof NV0) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setNv((s) => ({ ...s, [k]: e.target.value }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
        <button className="btn btn-gold btn-sm" onClick={() => setAdding(true)}>
          + Add vehicle
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 20 }}>
        {vehicles.map((v) => (
          <div key={v.id} className="card" style={{ overflow: "hidden" }}>
            <div style={{ position: "relative" }}>
              <PhotoSlot label="Cover" src={v.photos.cover?.url ?? null} objectPosition={v.photos.cover?.pos ?? null} ratio="16 / 10" radius={0} readOnly />
              <div style={{ position: "absolute", top: 12, right: 12, zIndex: 2 }}>
                <Badge status={v.status} />
              </div>
            </div>
            <div style={{ padding: "16px 18px" }}>
              <div className="eyebrow" style={{ color: "var(--text-faint)" }}>
                {v.year} · {v.make}
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, marginTop: 3 }}>{v.model}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <span className="mono" style={{ fontSize: 12, color: "var(--text-dim)" }}>{v.plate}</span>
                <span>
                  <span className="kpi-num" style={{ fontSize: 20, color: "var(--accent)" }}>{money(v.weeklyPrice)}</span>
                  <span style={{ fontSize: 11, color: "var(--text-dim)" }}>/wk</span>
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => openEdit(v)}>Edit</button>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => openEdit(v)}>Status</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* edit / status modal */}
      <Modal
        open={!!sel}
        onClose={() => setSel(null)}
        width={600}
        eyebrow={sel ? `${sel.year} ${sel.make}` : ""}
        title={sel ? sel.model : ""}
        footer={
          sel && (
            <>
              <button className="btn btn-danger" style={{ marginRight: "auto" }} onClick={() => setDel(sel)}>
                Delete vehicle
              </button>
              <button className="btn btn-ghost" onClick={() => setSel(null)}>Cancel</button>
              <button className="btn btn-gold" onClick={saveEdit} disabled={pending}>Save changes</button>
            </>
          )
        }
      >
        {sel && (
          <>
            <div style={{ marginBottom: 8 }}>
              <div className="field-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span>Photos — cover + up to 4 more</span>
                <span style={{ textTransform: "none", letterSpacing: 0, fontSize: 11, color: "var(--text-faint)" }}>
                  Drop to add · hover a photo to Replace / Remove
                </span>
              </div>
              <div className="r-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "30px 12px", marginBottom: 10 }}>
                {VEHICLE_VIEW_LABELS.map(([key, label]) => (
                  <div key={key}>
                    <PhotoSlot
                      label={label}
                      src={sel.photos[key]?.url ?? null}
                      objectPosition={sel.photos[key]?.pos ?? null}
                      ratio="16 / 11"
                      radius={10}
                      onUploaded={(url) => onPhoto(key, url)}
                      onReframe={(pos) => onReframe(key, pos)}
                      onRemove={() => onPhotoRemove(key)}
                    />
                    <div style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-faint)", marginTop: 5 }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Weekly price">
                <input className="input" value={edit.weeklyPrice} onChange={(e) => setEdit({ ...edit, weeklyPrice: e.target.value })} />
              </Field>
              <Field label="Color">
                <input className="input" value={edit.color} onChange={(e) => setEdit({ ...edit, color: e.target.value })} />
              </Field>
              <Field label="VIN" span={2}>
                <input className="input" value={edit.vin} onChange={(e) => setEdit({ ...edit, vin: e.target.value })} style={{ fontFamily: "var(--font-mono)" }} />
              </Field>
            </div>
            <div style={{ marginTop: 18 }}>
              <div className="field-label">Status</div>
              <div className="pillbar" style={{ background: "var(--surface-3)" }}>
                {VSTATUS.map((s) => (
                  <button key={s} className={sel.status === s ? "on" : ""} onClick={() => changeStatus(sel, s)} disabled={pending}>
                    {statusMeta(s).label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* delete / archive confirmation */}
      <Modal
        open={!!del}
        onClose={() => setDel(null)}
        width={500}
        eyebrow="Remove from fleet"
        title={del ? `Delete ${del.model}?` : ""}
        footer={
          del &&
          (del.liveCount > 0 ? (
            <>
              <button className="btn btn-ghost" onClick={() => setDel(null)}>Cancel</button>
              <button className="btn btn-gold" onClick={() => remove(del, "archive")} disabled={pending}>Archive instead</button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={() => setDel(null)}>Cancel</button>
              <button className="btn btn-gold" onClick={() => remove(del, "archive")} disabled={pending}>Archive</button>
              <button className="btn btn-danger" onClick={() => remove(del, "delete")} disabled={pending}>
                {del.hasHistory ? "Delete" : "Delete permanently"}
              </button>
            </>
          ))
        }
      >
        {del &&
          (del.liveCount > 0 ? (
            <>
              <div style={{ display: "flex", gap: 12, padding: "14px 16px", borderRadius: 12, background: "var(--st-amber-bg)", color: "var(--st-amber-fg)", marginBottom: 16 }}>
                <span style={{ fontSize: 18 }}>⚠</span>
                <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>
                  This vehicle has <b>{del.liveCount} live booking{del.liveCount > 1 ? "s" : ""}</b> (requested, approved, or active). It can&apos;t be permanently deleted while bookings reference it.
                </div>
              </div>
              <p style={{ fontSize: 13.5, color: "var(--text-dim)", lineHeight: 1.6, margin: 0 }}>
                <b style={{ color: "var(--text)" }}>Archive</b> removes it from the public fleet and calendar while preserving its booking history. You can also cancel and resolve the bookings first.
              </p>
            </>
          ) : (
            <p style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.6, margin: 0 }}>
              <b style={{ color: "var(--text)" }}>{del.year} {del.make} {del.model}</b> (plate {del.plate}) has no live bookings.{" "}
              {del.hasHistory ? (
                <>It has past booking history, so deleting keeps its record — the name stays in those bookings and the audit log, marked <b style={{ color: "var(--text)" }}>(Deleted)</b>, and it&apos;s removed from the fleet, public site, and calendar.</>
              ) : (
                <><b style={{ color: "var(--text)" }}>Delete permanently</b> removes it entirely; <b style={{ color: "var(--text)" }}>Archive</b> keeps it on file but hides it from the public fleet.</>
              )}
            </p>
          ))}
      </Modal>

      {/* add vehicle */}
      <Modal
        open={adding}
        onClose={() => { setAdding(false); setNv(NV0); }}
        width={600}
        eyebrow="New vehicle"
        title="Add to fleet"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setAdding(false); setNv(NV0); }}>Cancel</button>
            <button className="btn btn-gold" disabled={!nv.make || !nv.model || !nv.weekly_price || pending} onClick={create}>
              Create vehicle
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Make"><input className="input" value={nv.make} onChange={setN("make")} placeholder="Mercedes-Benz" /></Field>
          <Field label="Model"><input className="input" value={nv.model} onChange={setN("model")} placeholder="S 580" /></Field>
          <Field label="Year"><input className="input" value={nv.year} onChange={setN("year")} placeholder="2025" /></Field>
          <Field label="Weekly price"><input className="input" value={nv.weekly_price} onChange={setN("weekly_price")} placeholder="2450" /></Field>
          <Field label="Color"><input className="input" value={nv.color} onChange={setN("color")} placeholder="Obsidian Black" /></Field>
          <Field label="Seats"><input className="input" value={nv.seats} onChange={setN("seats")} placeholder="5" /></Field>
          <Field label="VIN" span={2}><input className="input" value={nv.vin} onChange={setN("vin")} placeholder="WDD…" /></Field>
          <div style={{ gridColumn: "span 2" }}>
            <div className="field-label">Photos</div>
            <div style={{ fontSize: 12.5, color: "var(--text-faint)", lineHeight: 1.5 }}>
              Create the vehicle first, then open <b>Edit</b> to drop in cover + up to 4 photos.
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
