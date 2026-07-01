"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";
import { filterOptions, listingTabs } from "@/lib/data";

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <label className="flex flex-1 flex-col gap-1.5 px-4 py-3 md:py-2">
      <span className="eyebrow">{label}</span>
      {children}
    </label>
  );
}

const selectClass =
  "w-full bg-transparent text-sm font-medium text-ink outline-none appearance-none cursor-pointer";

// Maps the homepage tabs to a purpose filter (only Buy/Rent narrow results).
const TAB_TO_PURPOSE: Record<string, string> = { Buy: "buy", Rent: "rent" };

export function SearchFilters() {
  const router = useRouter();
  const [tab, setTab] = useState("Buy");
  const [values, setValues] = useState({
    location: "",
    type: "",
    price: "",
    size: "",
    beds: "",
  });

  const set = (key: keyof typeof values) => (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const isRent = tab === "Rent";

  const showProperties = () => {
    const params = new URLSearchParams();
    const purpose = TAB_TO_PURPOSE[tab];
    if (purpose) params.set("purpose", purpose);
    if (values.location) params.set("location", values.location);
    if (values.type) params.set("type", values.type);
    if (values.beds) params.set("beds", values.beds);
    if (values.size) params.set("size", values.size);
    // Route the budget to the right field based on the active tab.
    if (values.price) params.set(isRent ? "rent" : "salePrice", values.price);
    const qs = params.toString();
    router.push(qs ? `/properties?${qs}` : "/properties");
  };

  return (
    <section aria-label="Property search" className="relative z-30">
      <div className="shell -mt-28 md:-mt-24">
        <div className="rounded-2xl border border-line bg-paper shadow-[0_30px_80px_-40px_rgba(10,10,10,0.4)]">
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto border-b border-line px-3 pt-3 no-scrollbar">
            {listingTabs.map((t) => {
              const active = tab === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setTab(t.value);
                    // Sale and rent budgets aren't interchangeable — reset it.
                    setValues((v) => ({ ...v, price: "" }));
                  }}
                  className={`relative whitespace-nowrap rounded-t-lg px-4 py-3 text-sm font-semibold transition-colors ${
                    active ? "text-ink" : "text-stone hover:text-ink"
                  }`}
                >
                  {t.label}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-ink" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-px md:flex-row md:items-stretch">
            <div className="grid flex-1 grid-cols-1 divide-y divide-line sm:grid-cols-2 md:flex md:divide-x md:divide-y-0">
              <Field label="Location">
                <select
                  className={selectClass}
                  value={values.location}
                  onChange={set("location")}
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
                  value={values.type}
                  onChange={set("type")}
                >
                  <option value="">All types</option>
                  {filterOptions.types.map((t) => (
                    <option key={t} value={t.toLowerCase()}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={isRent ? "Max rent" : "Max price"}>
                <select
                  className={selectClass}
                  value={values.price}
                  onChange={set("price")}
                >
                  <option value="">{isRent ? "Any rent" : "Any price"}</option>
                  {(isRent
                    ? filterOptions.rentPrices
                    : filterOptions.salePrices
                  ).map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Size">
                <select
                  className={selectClass}
                  value={values.size}
                  onChange={set("size")}
                >
                  <option value="">Any size</option>
                  {filterOptions.sizes.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Bedrooms">
                <select
                  className={selectClass}
                  value={values.beds}
                  onChange={set("beds")}
                >
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
            <div className="flex items-center gap-3 border-t border-line p-3 md:border-l md:border-t-0">
              <Button
                onClick={showProperties}
                variant="primary"
                size="md"
                className="flex-1 md:flex-none"
              >
                Show properties
              </Button>
            </div>
          </div>
        </div>

        {/* More options */}
        <div className="mt-3 flex justify-center md:justify-end">
          <Button href="/properties" variant="ghost" size="sm">
            More options +
          </Button>
        </div>
      </div>
    </section>
  );
}
