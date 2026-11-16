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
    <div style={{ minWidth: 130 }}>
      <span className="field-label">{label}</span>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
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
      <PhotoSlot label="Cover" src={v.cover} ratio="16 / 10" radius={0} readOnly />
      <div style={{ padding: "18px var(--s5) var(--s5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--s3)" }}>
          <div style={{ minWidth: 0 }}>
            <div className="meta">
              {v.year} · {v.make}
            </div>
            <div className="h-card" style={{ marginTop: 4 }}>
              {v.model}
            </div>
          </div>
          {/* Available is the normal state across the fleet, so saying it on
              every card is noise. Only the exception is worth a badge. */}
          {!v.available && <Badge status="RENTED">Booked</Badge>}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 18, gap: "var(--s3)" }}>
          <div style={{ fontSize: "var(--t-sm)", color: "var(--text-dim)" }}>
            {v.seats} seats · {v.transmission}
          </div>
          <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
            <span className="kpi-num" style={{ fontSize: "var(--d-lg)", color: "var(--accent)" }}>
              {money(v.weeklyPrice)}
            </span>
            <span style={{ fontSize: "var(--t-sm)", color: "var(--text-dim)" }}> /wk</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

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
      {/* hero */}
      <section style={{ padding: "66px 0 48px", textAlign: "center" }}>
        <div className="eyebrow" style={{ marginBottom: 18 }}>
          D.C · Maryland · Virginia
        </div>
        <h1 className="h-hero" style={{ maxWidth: 840, marginInline: "auto" }}>
          The keys to something{" "}
          <span style={{ fontStyle: "italic", color: "var(--accent)" }}>exceptional</span>, by the
          week.
        </h1>
        <p className="lede" style={{ maxWidth: 540, marginInline: "auto", marginTop: "var(--s5)" }}>
          Browse the fleet and submit a request. Every reservation is personally reviewed and
          approved by our team — no instant checkout, no surprises.
        </p>
      </section>

      {/* filter bar */}
      <div
        className="card filter-bar"
        style={{ padding: "18px 22px", display: "flex", gap: 28, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 30 }}
      >
        <div style={{ flex: "1 1 260px", minWidth: 220 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span className="field-label" style={{ margin: 0 }}>
              Max weekly price
            </span>
            <span className="mono" style={{ fontSize: "var(--t-sm)", color: "var(--accent)" }}>
              {money(maxPrice)}/wk
            </span>
          </div>
          <input
            type="range"
            min={1500}
            max={5000}
            step={50}
            value={maxPrice}
            onChange={(e) => setMaxPrice(+e.target.value)}
            style={{ width: "100%", accentColor: "var(--accent)" }}
          />
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
          options={[["featured", "Featured"], ["price-lo", "Price ↑"], ["price-hi", "Price ↓"]]}
        />
        <div style={{ marginLeft: "auto", fontSize: "var(--t-sm)", color: "var(--text-dim)", paddingBottom: 10 }}>
          {list.length} {list.length === 1 ? "vehicle" : "vehicles"}
        </div>
      </div>

      {/* grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "var(--s6)" }}>
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

      {/* how it works */}
      <section style={{ marginTop: "var(--s10)" }}>
        <div style={{ textAlign: "center", marginBottom: "var(--s8)" }}>
          <h2 className="h-page">Considered, not automated.</h2>
          <p className="lede" style={{ maxWidth: 520, marginInline: "auto" }}>
            Every reservation passes through a person. It is what keeps the fleet immaculate and the
            experience uncompromising.
          </p>
        </div>
        {/* The step number is a position marker, not a headline: it sits with
            the title at label size rather than competing with it. */}
        <div className="r-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "var(--s5)" }}>
          {(
            [
              ["01", "Request", "Choose your vehicle and dates, share your details and insurance preference. Nothing is charged."],
              ["02", "Review", "Our team verifies your license and insurance, confirms availability, and approves — usually within 24 hours."],
              ["03", "Collect", "On approval we arrange handover. Company coverage is finalized; customer policies are confirmed valid."],
              ["04", "Drive", "Billing runs in clean weekly installments for the length of your rental. No deposits held hostage."],
            ] as [string, string, string][]
          ).map(([n, t, d]) => (
            <div key={n} className="card" style={{ padding: "var(--s6) 22px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "var(--s3)" }}>
                <span className="eyebrow">{n}</span>
                <span className="h-card">{t}</span>
              </div>
              <p style={{ fontSize: "var(--t-base)", color: "var(--text-dim)", lineHeight: 1.6, margin: "var(--s2) 0 0" }}>
                {d}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
