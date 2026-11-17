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

// Dates are always supplied by the server page, which computes a window in the
// future; a literal here would go stale the moment the date passed it.
const BLANK: Form = {
  start_date: "",
  end_date: "",
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
  minDate,
}: {
  vehicle: BookVehicle;
  initial?: Partial<Form>;
  /** Earliest selectable pick-up date (today, from the server's clock). */
  minDate: string;
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
        if (d.f) {
          // An abandoned draft keeps the dates it was saved with. Once they are
          // in the past they would be rejected at submit, so drop them and let
          // the freshly computed window stand.
          const draft = { ...d.f };
          if (!draft.start_date || draft.start_date < minDate) {
            delete draft.start_date;
            delete draft.end_date;
          }
          setF((s) => ({ ...s, ...draft }));
        }
        if (typeof d.step === "number") setStep(d.step);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [SKEY, minDate]);

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
    if (step === 0)
      return !!f.start_date && !!f.end_date && f.end_date > f.start_date && f.start_date >= minDate;
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
      style={{ paddingTop: 30, display: "grid", gridTemplateColumns: "minmax(0, 1.55fr) minmax(0, 0.85fr)", gap: 44, alignItems: "start" }}
    >
      <div>
        {/* One Back control only — this page carried two, at the top and in
            the footer, firing the same handler. */}
        <div className="eyebrow">Booking request</div>
        <h1 className="h-page" style={{ margin: "var(--s2) 0 var(--s6)" }}>
          Reserve the {vehicle.model}
        </h1>

        {/* Stepper. The filled bars already encode position, so the numeral
            prefix that used to sit beside every label is gone — the label
            alone names the step. */}
        <ol
          aria-label="Booking steps"
          style={{ display: "flex", gap: 6, listStyle: "none", margin: "0 0 var(--s7)", padding: 0 }}
        >
          {STEPS.map((s, i) => (
            <li key={s} style={{ flex: 1, minWidth: 0 }} aria-current={i === step ? "step" : undefined}>
              <div style={{ height: 3, borderRadius: "var(--r-pill)", background: i <= step ? "var(--accent)" : "var(--border)" }} />
              <div
                style={{
                  marginTop: "var(--s2)",
                  fontSize: "var(--t-sm)",
                  fontWeight: i === step ? 600 : 400,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: i === step ? "var(--text)" : i < step ? "var(--text-dim)" : "var(--text-faint)",
                }}
              >
                {s}
              </div>
            </li>
          ))}
        </ol>

        <div className="card" style={{ padding: "var(--s6)" }}>
          {showErr && !canNext() && (
            <div role="alert" className="notice notice-red" style={{ marginBottom: "var(--s5)" }}>
              <span aria-hidden="true">⚠</span>
              <span>
                {step === 0
                  ? "Please choose a valid date range."
                  : "Please complete the highlighted required fields."}
              </span>
            </div>
          )}

          {step === 0 && (
            <div className="r-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s5)" }}>
              <Field label="Pick-up date">
                <input
                  className="input"
                  type="date"
                  min={minDate}
                  value={f.start_date}
                  onChange={set("start_date")}
                />
              </Field>
              <Field label="Return date">
                <input
                  className="input"
                  type="date"
                  min={f.start_date || minDate}
                  value={f.end_date}
                  onChange={set("end_date")}
                />
              </Field>
              {/* One slot, three states. A problem gets the amber notice; a
                  valid range gets a plain readout, because a confirmed
                  duration is not an alert. */}
              <div style={{ gridColumn: "span 2" }}>
                {f.start_date && f.start_date < minDate ? (
                  <p className="notice notice-amber">Pick-up date cannot be in the past.</p>
                ) : f.start_date && f.end_date && f.end_date > f.start_date ? (
                  <div
                    style={{
                      background: "var(--surface-2)",
                      borderRadius: "var(--r-md)",
                      padding: "14px var(--s4)",
                      fontSize: "var(--t-base)",
                      color: "var(--text-dim)",
                    }}
                  >
                    <b style={{ color: "var(--text)" }}>
                      {weeks} week{weeks > 1 ? "s" : ""}
                    </b>{" "}
                    · billed weekly at {money(vehicle.weeklyPrice)}
                  </div>
                ) : f.start_date && f.end_date ? (
                  <p className="notice notice-amber">Return date must be after pick-up date.</p>
                ) : null}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="r-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s5)" }}>
              <Field label="First name">
                <input className="input" aria-invalid={inv("first_name") || undefined} value={f.first_name} onChange={set("first_name")} placeholder="Marcus" />
              </Field>
              <Field label="Last name">
                <input className="input" aria-invalid={inv("last_name") || undefined} value={f.last_name} onChange={set("last_name")} placeholder="Adeyemi" />
              </Field>
              <Field label="Date of birth">
                <input className="input" type="date" value={f.dob} onChange={set("dob")} />
              </Field>
              <Field label="Phone">
                <input className="input" aria-invalid={inv("phone") || undefined} value={f.phone} onChange={set("phone")} placeholder="(312) 555-0148" />
              </Field>
              <Field label="Email" span={2}>
                <input className="input" aria-invalid={inv("email") || undefined} type="email" value={f.email} onChange={set("email")} placeholder="you@email.com" />
              </Field>
              <Field label="Street address" span={2}>
                <input className="input" value={f.street} onChange={set("street")} placeholder="1820 N Clark St" />
              </Field>
              <Field label="City">
                <input className="input" value={f.city} onChange={set("city")} placeholder="Chicago" />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s3)" }}>
                <Field label="State">
                  <input className="input" value={f.state} onChange={set("state")} placeholder="IL" />
                </Field>
                <Field label="ZIP">
                  <input className="input" value={f.zip} onChange={set("zip")} placeholder="60614" />
                </Field>
              </div>
              <div className="divider" style={{ gridColumn: "span 2", margin: "4px 0" }} />
              <Field label="License number">
                <input className="input" aria-invalid={inv("license_number") || undefined} value={f.license_number} onChange={set("license_number")} placeholder="A284-5519-9027" />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s3)" }}>
                <Field label="License state">
                  <input className="input" value={f.license_state} onChange={set("license_state")} placeholder="IL" />
                </Field>
                <Field label="Expiry">
                  <input className="input" aria-invalid={inv("license_expiry") || undefined} type="date" value={f.license_expiry} onChange={set("license_expiry")} />
                </Field>
              </div>
              <DocSlot label="License — front" url={f.license_front_url} onChange={(u) => setF((s) => ({ ...s, license_front_url: u }))} />
              <DocSlot label="License — back" url={f.license_back_url} onChange={(u) => setF((s) => ({ ...s, license_back_url: u }))} />
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="field-label">Insurance type</div>
              <div className="r-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s3)", marginBottom: 6 }}>
                {(
                  [
                    ["COMPANY", "Company coverage", "Add our fleet policy to this rental. Subject to verification."],
                    ["CUSTOMER", "Bring your own", "Provide your existing policy. We verify before approval."],
                  ] as ["COMPANY" | "CUSTOMER", string, string][]
                ).map(([val, t, d]) => (
                  // A real radio, visually hidden: these were clickable divs,
                  // so the choice was unreachable by keyboard and unannounced
                  // to a screen reader.
                  <label
                    key={val}
                    style={{
                      cursor: "pointer",
                      display: "block",
                      padding: "var(--s4)",
                      borderRadius: "var(--r-md)",
                      border: "1px solid " + (f.insurance_type === val ? "var(--accent)" : "var(--border)"),
                      background: f.insurance_type === val ? "var(--accent-soft)" : "transparent",
                      transition: "border-color 0.14s ease, background-color 0.14s ease",
                    }}
                  >
                    <input
                      type="radio"
                      name="insurance_type"
                      value={val}
                      checked={f.insurance_type === val}
                      onChange={() => setF((s) => ({ ...s, insurance_type: val }))}
                      style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                    />
                    <div style={{ fontWeight: 600, fontSize: "var(--t-md)" }}>{t}</div>
                    <div style={{ fontSize: "var(--t-sm)", color: "var(--text-dim)", marginTop: 6, lineHeight: 1.5 }}>{d}</div>
                  </label>
                ))}
              </div>
              {f.insurance_type === "CUSTOMER" && (
                <div className="r-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s5)", marginTop: "var(--s5)" }}>
                  <Field label="Provider name" span={2}>
                    <input className="input" aria-invalid={inv("provider_name") || undefined} value={f.provider_name} onChange={set("provider_name")} placeholder="State Farm" />
                  </Field>
                  <Field label="Policy number">
                    <input className="input" aria-invalid={inv("policy_number") || undefined} value={f.policy_number} onChange={set("policy_number")} placeholder="SF-1182-90043" />
                  </Field>
                  <Field label="Policy expiry">
                    <input className="input" aria-invalid={inv("policy_expiry") || undefined} type="date" value={f.policy_expiry} onChange={set("policy_expiry")} />
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
              <p style={{ fontSize: "var(--t-md)", color: "var(--text-dim)", marginTop: 0, lineHeight: 1.6 }}>
                Please confirm. On submit, your request enters our review queue.
              </p>
              <div className="card" style={{ padding: "var(--s1) var(--s5)", background: "var(--surface-2)" }}>
                <InfoRow k="Vehicle" v={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} />
                <InfoRow k="Dates" v={`${fmtDate(f.start_date)} → ${fmtDate(f.end_date)}`} />
                <InfoRow k="Duration" v={`${weeks} week${weeks > 1 ? "s" : ""}`} />
                <InfoRow k="Driver" v={`${f.first_name || "—"} ${f.last_name || ""}`} />
                <InfoRow k="Insurance" v={f.insurance_type === "COMPANY" ? "Company coverage" : "Customer policy"} />
                <InfoRow k="Estimated weekly billing" v={money(vehicle.weeklyPrice)} />
              </div>
              {submitError && (
                <div role="alert" className="notice notice-red" style={{ marginTop: "var(--s4)" }}>
                  {submitError}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--s5)" }}>
          <button
            className="btn btn-ghost"
            onClick={() => (step === 0 ? router.push(`/vehicle/${vehicle.id}`) : setStep(step - 1))}
          >
            Back
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s4)" }}>
            {/* Reassurance, not a badge: lowercase, faint, and only once the
                user has actually entered something worth saving. */}
            {step > 0 && (
              <span style={{ fontSize: "var(--t-sm)", color: "var(--text-faint)" }}>Progress saved</span>
            )}
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
      <div className="card booking-summary" style={{ overflow: "hidden", position: "sticky", top: 88 }}>
        <PhotoSlot label="Cover" src={vehicle.cover} ratio="16 / 10" radius={0} readOnly />
        <div style={{ padding: "var(--s5)" }}>
          <div className="meta">
            {vehicle.year} · {vehicle.make}
          </div>
          <div className="h-card" style={{ marginTop: 4 }}>
            {vehicle.model}
          </div>
          <div className="divider" style={{ margin: "var(--s4) 0" }} />
          {/* The line-item and the total were the same number shown twice.
              The breakdown explains it; the total states it. */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--t-base)", color: "var(--text-dim)" }}>
            <span>
              {money(vehicle.weeklyPrice)} × {weeks} week{weeks > 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "var(--s3)" }}>
            <span style={{ fontSize: "var(--t-base)", color: "var(--text-dim)" }}>Estimated total</span>
            <span className="price" style={{ fontSize: "var(--d-lg)" }}>
              {money(subtotal)}
            </span>
          </div>
          <p style={{ fontSize: "var(--t-sm)", color: "var(--text-faint)", marginTop: "var(--s3)", marginBottom: 0, lineHeight: 1.6 }}>
            Billed weekly once approved. Nothing is charged when you submit.
          </p>
        </div>
      </div>
    </div>
  );
}
