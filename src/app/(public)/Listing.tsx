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
      <div style={{ padding: "18px 20px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-dim)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {v.year} · {v.make}
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 23, fontWeight: 600, marginTop: 4 }}>
              {v.model}
            </div>
          </div>
          <Badge status={v.available ? "AVAILABLE" : "RENTED"}>
            {v.available ? "Available" : "Booked"}
          </Badge>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 18 }}>
          <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-dim)" }}>
            <span>{v.seats} seats</span>
            <span>·</span>
            <span>{v.transmission}</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <span className="kpi-num" style={{ fontSize: 26, color: "var(--accent)" }}>
              {money(v.weeklyPrice)}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-dim)" }}> /wk</span>
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
          Chicago · Miami · New York · Las Vegas
        </div>
        <h1
          className="hero-h1"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: 60,
            lineHeight: 1.08,
            margin: 0,
            letterSpacing: "-0.01em",
            maxWidth: 840,
            marginInline: "auto",
          }}
        >
          The keys to something{" "}
          <span style={{ fontStyle: "italic", color: "var(--accent)" }}>exceptional</span>, by the
          week.
        </h1>
        <p
          style={{
            color: "var(--text-dim)",
            fontSize: 16.5,
            maxWidth: 540,
            margin: "22px auto 0",
            lineHeight: 1.6,
          }}
        >
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
            <span className="mono" style={{ fontSize: 12.5, color: "var(--accent)" }}>
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
        <div
          style={{
            marginLeft: "auto",
            fontSize: 12.5,
            color: "var(--text-dim)",
            fontFamily: "var(--font-mono)",
            paddingBottom: 10,
          }}
        >
          {list.length} VEHICLES
        </div>
      </div>

      {/* grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
        {list.map((v) => (
          <VehicleCard key={v.id} v={v} />
        ))}
      </div>

      {/* how it works */}
      <section style={{ marginTop: 90 }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            How it works
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 42, margin: 0, lineHeight: 1.05 }}>
            Considered, not automated.
          </h2>
          <p
            style={{
              color: "var(--text-dim)",
              fontSize: 15.5,
              maxWidth: 520,
              margin: "16px auto 0",
              lineHeight: 1.6,
            }}
          >
            Every reservation passes through a person. It is what keeps the fleet immaculate and the
            experience uncompromising.
          </p>
        </div>
        <div className="r-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
          {(
            [
              ["01", "Request", "Choose your vehicle and dates, share your details and insurance preference. Nothing is charged."],
              ["02", "Review", "Our team verifies your license and insurance, confirms availability, and approves — usually within 24 hours."],
              ["03", "Collect", "On approval we arrange handover. Company coverage is finalized; customer policies are confirmed valid."],
              ["04", "Drive", "Billing runs in clean weekly installments for the length of your rental. No deposits held hostage."],
            ] as [string, string, string][]
          ).map(([n, t, d]) => (
            <div key={n} className="card" style={{ padding: "24px 22px" }}>
              <div className="kpi-num" style={{ fontSize: 34, color: "var(--accent)" }}>
                {n}
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 600, marginTop: 10 }}>
                {t}
              </div>
              <p style={{ fontSize: 13.5, color: "var(--text-dim)", lineHeight: 1.6, marginTop: 8, marginBottom: 0 }}>
                {d}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
