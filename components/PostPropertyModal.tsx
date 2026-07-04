"use client";

import { useEffect, useMemo, useState } from "react";
import type { PropertySubmission, SubmissionPurpose } from "@/lib/types";
import { localPropertySubmissions } from "@/lib/propertySubmissions";
import { useBodyScrollLock } from "@/lib/scrollLock";

const PROPERTY_TYPES = ["House", "Apartment", "Plot", "Commercial"] as const;

const EMPTY: PropertySubmission = {
  ownerName: "",
  email: "",
  phone: "",
  city: "",
  area: "",
  purpose: "sell",
  propertyType: "House",
  size: "",
  price: "",
  bedrooms: undefined,
  bathrooms: undefined,
  description: "",
};

type Status = "idle" | "submitting" | "success";
type Errors = Partial<Record<keyof PropertySubmission | "contact", string>>;

const labelCls = "block text-xs font-semibold text-ink";
const inputCls =
  "mt-1.5 h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-stone/60 focus:border-ink";

export function PostPropertyModal() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PropertySubmission>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");

  // Open on the navbar event.
  useEffect(() => {
    const handler = () => {
      setForm(EMPTY);
      setErrors({});
      setStatus("idle");
      setOpen(true);
    };
    window.addEventListener("horizon:post-property", handler);
    return () => window.removeEventListener("horizon:post-property", handler);
  }, []);

  // Lock body scroll (shared/refcounted) + close on Escape while open.
  useBodyScrollLock(open);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const showBeds = useMemo(
    () => form.propertyType === "House" || form.propertyType === "Apartment",
    [form.propertyType]
  );

  const set = <K extends keyof PropertySubmission>(
    key: K,
    value: PropertySubmission[K]
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key] || (key === "email" || key === "phone" ? errors.contact : false)) {
      setErrors((e) => ({ ...e, [key]: undefined, contact: undefined }));
    }
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!form.ownerName.trim()) e.ownerName = "Please enter your name.";
    if (!form.email.trim() && !form.phone.trim())
      e.contact = "Add a phone number or email so we can reach you.";
    if (!form.city.trim()) e.city = "Please enter the city.";
    if (!form.size.trim()) e.size = "Please enter the size.";
    if (!form.price.trim())
      e.price =
        form.purpose === "rent"
          ? "Please enter the monthly rent."
          : "Please enter the expected price.";
    return e;
  };

  const handleSubmit = async (ev: React.SyntheticEvent) => {
    ev.preventDefault();
    const found = validate();
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setStatus("submitting");

    const submission: PropertySubmission = {
      ...form,
      ownerName: form.ownerName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      area: form.area.trim(),
      size: form.size.trim(),
      price: form.price.trim(),
      description: form.description.trim(),
      bedrooms: showBeds ? form.bedrooms : undefined,
      bathrooms: showBeds ? form.bathrooms : undefined,
    };

    // Save as a pending draft to PostgreSQL when available; otherwise (no DB /
    // offline) fall back to a localStorage draft. Never auto-published either way.
    let stored = false;
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
      });
      const data = (await res.json().catch(() => null)) as
        | { enabled?: boolean; draft?: unknown }
        | null;
      if (res.ok && data?.enabled && data.draft) {
        stored = true;
      } else {
        stored = localPropertySubmissions.add(submission) !== null;
      }
    } catch {
      stored = localPropertySubmissions.add(submission) !== null;
    }
    if (!stored) {
      // Both the API and local storage failed — never show a false success.
      setErrors({
        contact:
          "We couldn't save your submission just now — please try again in a moment.",
      });
      setStatus("idle");
      return;
    }
    setStatus("success");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Post a property"
        className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-paper animate-slide-up sm:max-w-lg sm:rounded-2xl sm:animate-none"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <p className="font-serif text-lg font-semibold leading-tight">
              Post a property
            </p>
            <p className="mt-0.5 text-xs text-stone">
              Submit your listing for review — our team verifies before it goes live.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {status === "success" ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-paper">
              <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
                <path
                  d="M5 13l4 4L19 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <p className="mt-5 font-serif text-xl font-semibold">
              Your property has been submitted for review.
            </p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone">
              Thank you. We&rsquo;ll verify the details and get in touch using the
              contact information you provided.
            </p>
            <div className="mt-7 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => {
                  setForm(EMPTY);
                  setErrors({});
                  setStatus("idle");
                }}
                className="h-11 rounded-full border border-line px-6 text-sm font-semibold text-ink transition-colors hover:border-ink sm:w-auto"
              >
                Post another
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-11 rounded-full bg-ink px-6 text-sm font-semibold text-paper transition-colors hover:bg-ink/85 sm:w-auto"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6"
            noValidate
          >
            {/* Name + contact */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="pp-name">
                  Owner / agent name <span className="text-stone">*</span>
                </label>
                <input
                  id="pp-name"
                  className={inputCls}
                  value={form.ownerName}
                  onChange={(e) => set("ownerName", e.target.value)}
                  placeholder="e.g. Ahmed Khan"
                />
                {errors.ownerName && <Err msg={errors.ownerName} />}
              </div>
              <div>
                <label className={labelCls} htmlFor="pp-phone">
                  Phone <span className="text-stone">*</span>
                </label>
                <input
                  id="pp-phone"
                  className={inputCls}
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="03xx xxxxxxx"
                  inputMode="tel"
                />
              </div>
            </div>

            <div>
              <label className={labelCls} htmlFor="pp-email">
                Email
              </label>
              <input
                id="pp-email"
                className={inputCls}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@example.com"
                inputMode="email"
              />
              {errors.contact && <Err msg={errors.contact} />}
            </div>

            {/* Purpose */}
            <div>
              <span className={labelCls}>Purpose</span>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {(["sell", "rent"] as SubmissionPurpose[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set("purpose", p)}
                    aria-pressed={form.purpose === p}
                    className={`h-11 rounded-lg border text-sm font-semibold capitalize transition-colors ${
                      form.purpose === p
                        ? "border-ink bg-ink text-paper"
                        : "border-line text-ink hover:border-ink"
                    }`}
                  >
                    {p === "sell" ? "Sell" : "Rent"}
                  </button>
                ))}
              </div>
            </div>

            {/* Type + size */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="pp-type">
                  Property type
                </label>
                <select
                  id="pp-type"
                  className={`${inputCls} appearance-none bg-white`}
                  value={form.propertyType}
                  onChange={(e) => set("propertyType", e.target.value)}
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="pp-size">
                  Size <span className="text-stone">*</span>
                </label>
                <input
                  id="pp-size"
                  className={inputCls}
                  value={form.size}
                  onChange={(e) => set("size", e.target.value)}
                  placeholder="e.g. 5 Marla / 1,600 sq ft"
                />
                {errors.size && <Err msg={errors.size} />}
              </div>
            </div>

            {/* City + area */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="pp-city">
                  City <span className="text-stone">*</span>
                </label>
                <input
                  id="pp-city"
                  className={inputCls}
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="e.g. Islamabad"
                />
                {errors.city && <Err msg={errors.city} />}
              </div>
              <div>
                <label className={labelCls} htmlFor="pp-area">
                  Area / neighbourhood
                </label>
                <input
                  id="pp-area"
                  className={inputCls}
                  value={form.area}
                  onChange={(e) => set("area", e.target.value)}
                  placeholder="e.g. G-13"
                />
              </div>
            </div>

            {/* Price + beds/baths */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="pp-price">
                  {form.purpose === "rent" ? "Monthly rent" : "Expected price"}{" "}
                  <span className="text-stone">*</span>
                </label>
                <input
                  id="pp-price"
                  className={inputCls}
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder={
                    form.purpose === "rent"
                      ? "e.g. PKR 1.6 Lakh"
                      : "e.g. PKR 2.5 Crore"
                  }
                />
                {errors.price && <Err msg={errors.price} />}
              </div>
              {showBeds && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls} htmlFor="pp-beds">
                      Bedrooms
                    </label>
                    <input
                      id="pp-beds"
                      type="number"
                      min={0}
                      className={inputCls}
                      value={form.bedrooms ?? ""}
                      onChange={(e) =>
                        set(
                          "bedrooms",
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value)
                        )
                      }
                      placeholder="3"
                    />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="pp-baths">
                      Bathrooms
                    </label>
                    <input
                      id="pp-baths"
                      type="number"
                      min={0}
                      className={inputCls}
                      value={form.bathrooms ?? ""}
                      onChange={(e) =>
                        set(
                          "bathrooms",
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value)
                        )
                      }
                      placeholder="2"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className={labelCls} htmlFor="pp-desc">
                Short description
              </label>
              <textarea
                id="pp-desc"
                rows={3}
                className={`${inputCls} h-auto resize-none py-2.5`}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Key highlights — condition, features, nearby landmarks…"
              />
            </div>

            {/* Upload placeholder (UI only) */}
            <div>
              <span className={labelCls}>Photos</span>
              <div className="mt-1.5 flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-white px-4 py-6 text-center">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-stone" aria-hidden>
                  <path
                    d="M12 16V4m0 0L8 8m4-4l4 4M4 20h16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="mt-2 text-xs font-medium text-ink">
                  Drag &amp; drop photos here
                </p>
                <p className="mt-0.5 text-[11px] text-stone">
                  Uploads open once your listing is approved.
                </p>
              </div>
            </div>
          </form>
        )}

        {/* Footer actions (hidden on the success screen) */}
        {status !== "success" && (
          <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-11 rounded-full px-5 text-sm font-semibold text-stone transition-colors hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={status === "submitting"}
              className="flex h-11 min-w-[9rem] items-center justify-center rounded-full bg-ink px-6 text-sm font-semibold text-paper transition-colors hover:bg-ink/85 disabled:opacity-60"
            >
              {status === "submitting" ? "Submitting…" : "Submit for review"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Err({ msg }: { msg: string }) {
  return <p className="mt-1 text-[11px] font-medium text-red-600">{msg}</p>;
}
