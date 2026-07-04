import type { LeadMemory } from "./types";

/**
 * Lead memory persistence boundary.
 *
 * Stores the customer's evolving requirements, a short chat summary, and the
 * ids of their last matches + saved properties. Local (per-browser) for now.
 *
 * SWAP POINT — implement this interface against PostgreSQL later. The shape maps
 * cleanly onto tables:
 *   leads(id, requirements jsonb, chat_summary text, updated_at)
 *   lead_matches(lead_id, property_id)
 *   saved_properties(lead_id, property_id)
 *
 *   export const dbLeadMemory: LeadMemoryRepository = {
 *     load:  () => fetch("/api/lead-memory").then(r => r.json()),
 *     save:  (m) => fetch("/api/lead-memory", { method: "PUT", body: JSON.stringify(m) }),
 *     clear: () => fetch("/api/lead-memory", { method: "DELETE" }),
 *   };
 */
export interface LeadMemoryRepository {
  load(): LeadMemory | null;
  save(memory: LeadMemory): void;
  clear(): void;
}

const STORAGE_KEY = "horizon:lead-memory:v1";

export const localLeadMemory: LeadMemoryRepository = {
  load() {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as LeadMemory) : null;
    } catch {
      return null;
    }
  },
  save(memory) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
    } catch {
      // ignore quota / private-mode failures
    }
  },
  clear() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  },
};
