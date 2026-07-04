import { NextResponse } from "next/server";
import { dbEnabled } from "@/lib/db";
import { addSubmission, listSubmissions } from "@/lib/server/submissionStore";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  newSessionId,
  readSessionId,
} from "@/lib/server/session";
import type { PropertySubmission } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validSubmission(v: unknown): v is PropertySubmission {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  const str = (x: unknown) => typeof x === "string" && x.trim() !== "";
  return (
    str(s.ownerName) &&
    str(s.city) &&
    str(s.size) &&
    str(s.price) &&
    (s.purpose === "sell" || s.purpose === "rent") &&
    str(s.propertyType) &&
    (str(s.email) || str(s.phone))
  );
}

// This session's own submitted drafts (never public listings).
export async function GET(request: Request) {
  if (!dbEnabled) return NextResponse.json({ enabled: false, items: [] });
  const sessionId = readSessionId(request);
  const items = sessionId ? await listSubmissions(sessionId) : [];
  return NextResponse.json({ enabled: true, items });
}

// Save a submission as a pending draft (never auto-published).
export async function POST(request: Request) {
  if (!dbEnabled) {
    // Client persists to localStorage in this mode.
    return NextResponse.json({ enabled: false, draft: null });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (!validSubmission(body)) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 }
    );
  }
  const sessionId = readSessionId(request) ?? newSessionId();
  const draft = await addSubmission(sessionId, body);
  const res = NextResponse.json({ enabled: true, draft });
  res.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
