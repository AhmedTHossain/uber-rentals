"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, InfoRow } from "@/components/primitives";
import { PhotoSlot } from "@/components/PhotoSlot";
import { money, daysBetween, fmtDate } from "@/lib/format";

export type BookVehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  weeklyPrice: number;
  cover: string | null;
};

type Form = {
  start_date: string;
  end_date: string;
  first_name: string;
  last_name: string;
  dob: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  license_number: string;
  license_state: string;
  license_expiry: string;
  license_front_url: string;
  license_back_url: string;
  insurance_type: "COMPANY" | "CUSTOMER";
  provider_name: string;
  policy_number: string;
  agent_phone: string;
  agent_email: string;
  policy_expiry: string;
  card_front_url: string;
  card_back_url: string;
};

const BLANK: Form = {
  start_date: "2026-06-15",
  end_date: "2026-07-13",
  first_name: "",
  last_name: "",
  dob: "",
  phone: "",
  email: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  license_number: "",
  license_state: "",
  license_expiry: "",
  license_front_url: "",
  license_back_url: "",
  insurance_type: "COMPANY",
  provider_name: "",
  policy_number: "",
  agent_phone: "",
  agent_email: "",
  policy_expiry: "",
  card_front_url: "",
  card_back_url: "",
};

const STEPS = ["Dates", "Driver", "Insurance", "Review"];

const errStyle: React.CSSProperties = {
  borderColor: "var(--st-red-fg)",
  boxShadow: "0 0 0 3px var(--st-red-bg)",
};

function DocSlot({
  label,
  url,
  onChange,
}: {
  label: string;
  url: string;
  onChange: (u: string) => void;
}) {
  return (
    <div>
      <span className="field-label">{label}</span>
      <PhotoSlot
        label={label}
        src={url || null}
        ratio="auto"
        radius={10}
        style={{ height: 110 }}
        onUploaded={(u) => onChange(u)}
        onRemove={() => onChange("")}
      />
    </div>
  );
}

export function BookingForm({
  vehicle,
  initial,
}: {
  vehicle: BookVehicle;
  initial?: Partial<Form>;
}) {
  const router = useRouter();
  const SKEY = `ur-booking-${vehicle.id}`;

  const [step, setStep] = useState(0);
  const [f, setF] = useState<Form>({ ...BLANK, ...initial });
  const [attempted, setAttempted] = useState<Record<number, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // restore saved progress
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SKEY);
      if (raw) {
        const d = JSON.parse(raw) as { f?: Partial<Form>; step?: number };
        if (d.f) setF((s) => ({ ...s, ...d.f }));
        if (typeof d.step === "number") setStep(d.step);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [SKEY]);

  // persist progress (after hydration to avoid clobbering saved state)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(SKEY, JSON.stringify({ f, step }));
    } catch {
      /* ignore */
    }
  }, [f, step, hydrated, SKEY]);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const REQUIRED: Record<number, (keyof Form)[]> = {
    1: ["first_name", "last_name", "email", "phone", "license_number", "license_expiry"],
    2: f.insurance_type === "CUSTOMER" ? ["provider_name", "policy_number", "policy_expiry"] : [],
  };
  const showErr = !!attempted[step];
  const inv = (k: keyof Form) =>
    showErr && (REQUIRED[step] || []).includes(k) && !f[k];

  const weeks = Math.max(1, Math.ceil(daysBetween(f.start_date, f.end_date) / 7));
  const subtotal = weeks * vehicle.weeklyPrice;

  const canNext = () => {
    if (step === 0) return !!f.start_date && !!f.end_date && f.end_date > f.start_date;
    return (REQUIRED[step] || []).every((k) => !!f[k]);
  };

  function next() {
    if (canNext()) {
      setStep(step + 1);
      setAttempted((a) => ({ ...a, [step]: false }));
    } else {
      setAttempted((a) => ({ ...a, [step]: true }));
    }
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        vehicleId: vehicle.id,
        startDate: f.start_date,
        endDate: f.end_date,
        firstName: f.first_name,
        lastName: f.last_name,
        dob: f.dob,
        phone: f.phone,
        email: f.email,
        street: f.street,
        city: f.city,
        state: f.state,
        zip: f.zip,
        licenseNumber: f.license_number,
        licenseState: f.license_state,
        licenseExpiry: f.license_expiry,
        licenseFrontUrl: f.license_front_url,
        licenseBackUrl: f.license_back_url,
        insuranceTypeChoice: f.insurance_type,
        providerName: f.provider_name,
        policyNumber: f.policy_number,
        policyExpiry: f.policy_expiry,
        agentPhone: f.agent_phone,
        agentEmail: f.agent_email,
        cardFrontUrl: f.card_front_url,
        cardBackUrl: f.card_back_url,
      };
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setSubmitError(data.error || "Could not submit request. Please try again.");
        setSubmitting(false);
        return;
      }
      const { reference } = (await res.json()) as { reference: string };
      try {
        localStorage.removeItem(SKEY);
      } catch {
        /* ignore */
      }
      router.push(`/confirm/${reference}`);
    } catch {
      setSubmitError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="r-split"
      style={{ paddingTop: 30, display: "grid", gridTemplateColumns: "1.55fr 0.85fr", gap: 44, alignItems: "start" }}
    >
      <div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => (step === 0 ? router.push(`/vehicle/${vehicle.id}`) : setStep(step - 1))}
          style={{ marginBottom: 22 }}
        >
          ← Back
        </button>
        <div className="eyebrow">Booking request</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 600, margin: "8px 0 26px" }}>
          Reserve the {vehicle.model}
        </h1>

        {/* stepper */}
        <div style={{ display: "flex", gap: 6, marginBottom: 30 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, minWidth: 0 }}>
              <div style={{ height: 3, borderRadius: 9, background: i <= step ? "var(--accent)" : "var(--border)" }} />
              <div
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: i === step ? "var(--accent)" : i < step ? "var(--text)" : "var(--text-faint)",
                }}
              >
                {String(i + 1).padStart(2, "0")}
                <span className="hide-xs"> {s}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: "26px 26px 28px" }}>
          {showErr && !canNext() && (
            <div
              style={{
                display: "flex",
                gap: 11,
                alignItems: "center",
                padding: "11px 15px",
                borderRadius: 10,
                background: "var(--st-red-bg)",
                color: "var(--st-red-fg)",
                marginBottom: 20,
                fontSize: 13.5,
              }}
            >
              <span style={{ fontSize: 16 }}>⚠</span>
              {step === 0
                ? "Please choose a valid date range."
                : "Please complete the highlighted required fields."}
            </div>
          )}

          {step === 0 && (
            <div className="r-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <Field label="Pick-up date">
                <input className="input" type="date" value={f.start_date} onChange={set("start_date")} />
              </Field>
              <Field label="Return date">
                <input className="input" type="date" value={f.end_date} onChange={set("end_date")} />
              </Field>
              <div
                style={{
                  gridColumn: "span 2",
                  background: "var(--surface-2)",
                  borderRadius: 10,
                  padding: "14px 16px",
                  fontSize: 13,
                  color: "var(--text-dim)",
                }}
              >
                {f.end_date > f.start_date ? (
                  <>
                    Duration: <b style={{ color: "var(--text)" }}>{weeks} week{weeks > 1 ? "s" : ""}</b> · billed weekly
                    at {money(vehicle.weeklyPrice)}
                  </>
                ) : (
                  <span style={{ color: "var(--st-amber-fg)" }}>Return date must be after pick-up date.</span>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="r-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <Field label="First name">
                <input className="input" style={inv("first_name") ? errStyle : undefined} value={f.first_name} onChange={set("first_name")} placeholder="Marcus" />
              </Field>
              <Field label="Last name">
                <input className="input" style={inv("last_name") ? errStyle : undefined} value={f.last_name} onChange={set("last_name")} placeholder="Adeyemi" />
              </Field>
              <Field label="Date of birth">
                <input className="input" type="date" value={f.dob} onChange={set("dob")} />
              </Field>
              <Field label="Phone">
                <input className="input" style={inv("phone") ? errStyle : undefined} value={f.phone} onChange={set("phone")} placeholder="(312) 555-0148" />
              </Field>
              <Field label="Email" span={2}>
                <input className="input" style={inv("email") ? errStyle : undefined} type="email" value={f.email} onChange={set("email")} placeholder="you@email.com" />
              </Field>
              <Field label="Street address" span={2}>
                <input className="input" value={f.street} onChange={set("street")} placeholder="1820 N Clark St" />
              </Field>
              <Field label="City">
                <input className="input" value={f.city} onChange={set("city")} placeholder="Chicago" />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="State">
                  <input className="input" value={f.state} onChange={set("state")} placeholder="IL" />
                </Field>
                <Field label="ZIP">
                  <input className="input" value={f.zip} onChange={set("zip")} placeholder="60614" />
                </Field>
              </div>
              <div style={{ gridColumn: "span 2", height: 1, background: "var(--border)", margin: "4px 0" }} />
              <Field label="License number">
                <input className="input" style={inv("license_number") ? errStyle : undefined} value={f.license_number} onChange={set("license_number")} placeholder="A284-5519-9027" />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="License state">
                  <input className="input" value={f.license_state} onChange={set("license_state")} placeholder="IL" />
                </Field>
                <Field label="Expiry">
                  <input className="input" style={inv("license_expiry") ? errStyle : undefined} type="date" value={f.license_expiry} onChange={set("license_expiry")} />
                </Field>
              </div>
              <DocSlot label="License — front" url={f.license_front_url} onChange={(u) => setF((s) => ({ ...s, license_front_url: u }))} />
              <DocSlot label="License — back" url={f.license_back_url} onChange={(u) => setF((s) => ({ ...s, license_back_url: u }))} />
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="field-label">Insurance type</div>
              <div className="r-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 6 }}>
                {(
                  [
                    ["COMPANY", "Company coverage", "Add our fleet policy to this rental. Subject to verification."],
                    ["CUSTOMER", "Bring your own", "Provide your existing policy. We verify before approval."],
                  ] as ["COMPANY" | "CUSTOMER", string, string][]
                ).map(([val, t, d]) => (
                  <div
                    key={val}
                    onClick={() => setF((s) => ({ ...s, insurance_type: val }))}
                    style={{
                      cursor: "pointer",
                      padding: "16px 18px",
                      borderRadius: 12,
                      border: "1.5px solid " + (f.insurance_type === val ? "var(--accent)" : "var(--border)"),
                      background: f.insurance_type === val ? "var(--accent-soft)" : "transparent",
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{t}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginTop: 6, lineHeight: 1.5 }}>{d}</div>
                  </div>
                ))}
              </div>
              {f.insurance_type === "CUSTOMER" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 20 }}>
                  <Field label="Provider name" span={2}>
                    <input className="input" style={inv("provider_name") ? errStyle : undefined} value={f.provider_name} onChange={set("provider_name")} placeholder="State Farm" />
                  </Field>
                  <Field label="Policy number">
                    <input className="input" style={inv("policy_number") ? errStyle : undefined} value={f.policy_number} onChange={set("policy_number")} placeholder="SF-1182-90043" />
                  </Field>
                  <Field label="Policy expiry">
                    <input className="input" style={inv("policy_expiry") ? errStyle : undefined} type="date" value={f.policy_expiry} onChange={set("policy_expiry")} />
                  </Field>
                  <Field label="Agent phone">
                    <input className="input" value={f.agent_phone} onChange={set("agent_phone")} placeholder="(646) 555-0211" />
                  </Field>
                  <Field label="Agent email">
                    <input className="input" value={f.agent_email} onChange={set("agent_email")} placeholder="agent@provider.com" />
                  </Field>
                  <DocSlot label="Insurance card — front" url={f.card_front_url} onChange={(u) => setF((s) => ({ ...s, card_front_url: u }))} />
                  <DocSlot label="Insurance card — back" url={f.card_back_url} onChange={(u) => setF((s) => ({ ...s, card_back_url: u }))} />
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <p style={{ fontSize: 14, color: "var(--text-dim)", marginTop: 0, lineHeight: 1.6 }}>
                Please confirm. On submit, your request is created with status{" "}
                <b style={{ color: "var(--text)" }}>REQUESTED</b> and enters our review queue.
              </p>
              <div className="card" style={{ padding: "6px 20px", background: "var(--surface-2)" }}>
                <InfoRow k="Vehicle" v={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} />
                <InfoRow k="Dates" v={`${fmtDate(f.start_date)} → ${fmtDate(f.end_date)}`} />
                <InfoRow k="Duration" v={`${weeks} week${weeks > 1 ? "s" : ""}`} />
                <InfoRow k="Driver" v={`${f.first_name || "—"} ${f.last_name || ""}`} />
                <InfoRow k="Insurance" v={f.insurance_type === "COMPANY" ? "Company coverage" : "Customer policy"} />
                <InfoRow k="Estimated weekly billing" v={money(vehicle.weeklyPrice)} />
              </div>
              {submitError && (
                <div
                  style={{
                    marginTop: 16,
                    padding: "11px 15px",
                    borderRadius: 10,
                    background: "var(--st-red-bg)",
                    color: "var(--st-red-fg)",
                    fontSize: 13.5,
                  }}
                >
                  {submitError}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 22 }}>
          <button
            className="btn btn-ghost"
            onClick={() => (step === 0 ? router.push(`/vehicle/${vehicle.id}`) : setStep(step - 1))}
          >
            Back
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 11.5, color: "var(--text-faint)", fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>
              ✓ PROGRESS SAVED
            </span>
            {step < 3 ? (
              <button className="btn btn-gold" onClick={next}>
                Continue
              </button>
            ) : (
              <button className="btn btn-gold" onClick={submit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit request"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* summary rail */}
      <div className="card booking-summary" style={{ overflow: "hidden", position: "sticky", top: 24 }}>
        <PhotoSlot label="Cover" src={vehicle.cover} ratio="16 / 10" radius={0} readOnly />
        <div style={{ padding: "20px 22px" }}>
          <div className="eyebrow">
            {vehicle.year} · {vehicle.make}
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, marginTop: 4 }}>
            {vehicle.model}
          </div>
          <div style={{ height: 1, background: "var(--border)", margin: "18px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: "var(--text-dim)", marginBottom: 10 }}>
            <span>
              {money(vehicle.weeklyPrice)} × {weeks} wk
            </span>
            <span style={{ color: "var(--text)" }}>{money(subtotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 8 }}>
            <span style={{ fontSize: 13, color: "var(--text-dim)" }}>Estimated total</span>
            <span className="kpi-num" style={{ fontSize: 30, color: "var(--accent)" }}>
              {money(subtotal)}
            </span>
          </div>
          <p style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 14, lineHeight: 1.6 }}>
            Billed in weekly installments once approved &amp; insurance is verified. Not charged at request.
          </p>
        </div>
      </div>
    </div>
  );
}
