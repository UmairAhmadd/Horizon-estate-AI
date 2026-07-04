import "server-only";
import type { Property as PrismaProperty } from "@prisma/client";
import { getPrisma } from "../db";
import type { AssistantResponse, LeadFields, SavedProperty } from "../types";

/**
 * DB-backed long-term memory (leads, conversations, messages, preferences,
 * saved properties). Every function is a no-op / safe default when there is no
 * DATABASE_URL, so the app behaves identically without a database.
 */

/* ------------------------------- helpers ---------------------------------- */

function budgetToPkr(budget?: string): number | undefined {
  if (!budget) return undefined;
  const m = budget.match(/(\d+(?:\.\d+)?)\s*(crore|cr|lakh|lac|million|m)/i);
  if (!m) return undefined;
  const amount = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  const mult = /^(cr|crore)/.test(unit)
    ? 10_000_000
    : /^(m|million)/.test(unit)
      ? 1_000_000
      : 100_000;
  return Math.round(amount * mult);
}

function isRentIntent(purpose?: string): boolean {
  return /rent/i.test(purpose ?? "");
}

/** LeadFields -> lead_preferences columns. */
function toPreferenceData(lead: LeadFields) {
  const pkr = budgetToPkr(lead.budget);
  const rent = isRentIntent(lead.purpose);
  return {
    location: lead.location ?? null,
    propertyType: lead.propertyType ?? null,
    purpose: lead.purpose ?? null,
    saleBudget: pkr !== undefined && !rent ? pkr : null,
    rentBudget: pkr !== undefined && rent ? pkr : null,
    bedrooms: typeof lead.bedrooms === "number" ? lead.bedrooms : null,
    size: lead.size ?? null,
    timeline: lead.timeline ?? null,
  };
}

function toSavedDto(p: PrismaProperty, savedAt: Date): SavedProperty {
  return {
    id: p.id,
    title: p.title,
    location: `${p.area}, ${p.city}`,
    price: p.displayPrice,
    image: p.images[0] ?? "",
    beds: p.bedrooms,
    baths: p.bathrooms,
    area: p.size,
    savedAt: savedAt.getTime(),
  };
}

async function ensureLeadId(
  sessionId: string,
  leadScore?: string
): Promise<string | null> {
  const prisma = getPrisma();
  if (!prisma) return null;
  const lead = await prisma.lead.upsert({
    where: { sessionId },
    create: { sessionId, leadScore: leadScore ?? null },
    update: leadScore ? { leadScore } : {},
  });
  return lead.id;
}

/* ---------------------------- lead preferences ---------------------------- */

/** Load stored requirements for a returning session (null if none / no DB). */
export async function loadLeadPreferences(
  sessionId: string
): Promise<LeadFields | null> {
  const prisma = getPrisma();
  if (!prisma || !sessionId) return null;
  try {
    const lead = await prisma.lead.findUnique({
      where: { sessionId },
      include: { preferences: true },
    });
    const p = lead?.preferences;
    if (!p) return null;
    return {
      location: p.location ?? undefined,
      propertyType: p.propertyType ?? undefined,
      purpose: p.purpose ?? undefined,
      bedrooms: p.bedrooms ?? undefined,
      size: p.size ?? undefined,
      timeline: p.timeline ?? undefined,
      budget:
        p.saleBudget != null
          ? `PKR ${p.saleBudget}`
          : p.rentBudget != null
            ? `PKR ${p.rentBudget} / mo`
            : undefined,
    };
  } catch (err) {
    console.error("[leadStore] loadLeadPreferences failed:", err);
    return null;
  }
}

/** Persist one conversation turn: lead + preferences + both messages. */
export async function recordTurn(args: {
  sessionId: string;
  userMessage: string;
  response: AssistantResponse;
}): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;
  try {
    const leadId = await ensureLeadId(args.sessionId, args.response.leadScore);
    if (!leadId) return;

    await prisma.leadPreference.upsert({
      where: { leadId },
      create: { leadId, ...toPreferenceData(args.response.lead) },
      update: toPreferenceData(args.response.lead),
    });

    // One rolling conversation per lead for this demo.
    const existing = await prisma.conversation.findFirst({
      where: { leadId },
      orderBy: { createdAt: "desc" },
    });
    const conversationId =
      existing?.id ?? (await prisma.conversation.create({ data: { leadId } })).id;

    await prisma.message.createMany({
      data: [
        {
          conversationId,
          role: "user",
          content: args.userMessage,
          matchedIds: [],
        },
        {
          conversationId,
          role: "assistant",
          content: args.response.reply,
          matchedIds: args.response.matchedProperties.map((m) => m.id),
        },
      ],
    });
  } catch (err) {
    console.error("[leadStore] recordTurn failed:", err);
  }
}

/* ---------------------------- saved properties ---------------------------- */

export async function getSavedProperties(
  sessionId: string
): Promise<SavedProperty[]> {
  const prisma = getPrisma();
  if (!prisma) return [];
  try {
    const rows = await prisma.savedProperty.findMany({
      where: { lead: { sessionId } },
      include: { property: true },
      orderBy: { savedAt: "desc" },
    });
    return rows.map((r) => toSavedDto(r.property, r.savedAt));
  } catch (err) {
    console.error("[leadStore] getSavedProperties failed:", err);
    return [];
  }
}

export async function addSavedProperty(
  sessionId: string,
  propertyId: string
): Promise<SavedProperty[]> {
  const prisma = getPrisma();
  if (!prisma) return [];
  try {
    const leadId = await ensureLeadId(sessionId);
    if (leadId) {
      await prisma.savedProperty.upsert({
        where: { leadId_propertyId: { leadId, propertyId } },
        create: { leadId, propertyId },
        update: {},
      });
    }
  } catch (err) {
    console.error("[leadStore] addSavedProperty failed:", err);
  }
  return getSavedProperties(sessionId);
}

export async function removeSavedProperty(
  sessionId: string,
  propertyId: string
): Promise<SavedProperty[]> {
  const prisma = getPrisma();
  if (!prisma) return [];
  try {
    await prisma.savedProperty.deleteMany({
      where: { propertyId, lead: { sessionId } },
    });
  } catch (err) {
    console.error("[leadStore] removeSavedProperty failed:", err);
  }
  return getSavedProperties(sessionId);
}

export async function clearSavedProperties(
  sessionId: string
): Promise<SavedProperty[]> {
  const prisma = getPrisma();
  if (!prisma) return [];
  try {
    await prisma.savedProperty.deleteMany({ where: { lead: { sessionId } } });
  } catch (err) {
    console.error("[leadStore] clearSavedProperties failed:", err);
  }
  return [];
}
