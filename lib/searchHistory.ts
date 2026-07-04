import type { LeadFields, SearchHistoryEntry } from "./types";

/**
 * "Recent searches" — the concierge's local long-term memory.
 *
 * Local (per-browser) for now. Swap this repository for a PostgreSQL-backed one
 * later (conversations / messages / leads tables) without touching the UI:
 *
 *   export const dbSearchHistory: SearchHistoryRepository = {
 *     list:   () => fetch("/api/history").then(r => r.json()),
 *     upsert: (e) => fetch("/api/history", { method: "PUT", body: JSON.stringify(e) }).then(...),
 *     remove: (id) => fetch(`/api/history?id=${id}`, { method: "DELETE" }).then(...),
 *     clear:  () => fetch("/api/history", { method: "DELETE" }).then(...),
 *   };
 */
export interface SearchHistoryRepository {
  list(): SearchHistoryEntry[];
  upsert(entry: SearchHistoryEntry): SearchHistoryEntry[];
  remove(id: string): SearchHistoryEntry[];
  clear(): void;
}

const STORAGE_KEY = "horizon:search-history:v1";
const MAX_ENTRIES = 12;

const byNewest = (a: SearchHistoryEntry, b: SearchHistoryEntry) =>
  b.updatedAt - a.updatedAt;

function read(): SearchHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SearchHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function write(items: SearchHistoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota / private-mode failures
  }
}

export const localSearchHistory: SearchHistoryRepository = {
  list() {
    return read().sort(byNewest);
  },
  upsert(entry) {
    const next = [entry, ...read().filter((e) => e.id !== entry.id)]
      .sort(byNewest)
      .slice(0, MAX_ENTRIES);
    write(next);
    return next;
  },
  remove(id) {
    const next = read()
      .filter((e) => e.id !== id)
      .sort(byNewest);
    write(next);
    return next;
  },
  clear() {
    write([]);
  },
};

/* -------------------------------- helpers --------------------------------- */

const cityOf = (loc?: string) =>
  loc?.split(",").pop()?.trim().toLowerCase() || "";

/**
 * Turn extracted requirements into a title, a summary line, and a grouping key.
 * Returns null when there's nothing worth remembering yet. The `key`
 * (city + purpose) decides whether a turn continues the current search or
 * starts a new recent-search entry.
 */
export function summariseLead(
  lead: LeadFields
): { title: string; summary: string; key: string } | null {
  if (!lead.location && !lead.propertyType && !lead.purpose && !lead.budget) {
    return null;
  }

  const invest = /invest/i.test(lead.purpose ?? "");
  const size = lead.size ? `${lead.size} ` : "";
  const where = lead.location ? ` in ${lead.location}` : "";
  const title =
    invest && !lead.propertyType
      ? `Investment property${where}`
      : `${size}${lead.propertyType ?? "Property"}${where}`.trim();

  const purposeLabel = lead.purpose
    ? /rent/i.test(lead.purpose)
      ? "Rent"
      : invest
        ? "Invest"
        : "Buy"
    : null;

  const summary = [
    purposeLabel,
    lead.budget,
    typeof lead.bedrooms === "number" ? `${lead.bedrooms} bed` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const key = `${cityOf(lead.location)}|${(lead.purpose ?? "").toLowerCase()}`;

  return { title: title || "Property search", summary, key };
}
