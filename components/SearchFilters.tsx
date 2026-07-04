"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";
import { filterOptions } from "@/lib/data";

/* ------------------------------- field icons ------------------------------ */

const iconCls = "h-[18px] w-[18px] shrink-0 text-stone";

const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={iconCls} aria-hidden>
    <path
      d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);
const TypeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={iconCls} aria-hidden>
    <path d="M4 20h16M6 20V6l7-2v16M18 20V9l-5-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M9 9h1M9 12h1M9 15h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const PriceIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={iconCls} aria-hidden>
    <path d="M12 3v18M15.5 7.5A3 3 0 0 0 12.5 6h-1a2.5 2.5 0 0 0 0 5h1a2.5 2.5 0 0 1 0 5h-1a3 3 0 0 1-3-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const BedIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={iconCls} aria-hidden>
    <path d="M3 8v10M3 12h18v6M21 12v-1a3 3 0 0 0-3-3h-4v4M10 12V9a1 1 0 0 1 1-1h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const SlidersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M8 14v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/* -------------------------------- field ----------------------------------- */

const selectClass =
  "w-full cursor-pointer appearance-none bg-transparent text-sm font-semibold text-ink outline-none";

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5">
      {icon}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[11px] leading-tight text-stone">{label}</span>
        {children}
      </span>
    </label>
  );
}

export function SearchFilters() {
  const router = useRouter();
  const [values, setValues] = useState({
    location: "",
    type: "",
    price: "",
    beds: "",
  });

  const set =
    (key: keyof typeof values) => (e: React.ChangeEvent<HTMLSelectElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value }));

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (values.location) params.set("location", values.location);
    if (values.type) params.set("type", values.type);
    // Homepage quick-search assumes a purchase budget; rent lives on /properties.
    if (values.price) params.set("salePrice", values.price);
    if (values.beds) params.set("beds", values.beds);
    const qs = params.toString();
    router.push(qs ? `/properties?${qs}` : "/properties");
  };

  return (
    <form
      onSubmit={search}
      aria-label="Property search"
      className="flex flex-col gap-2 rounded-3xl border border-line bg-white p-2 shadow-[0_30px_70px_-45px_rgba(10,10,10,0.4)] md:flex-row md:items-center md:gap-1 md:rounded-full md:p-1.5"
    >
      <div className="grid flex-1 grid-cols-1 divide-y divide-line sm:grid-cols-2 md:flex md:divide-x md:divide-y-0">
        <Field icon={<PinIcon />} label="Location">
          <select className={selectClass} value={values.location} onChange={set("location")}>
            <option value="">Any city</option>
            {filterOptions.locations.map((c) => (
              <option key={c} value={c.toLowerCase()}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field icon={<TypeIcon />} label="Property type">
          <select className={selectClass} value={values.type} onChange={set("type")}>
            <option value="">All types</option>
            {filterOptions.types.map((t) => (
              <option key={t} value={t.toLowerCase()}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        <Field icon={<PriceIcon />} label="Price">
          <select className={selectClass} value={values.price} onChange={set("price")}>
            <option value="">Any price</option>
            {filterOptions.salePrices.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>

        <Field icon={<BedIcon />} label="Bedrooms">
          <select className={selectClass} value={values.beds} onChange={set("beds")}>
            <option value="">Any</option>
            {filterOptions.beds.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 md:pr-1">
        <Button
          href="/properties"
          variant="ghost"
          size="md"
          className="flex-1 md:flex-none"
        >
          <SlidersIcon />
          More
        </Button>
        <Button type="submit" variant="primary" size="md" className="flex-1 px-7 md:flex-none">
          Search
        </Button>
      </div>
    </form>
  );
}
