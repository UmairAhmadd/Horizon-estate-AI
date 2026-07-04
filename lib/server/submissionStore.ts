import "server-only";
import { getPrisma } from "../db";
import type { PropertyDraft, PropertySubmission } from "../types";

/**
 * DB-backed "Post a property" drafts. No-op / empty when there's no
 * DATABASE_URL, so the client keeps its localStorage fallback. Drafts are always
 * created with status "pending" and never auto-published.
 */

function toDraftDto(row: {
  id: string;
  ownerName: string;
  email: string | null;
  phone: string | null;
  city: string;
  area: string | null;
  purpose: string;
  propertyType: string;
  size: string;
  expectedPrice: string | null;
  monthlyRent: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  description: string | null;
  status: string;
  createdAt: Date;
}): PropertyDraft {
  return {
    id: row.id,
    ownerName: row.ownerName,
    email: row.email ?? "",
    phone: row.phone ?? "",
    city: row.city,
    area: row.area ?? "",
    purpose: row.purpose === "rent" ? "rent" : "sell",
    propertyType: row.propertyType,
    size: row.size,
    // The form uses one price field whose meaning follows the purpose.
    price: row.expectedPrice ?? row.monthlyRent ?? "",
    bedrooms: row.bedrooms ?? undefined,
    bathrooms: row.bathrooms ?? undefined,
    description: row.description ?? "",
    status: (row.status as PropertyDraft["status"]) ?? "pending",
    createdAt: row.createdAt.getTime(),
  };
}

/** Persist a submission as a pending draft; returns it, or null when no DB. */
export async function addSubmission(
  sessionId: string,
  s: PropertySubmission
): Promise<PropertyDraft | null> {
  const prisma = getPrisma();
  if (!prisma || !sessionId) return null;
  try {
    const row = await prisma.postedPropertyDraft.create({
      data: {
        sessionId,
        ownerName: s.ownerName,
        email: s.email || null,
        phone: s.phone || null,
        city: s.city,
        area: s.area || null,
        purpose: s.purpose,
        propertyType: s.propertyType,
        size: s.size,
        // One form price field — routed to the column matching the purpose.
        expectedPrice: s.purpose === "sell" ? s.price : null,
        monthlyRent: s.purpose === "rent" ? s.price : null,
        bedrooms: typeof s.bedrooms === "number" ? s.bedrooms : null,
        bathrooms: typeof s.bathrooms === "number" ? s.bathrooms : null,
        description: s.description || null,
        status: "pending",
      },
    });
    return toDraftDto(row);
  } catch (err) {
    console.error("[submissionStore] addSubmission failed:", err);
    return null;
  }
}

/** This session's own submitted drafts (never other people's, never public). */
export async function listSubmissions(
  sessionId: string
): Promise<PropertyDraft[]> {
  const prisma = getPrisma();
  if (!prisma || !sessionId) return [];
  try {
    const rows = await prisma.postedPropertyDraft.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDraftDto);
  } catch (err) {
    console.error("[submissionStore] listSubmissions failed:", err);
    return [];
  }
}
