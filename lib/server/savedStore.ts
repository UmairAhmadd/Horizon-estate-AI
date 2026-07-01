import "server-only";
import type { SavedProperty } from "@/lib/types";

/**
 * In-memory mock store for saved properties (server side).
 *
 * ⚠️ Not durable: this resets on server restart and is NOT shared across
 * serverless instances. It exists so /api/saved has real behaviour to develop
 * against without a database.
 *
 * SWAP POINT — replace these four functions with PostgreSQL queries. Keep the
 * signatures identical and the route + client repository need no changes:
 *
 *   export async function getAll() {
 *     return db.query("SELECT * FROM saved_properties ORDER BY saved_at DESC");
 *   }
 *   export async function addItem(item) {
 *     await db.query(
 *       `INSERT INTO saved_properties (...) VALUES (...)
 *        ON CONFLICT (id) DO NOTHING`, [...]);
 *     return getAll();
 *   }
 *   ...and so on. (Auth/user scoping comes later — no user column yet.)
 */

let store: SavedProperty[] = [];

/** Newest-first snapshot. */
export function getAll(): SavedProperty[] {
  return [...store].sort((a, b) => b.savedAt - a.savedAt);
}

/** Add an item, ignoring duplicates by id. Returns the updated list. */
export function addItem(item: SavedProperty): SavedProperty[] {
  if (!store.some((i) => i.id === item.id)) {
    store = [item, ...store];
  }
  return getAll();
}

/** Remove one item by id. Returns the updated list. */
export function removeItem(id: string): SavedProperty[] {
  store = store.filter((i) => i.id !== id);
  return getAll();
}

/** Remove all items. Returns the (empty) list. */
export function clearAll(): SavedProperty[] {
  store = [];
  return getAll();
}
