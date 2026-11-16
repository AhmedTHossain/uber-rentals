"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/Badge";
import { PhotoSlot } from "@/components/PhotoSlot";
import { money } from "@/lib/format";

export type ListingVehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  seats: number;
  transmission: string;
  weeklyPrice: number;
  available: boolean;
  cover: string | null;
};

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    // Label beside the control, not stacked above it: the filter row is a
    // toolbar, and a stacked label doubles its height for no gain.
    <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)" }}>
      <span style={{ fontSize: "var(--t-sm)", color: "var(--text-dim)", whiteSpace: "nowrap" }}>{label}</span>
      <select
        className="select"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ height: "var(--ctrl-h-sm)", width: "auto", minWidth: 112, fontSize: "var(--t-sm)", background: "transparent", borderColor: "var(--border)" }}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

function VehicleCard({ v }: { v: ListingVehicle }) {
  return (
    <Link
      href={`/vehicle/${v.id}`}
      className="card vehicle-card"
      style={{ overflow: "hidden", cursor: "pointer", display: "block", color: "inherit" }}
    >
      <div style={{ position: "relative" }}>
        <PhotoSlot label="Cover" src={v.cover} ratio="16 / 10" radius={0} readOnly />
        {/* Available is the normal state across the fleet, so saying it on
            every card is noise. Only the exception is worth a badge — and it
            sits on the image, so every card's text starts at one baseline. */}
        {!v.available && (
          <span style={{ position: "absolute", top: "var(--s3)", right: "var(--s3)" }}>
            <Badge status="RENTED">Booked</Badge>
          </span>
        )}
      </div>
      <div style={{ padding: "var(--s4)" }}>
        <div style={{ fontSize: "var(--t-xs)", color: "var(--text-dim)" }}>
          {v.year} · {v.make}
        </div>
        <div className="h-card" style={{ marginTop: 2 }}>
          {v.model}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "var(--s4)", gap: "var(--s3)" }}>
          <div style={{ fontSize: "var(--t-sm)", color: "var(--text-dim)" }}>
            {v.seats} seats · {v.transmission}
          </div>
          <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
            <span className="price" style={{ fontSize: "var(--d-sm)" }}>{money(v.weeklyPrice)}</span>
            <span style={{ fontSize: "var(--t-xs)", color: "var(--text-faint)" }}>/wk</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

const STEPS: [string, string, string][] = [
  ["01", "Request", "Choose your vehicle and dates, share your details and insurance preference. Nothing is charged."],
  ["02", "Review", "Our team verifies your license and insurance, confirms availability, and approves — usually within 24 hours."],
  ["03", "Collect", "On approval we arrange handover. Company coverage is finalized; customer policies are confirmed valid."],
  ["04", "Drive", "Billing runs in clean weekly installments for the length of your rental. No deposits held hostage."],
];

export function Listing({ vehicles }: { vehicles: ListingVehicle[] }) {
  const [maxPrice, setMaxPrice] = useState(5000);
  const [seats, setSeats] = useState("any");
  const [trans, setTrans] = useState("any");
  const [sort, setSort] = useState("featured");

  const reset = () => {
    setMaxPrice(5000);
    setSeats("any");
    setTrans("any");
    setSort("featured");
  };

  const list = useMemo(() => {
    let v = vehicles.filter((x) => x.weeklyPrice <= maxPrice);
    if (seats !== "any") v = v.filter((x) => (seats === "2" ? x.seats <= 2 : x.seats >= 4));
    if (trans !== "any") v = v.filter((x) => x.transmission === trans);
    if (sort === "price-lo") v = [...v].sort((a, b) => a.weeklyPrice - b.weeklyPrice);
    if (sort === "price-hi") v = [...v].sort((a, b) => b.weeklyPrice - a.weeklyPrice);
    return v;
  }, [vehicles, maxPrice, seats, trans, sort]);

  return (
    <div>
      {/* hero — left-aligned. A centred hero above a left-aligned grid gave
          the page two spines; now one left edge runs from the headline to
          the last card. */}
      <section style={{ padding: "var(--s10) 0 var(--s8)", maxWidth: 720 }}>
        <div className="eyebrow">D.C · Maryland · Virginia</div>
        <h1 className="h-hero" style={{ marginTop: "var(--s4)" }}>
          The keys to something{" "}
          <span style={{ fontStyle: "italic", color: "var(--accent-ink)" }}>exceptional</span>, by the
          week.
        </h1>
        <p className="lede" style={{ maxWidth: "56ch", marginTop: "var(--s5)" }}>
          Browse the fleet and submit a request. Every reservation is personally reviewed and
          approved by our team — no instant checkout, no surprises.
        </p>
      </section>

      {/* filter toolbar — was a bordered card holding a 260px slider plus
          three stacked selects, which made the filters heavier than the
          fleet they filter. */}
      <div
        className="filter-bar"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--s5)",
          padding: "var(--s3) 0",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          marginBottom: "var(--s6)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)" }}>
          <span style={{ fontSize: "var(--t-sm)", color: "var(--text-dim)", whiteSpace: "nowrap" }}>Up to</span>
          <input
            type="range"
            min={1500}
            max={5000}
            step={50}
            value={maxPrice}
            aria-label="Maximum weekly price"
            onChange={(e) => setMaxPrice(+e.target.value)}
            style={{ width: 120 }}
          />
          <span className="mono num" style={{ color: "var(--accent-ink)", minWidth: 62, fontSize: "var(--t-sm)" }}>
            {money(maxPrice)}
          </span>
        </div>
        <FilterSelect
          label="Seats"
          value={seats}
          onChange={setSeats}
          options={[["any", "Any"], ["2", "2 seats"], ["4", "4+ seats"]]}
        />
        <FilterSelect
          label="Transmission"
          value={trans}
          onChange={setTrans}
          options={[["any", "Any"], ["Automatic", "Automatic"], ["Manual", "Manual"]]}
        />
        <FilterSelect
          label="Sort"
          value={sort}
          onChange={setSort}
          options={[["featured", "Featured"], ["price-lo", "Price, low to high"], ["price-hi", "Price, high to low"]]}
        />
        <span style={{ marginLeft: "auto", fontSize: "var(--t-sm)", color: "var(--text-dim)" }}>
          {list.length} {list.length === 1 ? "vehicle" : "vehicles"}
        </span>
      </div>

      {/* grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(286px, 1fr))", gap: "var(--s5)" }}>
        {list.map((v) => (
          <VehicleCard key={v.id} v={v} />
        ))}
      </div>
      {list.length === 0 && (
        <div className="card" style={{ padding: "var(--s9) var(--s6)", textAlign: "center" }}>
          <div className="h-card">No vehicles match these filters</div>
          <p style={{ color: "var(--text-dim)", fontSize: "var(--t-md)", margin: "var(--s2) 0 var(--s5)" }}>
            Widen the price range or clear a filter to see the rest of the fleet.
          </p>
          <button className="btn btn-ghost" onClick={reset}>
            Clear filters
          </button>
        </div>
      )}

      {/* how it works — four bordered cards became a strip. The fleet above
          is the page's subject; this is a footnote to it. */}
      <section style={{ marginTop: "var(--s10)", paddingTop: "var(--s7)", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--s4)", flexWrap: "wrap", marginBottom: "var(--s6)" }}>
          <h2 className="h-section">Considered, not automated.</h2>
          <Link href="/how-it-works" className="link" style={{ fontSize: "var(--t-sm)" }}>
            How it works →
          </Link>
        </div>
        <div className="r-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "var(--s6)" }}>
          {STEPS.map(([n, t, d]) => (
            <div key={n}>
              <span className="mono" style={{ fontSize: "var(--t-xs)", color: "var(--accent-ink)" }}>{n}</span>
              <h3 style={{ fontSize: "var(--t-md)", fontWeight: 600, marginTop: 6 }}>{t}</h3>
              <p style={{ fontSize: "var(--t-sm)", color: "var(--text-dim)", lineHeight: 1.55, marginTop: 6 }}>
                {d}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
