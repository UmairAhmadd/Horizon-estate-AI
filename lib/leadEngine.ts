import "server-only";
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
  // Normalize Islamabad-style sector codes: "g13" / "g131" / "g 13" -> "G-13",
  // "f7" -> "F-7", "e11" -> "E-11". (Trailing digits like the "1" in "g131"
  // are dropped so common typos still resolve to the sector.)
  const normalized = text.replace(
    /\b([efg])[\s-]?(\d{1,2})\d*\b/gi,
    (_m, letter: string, num: string) => `${letter.toUpperCase()}-${num}`
  );

  const area = AREAS.find((a) => new RegExp(`\\b${a}\\b`, "i").test(normalized));
  const city = CITIES.find((c) => new RegExp(`\\b${c}\\b`, "i").test(normalized));
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
    location: `${p.area}, ${p.city}`,
    price: p.displayPrice,
    image: p.images[0],
    beds: p.bedrooms,
    baths: p.bathrooms,
    area: p.size,
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

const RELAXED_REPLY =
  "I couldn't find an exact match, but here are the closest options I can show.";
const NO_MATCH_REPLY =
  "I couldn't find an exact match — that exact listing isn't in our demo data yet. Try widening the budget or area and I'll look again.";

function formatPkr(n: number): string {
  if (n >= 10_000_000) {
    const cr = n / 10_000_000;
    return `PKR ${Number.isInteger(cr) ? cr : cr.toFixed(1)} Crore`;
  }
  if (n >= 100_000) {
    const lakh = n / 100_000;
    return `PKR ${Number.isInteger(lakh) ? lakh : lakh.toFixed(1)} Lakh`;
  }
  return `PKR ${n}`;
}

function capCity(s?: string): string | undefined {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : undefined;
}

// Budget-safe no match: name the budget and city, and offer the honest choices.
function noMatchReply(f: PropertyFilters): string {
  const budget =
    f.maxSalePrice !== undefined
      ? formatPkr(f.maxSalePrice)
      : f.maxRent !== undefined
        ? `${formatPkr(f.maxRent)}/mo`
        : null;
  const city = capCity(f.location);

  if (budget && city) {
    return `No budget-safe match within ${budget} exists in the current demo listings. Two options: relax your budget, or browse broader ${city} listings. I'll keep everything within budget until you ask otherwise.`;
  }
  if (budget) {
    return `No budget-safe match within ${budget} exists in the current demo listings. Two options: relax your budget, or browse broader listings. I'll keep everything within budget until you ask otherwise.`;
  }
  return NO_MATCH_REPLY;
}

// A short, warm acknowledgement while we're still collecting requirements.
function ackReply(lead: LeadFields): string {
  const what = lead.propertyType
    ? `a ${lead.propertyType.toLowerCase()}`
    : "a property";
  const where = lead.location ? ` in ${lead.location}` : "";
  const intent = lead.purpose
    ? /rent/i.test(lead.purpose)
      ? "rent"
      : /invest/i.test(lead.purpose)
        ? "invest in"
        : "buy"
    : null;
  if (!intent && !lead.propertyType && !lead.location) {
    return "Happy to help — tell me a bit about what you're looking for.";
  }
  return intent
    ? `Got it — you want to ${intent} ${what}${where}.`
    : `Got it — ${what}${where}.`;
}

// How many matching signals we have — decides when to attempt a search.
function coreFieldCount(f: PropertyFilters): number {
  return [
    Boolean(f.location),
    Boolean(f.type),
    Boolean(f.purpose),
    f.maxSalePrice !== undefined || f.maxRent !== undefined,
    f.minBeds !== undefined,
    f.minAreaSqft !== undefined,
  ].filter(Boolean).length;
}

function pick(list: Property[], reason: string): MatchedProperty[] {
  return rankMatches(list)
    .slice(0, 3)
    .map((p) => toMatched(p, reason));
}

// Merge two LeadFields, preferring `primary` and backfilling from `fallback`
// (e.g. previously-stored preferences for a returning session).
function mergeLeadFields(
  primary: LeadFields,
  fallback?: LeadFields | null
): LeadFields {
  if (!fallback) return primary;
  return {
    location: primary.location ?? fallback.location,
    budget: primary.budget ?? fallback.budget,
    propertyType: primary.propertyType ?? fallback.propertyType,
    purpose: primary.purpose ?? fallback.purpose,
    timeline: primary.timeline ?? fallback.timeline,
    bedrooms: primary.bedrooms ?? fallback.bedrooms,
    size: primary.size ?? fallback.size,
  };
}

interface MatchResult {
  ready: boolean; // enough fields collected to attempt a search
  matchedProperties: MatchedProperty[];
  searchUrl?: string;
  relaxed: boolean; // results came from relaxed criteria
  exhausted: boolean; // ready, but nothing matched even after relaxing
}

// Match against local placeholder data, relaxing constraints when nothing fits.
function computeMatch(f: PropertyFilters): MatchResult {
  if (coreFieldCount(f) < 2) {
    return { ready: false, matchedProperties: [], relaxed: false, exhausted: false };
  }

  const strict = filterProperties(f);
  if (strict.length > 0) {
    return {
      ready: true,
      matchedProperties: pick(strict, reasonsFor(f).join(" + ") || "your criteria"),
      searchUrl: buildSearchUrl(f),
      relaxed: false,
      exhausted: false,
    };
  }

  // Relax only NON-core constraints — bedrooms, then size. Budget, city, type
  // and purpose are CORE: every matched card must still satisfy them, so a card
  // is never over budget or in the wrong city/type. We never relax budget.
  let rf: PropertyFilters = { ...f };
  for (const key of ["minBeds", "minAreaSqft"] as (keyof PropertyFilters)[]) {
    if (rf[key] === undefined) continue;
    rf = { ...rf, [key]: undefined };
    const relaxed = filterProperties(rf);
    if (relaxed.length > 0) {
      return {
        ready: true,
        matchedProperties: pick(relaxed, "closest match"),
        searchUrl: buildSearchUrl(rf),
        relaxed: true,
        exhausted: false,
      };
    }
  }

  // Nothing satisfies the core constraints (usually budget) — show no cards.
  return { ready: true, matchedProperties: [], relaxed: false, exhausted: true };
}

// Ask only the next missing important field; never re-ask a known one. Budget is
// asked before type (it's the key filter, and investment searches are
// type-agnostic).
function nextImportantQuestion(
  f: PropertyFilters,
  hasMatches: boolean,
  opts?: { investment?: boolean; cityLabel?: string }
): string {
  if (!f.purpose) return "Are you looking to buy or to rent?";
  if (!f.location) return "Which city — Islamabad, Lahore, or Karachi?";
  if (f.maxSalePrice === undefined && f.maxRent === undefined) {
    if (opts?.investment) {
      return `What budget range should I use for ${opts.cityLabel ?? "these"} investment options?`;
    }
    return f.purpose === "rent"
      ? "What's your monthly rent budget?"
      : "What's your budget?";
  }
  if (!f.type) return "What type of property — house, apartment, or plot?";
  return hasMatches ? "Want me to arrange a viewing on one of these?" : "";
}

// Decide the effective requirements for THIS turn. A new city or purpose (or an
// "investment" ask) starts a fresh search and RESETS unrelated prior filters
// (budget, area, type, size) — unless the user says "same budget/area/prefs".
// Otherwise we accumulate (refinement / continuity).
function resolveConversationLead(
  message: string,
  history: ChatMessage[],
  priorLead?: LeadFields | null
): { lead: LeadFields; newIntent: boolean; investmentIntent: boolean } {
  const latest = extractLead(message);
  const prior = extractLead(history.map((m) => m.content).join(" "));
  const t = message.toLowerCase();

  const keepPrior =
    /\bsame\s+budget\b/.test(t) ||
    /\bsame\s+(area|location|city|place)\b/.test(t) ||
    /\bsame\s+(preferences?|prefs|requirements?|criteria|everything|search|details?)\b/.test(
      t
    );
  const investmentIntent = /\b(investment|invest)\b/.test(t);

  const priorCity = cityFromLocation(prior.location);
  const latestCity = cityFromLocation(latest.location);
  const newCity = Boolean(latestCity && priorCity && latestCity !== priorCity);
  const newPurpose = Boolean(
    latest.purpose &&
      prior.purpose &&
      normalizePurpose(latest.purpose) !== normalizePurpose(prior.purpose)
  );

  // "same …" signals continuity even when the city changes — accumulate.
  if (keepPrior) {
    return {
      lead: mergeLeadFields(mergeLeadFields(latest, prior), priorLead),
      newIntent: false,
      investmentIntent,
    };
  }

  // New city / purpose / investment ask → fresh search: keep only what the new
  // message states (drops stale budget, area, type, size).
  if (newCity || newPurpose || investmentIntent) {
    return { lead: { ...latest }, newIntent: true, investmentIntent };
  }

  // Refinement — accumulate prior + stored preferences.
  return {
    lead: mergeLeadFields(mergeLeadFields(latest, prior), priorLead),
    newIntent: false,
    investmentIntent,
  };
}

/* --------------------------- mock entrypoint ------------------------------ */

// Deterministic local fallback — used when OpenAI is unconfigured or fails.
function generateMockResponse(
  message: string,
  history: ChatMessage[] = [],
  priorLead?: LeadFields | null
): AssistantResponse {
  // Resolve the effective search, resetting stale filters on a new intent.
  const { lead, investmentIntent } = resolveConversationLead(
    message,
    history,
    priorLead
  );
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

  const result = computeMatch(filters);
  const hasMatches = result.matchedProperties.length > 0;

  let reply: string;
  if (!result.ready) reply = ackReply(lead); // still collecting — no "no match"
  else if (result.relaxed) reply = RELAXED_REPLY;
  else if (result.exhausted) reply = noMatchReply(filters);
  else reply = composeReply(lead, result.matchedProperties.length);

  return {
    reply,
    lead,
    leadScore,
    suggestedNextQuestion: nextImportantQuestion(filters, hasMatches, {
      investment: investmentIntent,
      cityLabel: capCity(filters.location),
    }),
    matchedProperties: result.matchedProperties,
    searchUrl: result.searchUrl,
  };
}

/* ========================================================================== */
/*  AI concierge — server-only. Uses any OpenAI-COMPATIBLE chat API (OpenAI,   */
/*  Groq, OpenRouter, …) via OPENAI_BASE_URL. The key is read from             */
/*  process.env.OPENAI_API_KEY and never reaches the client (this module is    */
/*  `server-only` and imported only by the API route).                         */
/* ========================================================================== */

const SYSTEM_PROMPT = `You are Horizon Estate AI, a concise and professional property concierge for the Pakistan real estate market. Currency is PKR.

Merge information across the ENTIRE conversation — once the user has given a field, keep it and never contradict or drop it. Always fill extractedLeadFields (and searchUrlParams) with every value stated so far, across all turns.

Your "reply" must be ONE short, warm sentence that acknowledges what you understood. Do NOT ask a question in the reply — the app appends the follow-up question separately, so never repeat or invent one.

Rules:
- purpose is "buy", "rent", or "invest"; treat "invest" as buying.
- Normalize inputs: "g13" / "g131" / "g 13" → "G-13", "f7" → "F-7"; "5 marla house" → propertyType "house" + size ≈ 1125 sqft; "under 2 crore" → saleBudget 20000000 (crore = 10,000,000; lakh = 100,000).
- "anywhere" / "any area" means no area preference — do not treat it as a city. Treat "yes", "ok", "oky", "sure", "no" as confirmations, NEVER as a city, area, or new field value.
- saleBudget = maximum purchase price in PKR (only when buying/investing). rentBudget = maximum monthly rent in PKR (only when renting). Never set both.
- If a budget is given but the buy/rent intent is unclear, set BOTH saleBudget and rentBudget to null and make suggestedNextQuestion ask whether they want to buy or to rent.
- size = approximate area in square feet (1 marla ≈ 225 sqft, 1 kanal ≈ 4500 sqft). bedrooms = integer.
- location = the city if known (e.g. Islamabad, Lahore, Karachi); include the area if provided.
- suggestedNextQuestion = one short question that moves the search forward, or an offer to arrange viewings once the key fields are known.
- searchUrlParams = query params for the listings page, using only known values: location (city, lowercase), type (lowercase), purpose ("buy"|"rent"), salePrice (max PKR as string), rent (max PKR as string), beds (min as string), size (min sqft as string). Use null for anything unknown.
- leadScore = "Hot" | "Warm" | "Cold" based on how complete and time-sensitive the request is. Internal only.
Set every unknown field to null.

Return ONLY a JSON object (no markdown, no code fences) with exactly these keys:
{"reply": string, "extractedLeadFields": {"location": string|null, "propertyType": string|null, "purpose": "buy"|"rent"|"invest"|null, "saleBudget": number|null, "rentBudget": number|null, "bedrooms": number|null, "size": number|null, "timeline": string|null}, "suggestedNextQuestion": string, "searchUrlParams": {"location": string|null, "type": string|null, "purpose": string|null, "salePrice": string|null, "rent": string|null, "beds": string|null, "size": string|null}, "leadScore": "Hot"|"Warm"|"Cold"}`;

interface ConciergeOutput {
  reply: string;
  extractedLeadFields: {
    location: string | null;
    propertyType: string | null;
    purpose: string | null;
    saleBudget: number | null;
    rentBudget: number | null;
    bedrooms: number | null;
    size: number | null;
    timeline: string | null;
  };
  suggestedNextQuestion: string;
  leadScore: string;
}

interface ChatCompletion {
  choices?: Array<{ message?: { content?: string } }>;
}

function normalizePurpose(purpose?: string | null): string | undefined {
  const p = (purpose ?? "").toLowerCase();
  if (p === "rent") return "rent";
  if (p === "buy" || p === "invest") return "buy";
  return undefined;
}

// Turn the model output + the resolved conversation lead into our response.
// Filters come from the resolved lead (deterministic — handles new-search
// resets), so matching/next-question can't be polluted by stale accumulated
// fields. The model supplies the natural reply (for real matches) + leadScore.
function toAssistantResponse(
  out: ConciergeOutput,
  effectiveLead: LeadFields,
  investmentIntent: boolean
): AssistantResponse {
  const filters = leadToFilters(effectiveLead);
  // Keep budget consistent with intent — never compare rent against sale.
  if (filters.purpose === "rent") filters.maxSalePrice = undefined;
  if (filters.purpose === "buy") filters.maxRent = undefined;

  const result = computeMatch(filters);
  const hasMatches = result.matchedProperties.length > 0;

  const modelReply = out.reply?.trim();
  let reply: string;
  if (result.relaxed) reply = RELAXED_REPLY;
  else if (result.exhausted) reply = noMatchReply(filters);
  else if (!result.ready)
    reply = ackReply(effectiveLead); // still collecting — deterministic ack
  else reply = modelReply || "Here are a few that fit.";

  const leadScore: LeadScore =
    out.leadScore === "Hot" || out.leadScore === "Cold" ? out.leadScore : "Warm";

  return {
    reply,
    lead: effectiveLead,
    leadScore,
    suggestedNextQuestion: nextImportantQuestion(filters, hasMatches, {
      investment: investmentIntent,
      cityLabel: capCity(filters.location),
    }),
    matchedProperties: result.matchedProperties,
    searchUrl: result.searchUrl,
  };
}

// Base URL precedence: explicit AI_BASE_URL/OPENAI_BASE_URL, else derived from
// AI_PROVIDER (groq | openrouter | openai), else OpenAI.
function resolveBaseUrl(): string {
  const explicit = process.env.AI_BASE_URL || process.env.OPENAI_BASE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  switch ((process.env.AI_PROVIDER || "").toLowerCase()) {
    case "groq":
      return "https://api.groq.com/openai/v1";
    case "openrouter":
      return "https://openrouter.ai/api/v1";
    default:
      return "https://api.openai.com/v1";
  }
}

async function generateWithOpenAI(
  message: string,
  history: ChatMessage[],
  apiKey: string,
  priorLead?: LeadFields | null
): Promise<AssistantResponse> {
  // Works with any OpenAI-compatible chat API (OpenAI, Groq, OpenRouter, …).
  // Accepts provider-neutral AI_* names, falling back to OPENAI_* names.
  const baseUrl = resolveBaseUrl();
  const model =
    process.env.AI_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini";

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: message },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`AI provider responded ${res.status}: ${errBody.slice(0, 400)}`);
  }

  const data = (await res.json()) as ChatCompletion;
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI provider returned no content");
  const parsed = JSON.parse(content) as ConciergeOutput;

  // Resolve the effective lead deterministically (new-search resets, stored
  // preferences, "same budget" continuity) and drive matching from it.
  const { lead, investmentIntent } = resolveConversationLead(
    message,
    history,
    priorLead
  );
  return toAssistantResponse(parsed, lead, investmentIntent);
}

/* --------------------------- public entrypoint ---------------------------- */

/**
 * Uses an OpenAI-compatible chat API (OpenAI, Groq, OpenRouter, …) when
 * OPENAI_API_KEY is set, and falls back to the local mock engine if the key is
 * missing or the call fails. Either way it returns the same AssistantResponse
 * shape, so the UI never changes.
 */
export async function generateAssistantResponse(
  message: string,
  history: ChatMessage[] = [],
  priorLead?: LeadFields | null
): Promise<AssistantResponse> {
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return generateMockResponse(message, history, priorLead);

  try {
    return await generateWithOpenAI(message, history, apiKey, priorLead);
  } catch (err) {
    // Network error, timeout, bad key, quota/billing (429), malformed output —
    // degrade gracefully to the mock, and log why (server-side only).
    console.error(
      "[assistant] OpenAI call failed, using mock fallback:",
      err instanceof Error ? err.message : err
    );
    return generateMockResponse(message, history, priorLead);
  }
}
