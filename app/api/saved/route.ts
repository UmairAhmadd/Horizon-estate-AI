import { NextResponse } from "next/server";
import {
  addItem,
  clearAll,
  getAll,
  removeItem,
} from "@/lib/server/savedStore";
import type { SavablePropertyInput, SavedProperty } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Consistent, typed envelopes for every handler.
function ok(items: SavedProperty[], status = 200) {
  return NextResponse.json({ items }, { status });
}
function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
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

/** GET /api/saved — list all saved properties. */
export function GET() {
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
  const id = new URL(request.url).searchParams.get("id");

  if (id === "*") return ok(clearAll());
  if (id && id.trim() !== "") return ok(removeItem(id));

  // Fall back to an { id } JSON body.
  try {
    const body = (await request.json()) as { id?: unknown };
    if (typeof body.id === "string" && body.id.trim() !== "") {
      return ok(removeItem(body.id));
    }
  } catch {
    // no body provided
  }

  return fail("Provide ?id=<id> to remove one, or ?id=* to clear all.");
}
