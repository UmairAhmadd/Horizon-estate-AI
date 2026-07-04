import "server-only";
import type {
  Property as PrismaProperty,
  LeadPreference as PrismaLeadPreference,
} from "@prisma/client";
import { getPrisma } from "../db";
import type {
  AssistantResponse,
  ChatMessage,
  ConversationDetail,
  ConversationSummary,
  LeadFields,
  SavedProperty,
} from "../types";

/**
 * DB-backed long-term memory (leads, conversations, messages, per-conversation
 * preferences, saved properties). Every function is a no-op / safe default when
 * there is no DATABASE_URL, so the app behaves identically without a database.
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

/**
 * "G-13, Islamabad" → { area: "G-13", city: "Islamabad" };
 * "Islamabad" → { city: "Islamabad" }. Reconstructed losslessly by locationOf().
 */
function splitLocation(location?: string): {
  city: string | null;
  area: string | null;
} {
  if (!location) return { city: null, area: null };
  const parts = location.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { area: parts.slice(0, -1).join(", "), city: parts[parts.length - 1] };
  }
  return { city: parts[0] ?? null, area: null };
}

function locationOf(area: string | null, city: string | null): string | undefined {
  return [area, city].filter(Boolean).join(", ") || undefined;
}

/** LeadFields -> lead_preferences columns. */
function toPreferenceData(lead: LeadFields) {
  const pkr = budgetToPkr(lead.budget);
  const rent = isRentIntent(lead.purpose);
  const { city, area } = splitLocation(lead.location);
  return {
    city,
    area,
    propertyType: lead.propertyType ?? null,
    purpose: lead.purpose ?? null,
    saleBudget: pkr !== undefined && !rent ? pkr : null,
    rentBudget: pkr !== undefined && rent ? pkr : null,
    bedrooms: typeof lead.bedrooms === "number" ? lead.bedrooms : null,
    size: lead.size ?? null,
    timeline: lead.timeline ?? null,
  };
}

/** Emit a budget string the lead engine can parse back (e.g. "Under PKR 2 Crore"). */
function pkrToBudgetLabel(n: number, rent: boolean): string {
  const trim = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(1));
  let label: string;
  if (n >= 10_000_000) label = `Under PKR ${trim(n / 10_000_000)} Crore`;
  else if (n >= 100_000) label = `Under PKR ${trim(n / 100_000)} Lakh`;
  else label = `Under PKR ${n}`;
  return rent ? `${label} / mo` : label;
}

/** lead_preferences row -> LeadFields. */
function prefToLead(p: PrismaLeadPreference | null | undefined): LeadFields {
  if (!p) return {};
  return {
    location: locationOf(p.area, p.city),
    propertyType: p.propertyType ?? undefined,
    purpose: p.purpose ?? undefined,
    bedrooms: p.bedrooms ?? undefined,
    size: p.size ?? undefined,
    timeline: p.timeline ?? undefined,
    budget:
      p.saleBudget != null
        ? pkrToBudgetLabel(p.saleBudget, false)
        : p.rentBudget != null
          ? pkrToBudgetLabel(p.rentBudget, true)
          : undefined,
  };
}

/** First user message → a short conversation title. */
function deriveTitle(message: string): string {
  const t = message.trim().replace(/\s+/g, " ");
  return t.length > 48 ? `${t.slice(0, 47)}…` : t || "New chat";
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

/* --------------------------- conversation lead ---------------------------- */

/** Stored requirements for a specific conversation (null if none / no DB). */
export async function loadConversationLead(
  sessionId: string,
  conversationId?: string | null
): Promise<LeadFields | null> {
  const prisma = getPrisma();
  if (!prisma || !sessionId || !conversationId) return null;
  try {
    const pref = await prisma.leadPreference.findFirst({
      where: { conversationId, conversation: { lead: { sessionId } } },
    });
    return pref ? prefToLead(pref) : null;
  } catch (err) {
    console.error("[leadStore] loadConversationLead failed:", err);
    return null;
  }
}

/**
 * Persist one conversation turn: lead + per-conversation preferences + both
 * messages (+ matched property ids). Creates the conversation if needed and
 * returns its id so the client can keep writing to the same thread.
 */
export async function recordTurn(args: {
  sessionId: string;
  conversationId?: string | null;
  userMessage: string;
  response: AssistantResponse;
}): Promise<string | null> {
  const prisma = getPrisma();
  if (!prisma) return args.conversationId ?? null;
  try {
    const leadId = await ensureLeadId(args.sessionId, args.response.leadScore);
    if (!leadId) return null;

    // Resolve the conversation: verify the provided id belongs to this lead,
    // otherwise start a fresh thread.
    let conversationId = args.conversationId ?? null;
    let needsTitle = false;
    if (conversationId) {
      const conv = await prisma.conversation.findFirst({
        where: { id: conversationId, leadId },
        select: { id: true, title: true },
      });
      if (!conv) conversationId = null;
      else needsTitle = !conv.title;
    }
    if (!conversationId) {
      const conv = await prisma.conversation.create({
        data: { leadId, title: deriveTitle(args.userMessage) },
      });
      conversationId = conv.id;
    }

    await prisma.leadPreference.upsert({
      where: { conversationId },
      create: { conversationId, ...toPreferenceData(args.response.lead) },
      update: toPreferenceData(args.response.lead),
    });

    await prisma.message.createMany({
      data: [
        { conversationId, role: "user", content: args.userMessage, matchedIds: [] },
        {
          conversationId,
          role: "assistant",
          content: args.response.reply,
          matchedIds: args.response.matchedProperties.map((m) => m.id),
        },
      ],
    });

    // Bump updatedAt (and backfill the title if the conversation was created empty).
    await prisma.conversation.update({
      where: { id: conversationId },
      data: needsTitle ? { title: deriveTitle(args.userMessage) } : {},
    });

    return conversationId;
  } catch (err) {
    console.error("[leadStore] recordTurn failed:", err);
    return args.conversationId ?? null;
  }
}

/* ---------------------------- conversation CRUD --------------------------- */

/** All conversations for a session, newest first (empty when no DB). */
export async function listConversations(
  sessionId: string
): Promise<ConversationSummary[]> {
  const prisma = getPrisma();
  if (!prisma || !sessionId) return [];
  try {
    const convs = await prisma.conversation.findMany({
      where: { lead: { sessionId } },
      orderBy: { updatedAt: "desc" },
      take: 30,
      include: {
        preference: true,
        messages: {
          where: { role: "user" },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });
    return convs.map((c) => ({
      id: c.id,
      title: c.title || c.messages[0]?.content.slice(0, 48) || "New chat",
      summary: summarisePref(c.preference),
      updatedAt: c.updatedAt.getTime(),
    }));
  } catch (err) {
    console.error("[leadStore] listConversations failed:", err);
    return [];
  }
}

function summarisePref(p: PrismaLeadPreference | null | undefined): string {
  if (!p) return "";
  const purpose = p.purpose
    ? /rent/i.test(p.purpose)
      ? "Rent"
      : /invest/i.test(p.purpose)
        ? "Invest"
        : "Buy"
    : null;
  return [purpose, locationOf(p.area, p.city), p.propertyType]
    .filter(Boolean)
    .join(" · ");
}

/** Full conversation (messages + lead context) for reload; null if not owned. */
export async function getConversation(
  sessionId: string,
  conversationId: string
): Promise<ConversationDetail | null> {
  const prisma = getPrisma();
  if (!prisma || !sessionId) return null;
  try {
    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, lead: { sessionId } },
      include: {
        preference: true,
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!conv) return null;
    const messages: ChatMessage[] = conv.messages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));
    return { id: conv.id, messages, lead: prefToLead(conv.preference) };
  } catch (err) {
    console.error("[leadStore] getConversation failed:", err);
    return null;
  }
}

/** Create an empty conversation and return its id (null when no DB). */
export async function createConversation(
  sessionId: string
): Promise<string | null> {
  const prisma = getPrisma();
  if (!prisma || !sessionId) return null;
  try {
    const leadId = await ensureLeadId(sessionId);
    if (!leadId) return null;
    const conv = await prisma.conversation.create({ data: { leadId } });
    return conv.id;
  } catch (err) {
    console.error("[leadStore] createConversation failed:", err);
    return null;
  }
}

export async function deleteConversation(
  sessionId: string,
  conversationId: string
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma || !sessionId) return;
  try {
    await prisma.conversation.deleteMany({
      where: { id: conversationId, lead: { sessionId } },
    });
  } catch (err) {
    console.error("[leadStore] deleteConversation failed:", err);
  }
}

export async function clearConversations(sessionId: string): Promise<void> {
  const prisma = getPrisma();
  if (!prisma || !sessionId) return;
  try {
    await prisma.conversation.deleteMany({ where: { lead: { sessionId } } });
  } catch (err) {
    console.error("[leadStore] clearConversations failed:", err);
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
