import { NextResponse } from "next/server";
import { dbEnabled } from "@/lib/db";
import { deleteConversation, getConversation } from "@/lib/server/leadStore";
import { readSessionId } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Reload a conversation's messages + lead context.
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!dbEnabled) {
    return NextResponse.json({ error: "No database configured." }, { status: 404 });
  }
  const sessionId = readSessionId(request);
  const detail = sessionId
    ? await getConversation(sessionId, params.id)
    : null;
  if (!detail) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json(detail);
}

// Delete a single conversation.
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!dbEnabled) return NextResponse.json({ ok: true });
  const sessionId = readSessionId(request);
  if (sessionId) await deleteConversation(sessionId, params.id);
  return NextResponse.json({ ok: true });
}
