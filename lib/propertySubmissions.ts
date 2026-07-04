import type { PropertyDraft, PropertySubmission } from "./types";

/**
 * "Post a property" — owner/agent listing submissions.
 *
 * Local (per-browser) draft store for now. Every submission is saved as a
 * `pending` draft and is NEVER auto-published to the public listings — a review
 * step (later, an admin dashboard) flips `status` to `approved`.
 *
 * Swap this repository for a PostgreSQL-backed one later without touching the
 * modal UI:
 *
 *   export const dbPropertySubmissions: PropertySubmissionRepository = {
 *     list:   () => fetch("/api/submissions").then(r => r.json()),
 *     add:    (s) => fetch("/api/submissions", { method: "POST", body: JSON.stringify(s) }).then(r => r.json()),
 *     remove: (id) => fetch(`/api/submissions?id=${id}`, { method: "DELETE" }).then(r => r.json()),
 *     clear:  () => fetch("/api/submissions", { method: "DELETE" }).then(() => undefined),
 *   };
 */
export interface PropertySubmissionRepository {
  list(): PropertyDraft[];
  /** Persist a new submission as a `pending` draft and return it. */
  add(submission: PropertySubmission): PropertyDraft;
  remove(id: string): PropertyDraft[];
  clear(): void;
}

const STORAGE_KEY = "horizon:property-drafts:v1";

const byNewest = (a: PropertyDraft, b: PropertyDraft) => b.createdAt - a.createdAt;

function read(): PropertyDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as PropertyDraft[]) : [];
  } catch {
    return [];
  }
}

function write(items: PropertyDraft[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota / private-mode failures
  }
}

export const localPropertySubmissions: PropertySubmissionRepository = {
  list() {
    return read().sort(byNewest);
  },
  add(submission) {
    const draft: PropertyDraft = {
      ...submission,
      id: `p_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      status: "pending",
      createdAt: Date.now(),
    };
    write([draft, ...read()]);
    return draft;
  },
  remove(id) {
    const next = read().filter((d) => d.id !== id);
    write(next);
    return next.sort(byNewest);
  },
  clear() {
    write([]);
  },
};
