import { NextResponse } from "next/server";
import {
  addItem,
  clearAll,
  getAll,
  removeItem,
} from "@/lib/server/savedStore";
import { dbEnabled } from "@/lib/db";
import {
  addSavedProperty,
  clearSavedProperties,
  getSavedProperties,
  removeSavedProperty,
} from "@/lib/server/leadStore";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  newSessionId,
  readSessionId,
} from "@/lib/server/session";
import type { SavablePropertyInput, SavedProperty } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ok(items: SavedProperty[], status = 200) {
  return NextResponse.json({ items }, { status });
}
function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}
// DB responses also (re)set the session cookie so the shortlist follows the visitor.
function okWithSession(items: SavedProperty[], sessionId: string, status = 200) {
  const res = ok(items, status);
  res.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

function isValidInput(value: unknown): value is SavablePropertyInput {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    o.id.trim() !== "" &&
    typeof o.title === "string" &&
    typeof o.location === "string" &&
    typeof o.price === "string" &&
    typeof o.image === "string"
  );
}

/** GET /api/saved — list saved properties. */
export async function GET(request: Request) {
  if (dbEnabled) {
    const sid = readSessionId(request) ?? newSessionId();
    return okWithSession(await getSavedProperties(sid), sid);
  }
  return ok(getAll());
}

/** POST /api/saved — save one property (duplicates ignored by id). */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Request body must be valid JSON.");
  }

  if (!isValidInput(body)) {
    return fail("Property payload requires id, title, location, price, image.");
  }

  if (dbEnabled) {
    const sid = readSessionId(request) ?? newSessionId();
    return okWithSession(await addSavedProperty(sid, body.id), sid, 201);
  }

  const savedAt = (body as { savedAt?: unknown }).savedAt;
  const item: SavedProperty = {
    id: body.id,
    title: body.title,
    location: body.location,
    price: body.price,
    image: body.image,
    beds: typeof body.beds === "number" ? body.beds : undefined,
    baths: typeof body.baths === "number" ? body.baths : undefined,
    area: typeof body.area === "string" ? body.area : undefined,
    savedAt: typeof savedAt === "number" ? savedAt : Date.now(),
  };
  return ok(addItem(item), 201);
}

/**
 * DELETE /api/saved?id=<id>  — remove one property.
 * DELETE /api/saved?id=*     — clear the whole shortlist.
 */
export async function DELETE(request: Request) {
  let targetId: string | null = new URL(request.url).searchParams.get("id");
  if (!targetId) {
    try {
      const body = (await request.json()) as { id?: unknown };
      if (typeof body.id === "string") targetId = body.id;
    } catch {
      // no body provided
    }
  }

  if (dbEnabled) {
    const sid = readSessionId(request) ?? newSessionId();
    if (targetId === "*") {
      return okWithSession(await clearSavedProperties(sid), sid);
    }
    if (targetId && targetId.trim() !== "") {
      return okWithSession(await removeSavedProperty(sid, targetId), sid);
    }
    return fail("Provide ?id=<id> to remove one, or ?id=* to clear all.");
  }

  if (targetId === "*") return ok(clearAll());
  if (targetId && targetId.trim() !== "") return ok(removeItem(targetId));
  return fail("Provide ?id=<id> to remove one, or ?id=* to clear all.");
}
