import type { SavedApiResponse, SavedProperty } from "./types";

/**
 * Persistence boundary for the saved-properties shortlist.
 *
 * Item-level methods mirror the REST verbs (GET / POST / DELETE), so the
 * localStorage and API adapters below are interchangeable — pass either to the
 * provider: `<SavedProvider repository={apiSavedRepository}>`.
 *
 * Every mutation returns the authoritative, newest-first list so the caller can
 * reconcile its optimistic state.
 */
export interface SavedRepository {
  load(): Promise<SavedProperty[]>;
  add(item: SavedProperty): Promise<SavedProperty[]>;
  remove(id: string): Promise<SavedProperty[]>;
  clear(): Promise<SavedProperty[]>;
}

const sortNewest = (items: SavedProperty[]) =>
  [...items].sort((a, b) => b.savedAt - a.savedAt);

/* ------------------------------------------------------------------ */
/*  localStorage adapter — the working default (offline, per-browser)  */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "horizon:saved-properties:v1";

function read(): SavedProperty[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SavedProperty[]) : [];
  } catch {
    return [];
  }
}

function write(items: SavedProperty[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore quota / private-mode failures — UI still works in-memory.
  }
}

export const localSavedRepository: SavedRepository = {
  async load() {
    return sortNewest(read());
  },
  async add(item) {
    const items = read();
    const next = items.some((i) => i.id === item.id)
      ? items // duplicate — no change
      : [item, ...items];
    write(next);
    return sortNewest(next);
  },
  async remove(id) {
    const next = read().filter((i) => i.id !== id);
    write(next);
    return sortNewest(next);
  },
  async clear() {
    write([]);
    return [];
  },
};

/* ------------------------------------------------------------------ */
/*  API adapter — backed by /api/saved (in-memory mock for now).       */
/*  Swap the provider's repository to this to go server-backed.        */
/* ------------------------------------------------------------------ */

async function unwrap(res: Response): Promise<SavedProperty[]> {
  if (!res.ok) throw new Error(`Saved API error (${res.status})`);
  const data = (await res.json()) as SavedApiResponse;
  return data.items ?? [];
}

export const apiSavedRepository: SavedRepository = {
  async load() {
    return unwrap(await fetch("/api/saved"));
  },
  async add(item) {
    return unwrap(
      await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      })
    );
  },
  async remove(id) {
    return unwrap(
      await fetch(`/api/saved?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
    );
  },
  async clear() {
    return unwrap(await fetch("/api/saved?id=*", { method: "DELETE" }));
  },
};

/* ------------------------------------------------------------------ */
/*  Selection — the single place the active adapter is chosen.         */
/* ------------------------------------------------------------------ */

/**
 * Resolve the repository from `NEXT_PUBLIC_SAVED_PROVIDER`:
 *   - "api"   → apiSavedRepository (the /api/saved backend)
 *   - default → localSavedRepository (browser localStorage)
 *
 * Note: with "api", persistence is the in-memory mock in
 * lib/server/savedStore.ts — it resets on server restart and is not shared
 * across serverless instances until PostgreSQL is wired in.
 */
export function resolveSavedRepository(): SavedRepository {
  return process.env.NEXT_PUBLIC_SAVED_PROVIDER === "api"
    ? apiSavedRepository
    : localSavedRepository;
}
