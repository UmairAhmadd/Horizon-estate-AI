import { filterProperties, type PropertyFilters } from "./data";
import type {
  AssistantResponse,
  ChatMessage,
  LeadFields,
  LeadScore,
  MatchedProperty,
  Property,
} from "./types";

/**
 * MOCK lead engine.
 *
 * This module is the ONLY place that "understands" a message. It is deliberately
 * isolated so the API route stays thin and this file can be swapped for a real
 * LLM call (see the OpenAI sketch at the bottom) without touching the route or
 * the UI.
 *
 * Matching and the "See all matches" link both run through the SAME inferred
 * filters (leadToFilters → filterProperties), so the in-chat cards and the
 * /properties listing always agree.
 *
 * Contract: (message, history) -> AssistantResponse
 */

/* ------------------------------- extraction ------------------------------- */

const CITIES = [
  "Islamabad",
  "Lahore",
  "Karachi",
  "Rawalpindi",
  "Multan",
  "Faisalabad",
  "Peshawar",
];

const AREAS = [
  "DHA",
  "Bahria Town",
  "Bahria",
  "Gulberg",
  "Clifton",
  "Model Town",
  "Johar Town",
  "PECHS",
  "F-6",
  "F-7",
  "F-8",
  "F-10",
  "F-11",
  "E-11",
  "G-13",
];

function extractLocation(text: string): string | undefined {
  const area = AREAS.find((a) => new RegExp(`\\b${a}\\b`, "i").test(text));
  const city = CITIES.find((c) => new RegExp(`\\b${c}\\b`, "i").test(text));
  if (area && city) return `${area}, ${city}`;
  return area ?? city ?? undefined;
}

function extractBudget(text: string): string | undefined {
  const m = text.match(/(\d+(?:\.\d+)?)\s*(lakhs?|lac|crores?|cr|million|m)\b/i);
  if (!m) return undefined;

  const amount = m[1];
  const unitRaw = m[2].toLowerCase();
  const unit = /^cr|crore/.test(unitRaw)
    ? "Crore"
    : /^m|million/.test(unitRaw)
      ? "Million"
      : "Lakh";
  const capped = /\b(under|below|less than|up ?to|max|budget)\b/i.test(text)
    ? "Under "
    : "";
  return `${capped}PKR ${amount} ${unit}`;
}

const TYPE_RULES: Array<[RegExp, string]> = [
  [/\b(apartment|flat)s?\b/i, "Apartment"],
  [/\bpenthouses?\b/i, "Penthouse"],
  [/\bvillas?\b/i, "Villa"],
  [/\btownhouses?\b/i, "Townhouse"],
  [/\b(house|home|bungalow|kothi)s?\b/i, "House"],
  [/\b(plot|land)s?\b/i, "Plot"],
  [/\b(office|shop|showroom|commercial|building)s?\b/i, "Commercial"],
];

function extractPropertyType(text: string): string | undefined {
  for (const [re, label] of TYPE_RULES) if (re.test(text)) return label;
  return undefined;
}

function extractPurpose(text: string): string | undefined {
  if (/\b(invest|investment|rental yield|returns?|roi)\b/i.test(text))
    return "Invest";
  if (/\b(rent|rental|lease|tenant)\b/i.test(text)) return "Rent";
  if (/\b(buy|purchase|own|owning)\b/i.test(text)) return "Buy";
  return undefined;
}

function extractTimeline(text: string): string | undefined {
  if (/\b(immediately|asap|urgent|right now|this week)\b/i.test(text))
    return "Immediately";
  if (/\b(this month|within a month|next month|30 days)\b/i.test(text))
    return "Within a month";
  const months = text.match(/\b(\d+)\s*months?\b/i);
  if (months) return `Within ${months[1]} months`;
  if (/\b(no rush|just looking|exploring|browsing|someday|next year)\b/i.test(text))
    return "Just exploring";
  return undefined;
}

function extractBedrooms(text: string): number | undefined {
  const m = text.match(/(\d+)\s*(?:bed(?:room)?s?|bhk|br)\b/i);
  return m ? parseInt(m[1], 10) : undefined;
}

function extractSize(text: string): string | undefined {
  const marlaKanal = text.match(/(\d+(?:\.\d+)?)\s*(marla|kanal)s?\b/i);
  if (marlaKanal) {
    const unit = marlaKanal[2].toLowerCase() === "kanal" ? "Kanal" : "Marla";
    return `${marlaKanal[1]} ${unit}`;
  }
  const sqft = text.match(/(\d{3,5})\s*(?:sq\.?\s*ft|sqft|square\s*feet)\b/i);
  return sqft ? `${sqft[1]} sq ft` : undefined;
}

/** Merge fields across the whole conversation; latest text wins on conflicts. */
function extractLead(fullText: string): LeadFields {
  const lead: LeadFields = {
    location: extractLocation(fullText),
    budget: extractBudget(fullText),
    propertyType: extractPropertyType(fullText),
    purpose: extractPurpose(fullText),
    timeline: extractTimeline(fullText),
    bedrooms: extractBedrooms(fullText),
    size: extractSize(fullText),
  };
  (Object.keys(lead) as (keyof LeadFields)[]).forEach(
    (k) => lead[k] === undefined && delete lead[k]
  );
  return lead;
}

/* -------------------------------- scoring --------------------------------- */

function scoreLead(lead: LeadFields): LeadScore {
  const filled = Object.values(lead).filter(
    (v) => v !== undefined && v !== ""
  ).length;
  const urgent =
    !!lead.timeline && /^(Immediately|Within a month)$/.test(lead.timeline);

  if (filled >= 4 || (lead.budget && urgent)) return "Hot";
  if (filled >= 2) return "Warm";
  return "Cold";
}

/* ------------------------- lead → listing filters ------------------------- */

/** "DHA, Lahore" → "lahore"; "Islamabad" → "islamabad". */
function cityFromLocation(loc?: string): string | undefined {
  return loc?.split(",").pop()?.trim().toLowerCase() || undefined;
}

/** "Under PKR 5 Crore" → 50000000; "PKR 80 Lakh" → 8000000. */
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

function purposeParam(purpose?: string): string | undefined {
  switch (purpose) {
    case "Rent":
      return "rent";
    case "Buy":
    case "Invest":
      return "buy";
    default:
      return undefined;
  }
}

/** "5 Marla" → 1125; "1 Kanal" → 4500; "1600 sq ft" → 1600. */
function sizeToSqft(size?: string): number | undefined {
  if (!size) return undefined;
  const m = size.match(/(\d+(?:\.\d+)?)\s*(marla|kanal|sq)/i);
  if (!m) return undefined;
  const n = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  if (unit === "kanal") return Math.round(n * 4500);
  if (unit === "marla") return Math.round(n * 225);
  return Math.round(n);
}

/** The single inferred filter set — drives BOTH matching and the search URL. */
function leadToFilters(lead: LeadFields): PropertyFilters {
  const filters: PropertyFilters = {
    location: cityFromLocation(lead.location),
    type: lead.propertyType?.toLowerCase(),
    purpose: purposeParam(lead.purpose),
    minBeds: lead.bedrooms,
    minAreaSqft: sizeToSqft(lead.size),
  };

  // Budget is routed to sale or rent based on intent — never both.
  const budget = budgetToPkr(lead.budget);
  if (budget !== undefined) {
    if (lead.purpose === "Rent") filters.maxRent = budget;
    else if (lead.purpose === "Buy" || lead.purpose === "Invest") {
      filters.maxSalePrice = budget;
    }
    // purpose unknown → budget deliberately unassigned (see ambiguity check)
  }

  return filters;
}

function anyFilter(f: PropertyFilters): boolean {
  return Boolean(
    f.location ||
      f.type ||
      f.purpose ||
      f.maxSalePrice !== undefined ||
      f.maxRent !== undefined ||
      f.minBeds !== undefined ||
      f.minAreaSqft !== undefined
  );
}

/* ------------------------------- matching --------------------------------- */

// After strict filtering every result satisfies every provided filter, so the
// reason is honestly just the filters that were applied.
function reasonsFor(f: PropertyFilters): string[] {
  const r: string[] = [];
  if (f.location) r.push("location");
  if (f.type) r.push("property type");
  if (f.purpose) r.push("purpose");
  if (f.maxSalePrice !== undefined || f.maxRent !== undefined) r.push("budget");
  if (f.minBeds !== undefined) r.push("bedrooms");
  if (f.minAreaSqft !== undefined) r.push("size");
  return r;
}

function tagRank(p: Property): number {
  if (p.tag === "Verified") return 2;
  return p.tag ? 1 : 0;
}

const priceOf = (p: Property) => p.salePrice ?? p.monthlyRent ?? 0;

// Relevance ordering among strict matches: verified/tagged first, then best value.
function rankMatches(list: Property[]): Property[] {
  return [...list].sort(
    (a, b) => tagRank(b) - tagRank(a) || priceOf(a) - priceOf(b)
  );
}

function toMatched(p: Property, reason: string): MatchedProperty {
  return {
    id: p.id,
    title: p.title,
    location: p.location,
    price: p.price,
    image: p.image,
    beds: p.beds,
    baths: p.baths,
    area: p.area,
    reason,
  };
}

/* --------------------------- listing search url --------------------------- */

/** Build a /properties URL from the SAME filters used for matching. */
function buildSearchUrl(f: PropertyFilters): string {
  const params = new URLSearchParams();
  if (f.location) params.set("location", f.location);
  if (f.type) params.set("type", f.type);
  if (f.purpose) params.set("purpose", f.purpose);
  if (f.maxSalePrice !== undefined) params.set("salePrice", String(f.maxSalePrice));
  if (f.maxRent !== undefined) params.set("rent", String(f.maxRent));
  if (f.minBeds !== undefined) params.set("beds", String(f.minBeds));
  if (f.minAreaSqft !== undefined) params.set("size", String(f.minAreaSqft));
  const qs = params.toString();
  return qs ? `/properties?${qs}` : "/properties";
}

/* ------------------------- reply + next question -------------------------- */

function composeReply(lead: LeadFields, matchCount: number): string {
  if (!lead.propertyType && !lead.location && !lead.budget) {
    return "Happy to help you find the right property. Tell me a little about what you're looking for and I'll pull together some options.";
  }

  const article = lead.propertyType
    ? /^[aeiou]/i.test(lead.propertyType)
      ? "an"
      : "a"
    : "a";
  const noun = lead.propertyType ? lead.propertyType.toLowerCase() : "property";

  const parts: string[] = [`${article} ${noun}`];
  if (lead.location) parts.push(`in ${lead.location}`);
  if (lead.budget) {
    parts.push(
      /^under/i.test(lead.budget)
        ? lead.budget.replace(/^Under/, "under")
        : `around ${lead.budget}`
    );
  }

  return `Got it — looking for ${parts.join(" ")}. I've lined up ${matchCount} verified ${
    matchCount === 1 ? "option" : "options"
  } to start with.`;
}

const FIELD_ORDER = [
  "location",
  "budget",
  "propertyType",
  "purpose",
  "timeline",
] as const;

const QUESTIONS: Record<(typeof FIELD_ORDER)[number], string> = {
  location: "Which city or neighbourhood are you focused on?",
  budget: "What budget range are you working with?",
  propertyType: "Are you after a house, apartment, plot, or commercial space?",
  purpose: "Is this to live in, to rent out, or purely as an investment?",
  timeline: "What's your timeline — moving soon, or still exploring?",
};

function nextQuestion(lead: LeadFields): string {
  const missing = FIELD_ORDER.find((f) => !lead[f]);
  return missing
    ? QUESTIONS[missing]
    : "Great — shall I arrange viewings for these matches?";
}

// No strict matches: explain and suggest relaxing the most restrictive filter.
function fallbackReply(): string {
  return "I couldn't find a property that matches all of those details right now — but a small change might open things up.";
}

function relaxSuggestion(f: PropertyFilters): string {
  if (f.maxSalePrice !== undefined || f.maxRent !== undefined)
    return "Try raising your budget a little, and I'll search again.";
  if (f.minAreaSqft !== undefined)
    return "Consider a slightly smaller size to see more options.";
  if (f.minBeds !== undefined)
    return "Try fewer bedrooms to widen the search.";
  if (f.type) return "Want me to include other property types?";
  if (f.location) return "Should I include nearby cities?";
  return "Try relaxing one of your filters and I'll look again.";
}

/* --------------------------- public entrypoint ---------------------------- */

export function generateAssistantResponse(
  message: string,
  history: ChatMessage[] = []
): AssistantResponse {
  const conversationText = [...history.map((m) => m.content), message].join(" ");

  const lead = extractLead(conversationText);
  const leadScore = scoreLead(lead);
  const filters = leadToFilters(lead);

  // Budget stated without a clear buy/rent intent — ask instead of mixing
  // rentals and sale listings (their prices aren't comparable).
  if (budgetToPkr(lead.budget) !== undefined && !purposeParam(lead.purpose)) {
    return {
      reply:
        "Quick check so I show the right listings — is that budget for buying, or for monthly rent?",
      lead,
      leadScore,
      suggestedNextQuestion: "Are you looking to buy or to rent?",
      matchedProperties: [],
      searchUrl: undefined,
    };
  }

  // Nothing to search on yet — onboard the user.
  if (!anyFilter(filters)) {
    return {
      reply: composeReply(lead, 0),
      lead,
      leadScore,
      suggestedNextQuestion: nextQuestion(lead),
      matchedProperties: [],
      searchUrl: undefined,
    };
  }

  const strict = filterProperties(filters);

  // Criteria given, but nothing satisfies them — helpful fallback.
  if (strict.length === 0) {
    return {
      reply: fallbackReply(),
      lead,
      leadScore,
      suggestedNextQuestion: relaxSuggestion(filters),
      matchedProperties: [],
      searchUrl: undefined,
    };
  }

  const reason = reasonsFor(filters).join(" + ") || "your criteria";
  const matchedProperties = rankMatches(strict)
    .slice(0, 3)
    .map((p) => toMatched(p, reason));

  return {
    reply: composeReply(lead, matchedProperties.length),
    lead,
    leadScore,
    suggestedNextQuestion: nextQuestion(lead),
    matchedProperties,
    // Same filters as the cards → the listing page shows the full matching set.
    searchUrl: buildSearchUrl(filters),
  };
}

/* -------------------------------------------------------------------------- */
/*  SWAP POINT — replace the body of generateAssistantResponse with an LLM.   */
/*                                                                            */
/*  Keep returning AssistantResponse (reply, lead, leadScore,                 */
/*  suggestedNextQuestion, matchedProperties, searchUrl). Have the model      */
/*  emit structured filters, then reuse filterProperties()/buildSearchUrl()   */
/*  so chat matches and the /properties listing stay in sync.                 */
/* -------------------------------------------------------------------------- */
