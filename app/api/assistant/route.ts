import { NextResponse } from "next/server";
import { generateAssistantResponse } from "@/lib/leadEngine";
import { dbEnabled } from "@/lib/db";
import { loadLeadPreferences, recordTurn } from "@/lib/server/leadStore";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  newSessionId,
  readSessionId,
} from "@/lib/server/session";
import type { AssistantRequest, ChatMessage, LeadFields } from "@/lib/types";

// Runs on the Node.js runtime — ready for an SDK (e.g. OpenAI) later.
export const runtime = "nodejs";
// This is dynamic per-request; never cache a chat turn.
export const dynamic = "force-dynamic";

function isValidHistory(value: unknown): value is ChatMessage[] {
  return (
    Array.isArray(value) &&
    value.every(
      (m) =>
        m &&
        typeof m === "object" &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
    )
  );
}

export async function POST(request: Request) {
  let body: AssistantRequest;

  try {
    body = (await request.json()) as AssistantRequest;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json(
      { error: "`message` is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  const history = isValidHistory(body.history) ? body.history : [];

  // Long-term memory only engages when a database is configured. Without it,
  // this path is unchanged (no cookie, no persistence).
  let sessionId: string | undefined;
  let priorLead: LeadFields | null = null;
  if (dbEnabled) {
    sessionId = readSessionId(request) ?? newSessionId();
    priorLead = await loadLeadPreferences(sessionId);
  }

  // Delegates to an OpenAI-compatible provider when configured, else the mock.
  const response = await generateAssistantResponse(message, history, priorLead);

  const res = NextResponse.json(response, { status: 200 });

  if (dbEnabled && sessionId) {
    await recordTurn({ sessionId, userMessage: message, response });
    res.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
  }

  return res;
}

// Guard other verbs with a clear signal rather than a default 404/500.
export function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}
