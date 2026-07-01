import { NextResponse } from "next/server";
import { generateAssistantResponse } from "@/lib/leadEngine";
import type { AssistantRequest, ChatMessage } from "@/lib/types";

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

  // Single delegation point. When this becomes an async LLM call, just await it.
  const response = generateAssistantResponse(message, history);

  return NextResponse.json(response, { status: 200 });
}

// Guard other verbs with a clear signal rather than a default 404/500.
export function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}
