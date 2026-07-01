"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { filterOptions } from "@/lib/data";

const selectClass =
  "h-11 w-full rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink outline-none focus:border-ink";

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="eyebrow">{label}</span>
      {children}
    </label>
  );
}

export function ListingFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const value = (key: string) => params.get(key) ?? "";

  const update = (key: string, val: string) => {
    const next = new URLSearchParams(params.toString());
    if (val) next.set(key, val);
    else next.delete(key);
    router.push(`/properties?${next.toString()}`, { scroll: false });
  };

  // Changing purpose clears whichever budget no longer applies.
  const updatePurpose = (val: string) => {
    const next = new URLSearchParams(params.toString());
    if (val) next.set("purpose", val);
    else next.delete("purpose");
    if (val !== "rent") next.delete("rent");
    if (val !== "buy") next.delete("salePrice");
    router.push(`/properties?${next.toString()}`, { scroll: false });
  };

  const isRent = value("purpose") === "rent";
  const priceKey = isRent ? "rent" : "salePrice";
  const priceOptions = isRent
    ? filterOptions.rentPrices
    : filterOptions.salePrices;

  const hasFilters = params.toString().length > 0;

  return (
    <div className="rounded-2xl border border-line bg-paper p-4 md:p-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Field label="Location">
          <select
            className={selectClass}
            value={value("location")}
            onChange={(e) => update("location", e.target.value)}
          >
            <option value="">Any city</option>
            {filterOptions.locations.map((c) => (
              <option key={c} value={c.toLowerCase()}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Property type">
          <select
            className={selectClass}
            value={value("type")}
            onChange={(e) => update("type", e.target.value)}
          >
            <option value="">All types</option>
            {filterOptions.types.map((t) => (
              <option key={t} value={t.toLowerCase()}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Purpose">
          <select
            className={selectClass}
            value={value("purpose")}
            onChange={(e) => updatePurpose(e.target.value)}
          >
            <option value="">Buy or rent</option>
            {filterOptions.purposes.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label={isRent ? "Max rent" : "Max price"}>
          <select
            className={selectClass}
            value={value(priceKey)}
            onChange={(e) => update(priceKey, e.target.value)}
          >
            <option value="">{isRent ? "Any rent" : "Any price"}</option>
            {priceOptions.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Bedrooms">
          <select
            className={selectClass}
            value={value("beds")}
            onChange={(e) => update("beds", e.target.value)}
          >
            <option value="">Any</option>
            {filterOptions.beds.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Size">
          <select
            className={selectClass}
            value={value("size")}
            onChange={(e) => update("size", e.target.value)}
          >
            <option value="">Any size</option>
            {filterOptions.sizes.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {hasFilters && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => router.push("/properties", { scroll: false })}
            className="text-sm font-medium text-stone underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
