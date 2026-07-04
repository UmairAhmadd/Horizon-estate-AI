export type Purpose = "buy" | "rent";

/**
 * A property listing. Sale and rent are modelled separately (salePrice vs
 * monthlyRent); `displayPrice` is the preformatted string for the UI.
 */
export interface Property {
  id: string;
  title: string;
  city: string; // e.g. "Islamabad"
  area: string; // neighbourhood, e.g. "G-13"
  purpose: Purpose;
  propertyType: string; // "House" | "Apartment" | "Villa" | "Penthouse" | "Plot" | ...
  /** Sale price in PKR (present when purpose === "buy"). */
  salePrice?: number;
  /** Monthly rent in PKR (present when purpose === "rent"). */
  monthlyRent?: number;
  /** Preformatted price for display, e.g. "PKR 1.95 Cr" or "PKR 1.6 Lakh/mo". */
  displayPrice: string;
  size: string; // "5 Marla" | "1 Kanal" | "1,600 sq ft"
  /** Approximate covered/area size in square feet — used for size filtering. */
  areaSqft: number;
  bedrooms: number;
  bathrooms: number;
  images: string[]; // gallery; first entry is the cover
  features: string[];
  description: string;
  tag?: string; // optional badge, e.g. "Verified" | "New"
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  location: string;
  deals: string;
  image: string;
}

/** A Property enriched with the extra bits the detail page needs. */
export interface PropertyDetail extends Property {
  /** Display location, e.g. "G-13, Islamabad". */
  location: string;
  /** Display label, e.g. "For Sale" / "For Rent". */
  purposeLabel: string;
  agent: Agent;
}

export interface Stat {
  value: string;
  label: string;
}

/* -------------------------------------------------------------------------- */
/*  AI Assistant API contract                                                 */
/* -------------------------------------------------------------------------- */

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export type LeadScore = "Hot" | "Warm" | "Cold";

/** Structured fields the assistant tries to extract from the conversation. */
export interface LeadFields {
  location?: string;
  budget?: string;
  propertyType?: string;
  /** Intent: Buy | Rent | Invest */
  purpose?: string;
  timeline?: string;
  bedrooms?: number;
  /** Display label, e.g. "5 Marla" / "1 Kanal". */
  size?: string;
}

/** Property suggestion returned alongside a reply, ready to render as a card. */
export interface MatchedProperty {
  id: string;
  title: string;
  location: string;
  price: string;
  image: string;
  beds: number;
  baths: number;
  area: string;
  /** Human-readable reason, e.g. "budget + location". */
  reason: string;
}

/* -------------------------------------------------------------------------- */
/*  Saved properties (shortlist)                                              */
/* -------------------------------------------------------------------------- */

/** A property the user has saved to their shortlist. */
export interface SavedProperty {
  id: string;
  title: string;
  location: string;
  price: string;
  image: string;
  beds?: number;
  baths?: number;
  area?: string;
  /** Epoch ms; used for newest-first ordering. */
  savedAt: number;
}

/** What a card passes to save — the provider stamps `savedAt`. */
export type SavablePropertyInput = Omit<SavedProperty, "savedAt">;

/** Consistent response shape for every /api/saved handler. */
export interface SavedApiResponse {
  items: SavedProperty[];
}

/** Request body for POST /api/assistant */
export interface AssistantRequest {
  message: string;
  history?: ChatMessage[];
  /** Continue an existing DB conversation (long-term memory); omit for a new one. */
  conversationId?: string | null;
}

/** Response body from POST /api/assistant */
export interface AssistantResponse {
  reply: string;
  lead: LeadFields;
  leadScore: LeadScore;
  suggestedNextQuestion: string;
  matchedProperties: MatchedProperty[];
  /** Listing URL pre-filled with the inferred filters (when matches exist). */
  searchUrl?: string;
  /** The DB conversation this turn was saved to (present only when a DB is configured). */
  conversationId?: string | null;
}

/* -------------------------------------------------------------------------- */
/*  Conversations (PostgreSQL long-term memory — ChatGPT-style history)        */
/* -------------------------------------------------------------------------- */

/** A row in the chat-history sidebar. */
export interface ConversationSummary {
  id: string;
  title: string;
  /** Purpose · location · type line, when known. */
  summary?: string;
  updatedAt: number;
}

/** A full conversation reloaded from the database. */
export interface ConversationDetail {
  id: string;
  messages: ChatMessage[];
  lead: LeadFields;
}

/** GET /api/conversations — tells the client whether DB memory is active. */
export interface ConversationsResponse {
  enabled: boolean;
  conversations: ConversationSummary[];
}

/* -------------------------------------------------------------------------- */
/*  Lead memory (local now; PostgreSQL-ready later)                           */
/*                                                                            */
/*  Structured so it maps cleanly onto DB tables later, e.g.                  */
/*    leads(id, requirements jsonb, chat_summary text, updated_at)            */
/*    lead_matches(lead_id, property_id)                                      */
/*    saved_properties(lead_id, property_id)                                  */
/* -------------------------------------------------------------------------- */

/** One entry in the local "Recent searches" list (ChatGPT-style history). */
export interface SearchHistoryEntry {
  id: string;
  /** Short title, e.g. "5 Marla House in Islamabad". */
  title: string;
  /** Purpose / budget line, e.g. "Buy · Under PKR 2 Crore". */
  summary: string;
  requirements: LeadFields;
  matchedPropertyIds: string[];
  /** Snapshot of the conversation so it can be reopened. */
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

/* -------------------------------------------------------------------------- */
/*  Post a property (owner/agent listing submissions)                         */
/*                                                                            */
/*  Stored locally now; maps cleanly onto a `property_submissions` table:     */
/*    property_submissions(id, owner_name, email, phone, city, area,          */
/*      purpose, property_type, size, price, bedrooms, bathrooms,             */
/*      description, status, created_at)                                      */
/* -------------------------------------------------------------------------- */

export type SubmissionPurpose = "sell" | "rent";

/** The raw form payload an owner/agent submits. */
export interface PropertySubmission {
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  area: string;
  purpose: SubmissionPurpose;
  /** "House" | "Apartment" | "Plot" | "Commercial" */
  propertyType: string;
  size: string;
  /** Expected sale price or monthly rent (free text, e.g. "PKR 2.5 Crore"). */
  price: string;
  bedrooms?: number;
  bathrooms?: number;
  description: string;
}

/** A submission never auto-publishes — it waits for review. */
export type SubmissionStatus = "pending" | "approved" | "rejected";

/** A persisted submission (draft listing) with review metadata. */
export interface PropertyDraft extends PropertySubmission {
  id: string;
  status: SubmissionStatus;
  createdAt: number;
}

export interface LeadMemory {
  /** Latest known requirements, merged across the conversation. */
  requirements: LeadFields;
  /** A short human-readable summary of what the user is after. */
  chatSummary: string;
  /** Property ids from the most recent match. */
  lastMatchedPropertyIds: string[];
  /** Property ids the user has saved. */
  savedPropertyIds: string[];
  /** Epoch ms of the last update. */
  updatedAt: number;
}
