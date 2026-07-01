"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useSaved } from "@/context/SavedProvider";

export function SavedDrawer() {
  const { items, count, isOpen, closeDrawer, remove, clear } = useSaved();

  // Lock body scroll + close on Escape while open.
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDrawer();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, closeDrawer]);

  return (
    <>
      {/* Scrim */}
      <div
        onClick={closeDrawer}
        aria-hidden
        className={`fixed inset-0 z-[60] bg-ink/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Saved properties"
        className={`fixed inset-y-0 right-0 z-[70] flex w-full max-w-[420px] flex-col bg-paper shadow-[0_0_80px_-20px_rgba(10,10,10,0.5)] transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <p className="eyebrow">Your shortlist</p>
            <h2 className="mt-1 font-serif text-xl font-semibold leading-none">
              Saved properties
              {count > 0 && (
                <span className="ml-1.5 text-base font-normal text-stone">
                  ({count})
                </span>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close saved properties"
            className="flex h-9 w-9 items-center justify-center rounded-full text-stone transition-colors hover:bg-ink/5 hover:text-ink"
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

        {/* Body */}
        {count === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-line text-stone">
              <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
                <path
                  d="M6 4h12v16l-6-4-6 4V4z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <p className="font-serif text-lg font-semibold">
              No saved properties yet
            </p>
            <p className="max-w-[16rem] text-sm text-stone">
              Tap the bookmark on any listing or AI match, and it’ll wait for you
              here.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {items.map((it) => (
                <article
                  key={it.id}
                  className="flex gap-3 rounded-xl border border-line bg-white p-2.5"
                >
                  <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-lg bg-line">
                    <Image
                      src={it.image}
                      alt={it.title}
                      fill
                      sizes="68px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate font-serif text-sm font-semibold leading-tight">
                        {it.title}
                      </h3>
                      <span className="whitespace-nowrap text-sm font-semibold">
                        {it.price}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-stone">
                      {it.location}
                    </p>
                    {(it.beds || it.baths || it.area) && (
                      <p className="mt-1 truncate text-[11px] text-stone">
                        {[
                          it.beds ? `${it.beds} Bed` : null,
                          it.baths ? `${it.baths} Bath` : null,
                          it.area,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    <div className="mt-auto flex items-center gap-4 pt-2">
                      <Link
                        href={`/properties/${it.id}`}
                        onClick={closeDrawer}
                        className="text-xs font-semibold text-ink underline-offset-4 transition-colors hover:underline"
                      >
                        View details
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(it.id)}
                        className="text-xs font-medium text-stone underline-offset-4 transition-colors hover:text-ink hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-line px-4 py-3">
              <button
                type="button"
                onClick={clear}
                className="text-xs font-medium text-stone underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                Clear all
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
