import type {
  ConversationDetail,
  ConversationsResponse,
} from "./types";

/**
 * Client helpers for PostgreSQL-backed chat history. Each call degrades to a
 * safe default on any failure, so the concierge keeps working (localStorage
 * fallback) when the API/DB is unavailable.
 */

export async function fetchConversations(): Promise<ConversationsResponse> {
  try {
    const res = await fetch("/api/conversations", { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as ConversationsResponse;
  } catch {
    return { enabled: false, conversations: [] };
  }
}

export async function fetchConversation(
  id: string
): Promise<ConversationDetail | null> {
  try {
    const res = await fetch(`/api/conversations/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as ConversationDetail;
  } catch {
    return null;
  }
}

/** Create a fresh empty conversation; returns its id (or null on failure). */
export async function createConversationRemote(): Promise<string | null> {
  try {
    const res = await fetch("/api/conversations", { method: "POST" });
    const data = (await res.json()) as { id?: string | null };
    return data.id ?? null;
  } catch {
    return null;
  }
}

export async function deleteConversationRemote(id: string): Promise<void> {
  try {
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
  } catch {
    // ignore — sidebar refresh will reconcile
  }
}

export async function clearConversationsRemote(): Promise<void> {
  try {
    await fetch("/api/conversations", { method: "DELETE" });
  } catch {
    // ignore
  }
}
