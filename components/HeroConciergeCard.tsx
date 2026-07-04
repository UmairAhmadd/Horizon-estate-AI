"use client";

import { ConciergeIcon } from "./ConciergeIcon";

const chips = ["Budget aware", "Buy / Rent", "Smart shortlist"];

/**
 * The hero's product surface for the concierge — a clean white card that sits
 * beside the hero photo. Clicking it opens the concierge drawer.
 */
export function HeroConciergeCard() {
  const open = () =>
    window.dispatchEvent(new CustomEvent("horizon:ask-ai", { detail: {} }));

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Open the AI Property Concierge"
      className="group flex h-full w-full flex-col rounded-[20px] border border-line bg-white p-6 text-left shadow-[0_30px_70px_-45px_rgba(10,10,10,0.4)] transition-colors hover:border-ink/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/60"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-paper">
          <ConciergeIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold leading-tight">
            AI Property Concierge
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-stone">
            <span className="h-1.5 w-1.5 rounded-full bg-ink" />
            Smart matching
          </p>
        </div>
      </div>

      <p className="mt-6 font-serif text-2xl font-semibold leading-snug">
        Describe your ideal home and get a matched shortlist.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {chips.map((c) => (
          <span
            key={c}
            className="rounded-full border border-line px-3 py-1 text-[11px] font-medium text-stone"
          >
            {c}
          </span>
        ))}
      </div>

      <span className="mt-auto flex h-12 items-center justify-center gap-1.5 rounded-full bg-ink pt-0 text-sm font-semibold text-paper transition-colors group-hover:bg-ink/85">
        Start AI Search
        <span
          aria-hidden
          className="transition-transform duration-200 group-hover:translate-x-0.5"
        >
          →
        </span>
      </span>
    </button>
  );
}
