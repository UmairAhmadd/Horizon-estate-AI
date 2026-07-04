import { NextResponse } from "next/server";
import { dbEnabled } from "@/lib/db";
import {
  clearConversations,
  createConversation,
  listConversations,
} from "@/lib/server/leadStore";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  newSessionId,
  readSessionId,
} from "@/lib/server/session";
import type { ConversationsResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function setSessionCookie(res: NextResponse, sessionId: string) {
  res.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

// List the session's conversations (and whether DB memory is active at all).
export async function GET(request: Request) {
  if (!dbEnabled) {
    return NextResponse.json<ConversationsResponse>({
      enabled: false,
      conversations: [],
    });
  }
  const sessionId = readSessionId(request);
  const conversations = sessionId ? await listConversations(sessionId) : [];
  return NextResponse.json<ConversationsResponse>({
    enabled: true,
    conversations,
  });
}

// Start a new (empty) conversation. Returns its id; establishes a session first.
export async function POST(request: Request) {
  if (!dbEnabled) {
    return NextResponse.json({ enabled: false, id: null });
  }
  const sessionId = readSessionId(request) ?? newSessionId();
  const id = await createConversation(sessionId);
  const res = NextResponse.json({ enabled: true, id });
  setSessionCookie(res, sessionId);
  return res;
}

// Clear all of the session's conversations.
export async function DELETE(request: Request) {
  if (!dbEnabled) return NextResponse.json({ ok: true });
  const sessionId = readSessionId(request);
  if (sessionId) await clearConversations(sessionId);
  return NextResponse.json({ ok: true });
}
