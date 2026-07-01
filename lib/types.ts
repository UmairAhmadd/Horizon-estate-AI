export type Listing = "Buy" | "Rent" | "New Developments" | "Commercial";

export interface Property {
  id: string;
  title: string;
  location: string;
  city: string;
  /** Preformatted price for display, e.g. "PKR 9.8 Cr" or "PKR 1.8 Lakh / mo". */
  price: string;
  /** Sale price in PKR (present on Buy / sale listings). */
  salePrice?: number;
  /** Monthly rent in PKR (present on Rent listings). */
  monthlyRent?: number;
  priceNote?: string;
  beds: number;
  baths: number;
  area: string;
  /** Approximate area in square feet — used for size filtering. */
  areaSqft: number;
  type: string;
  listing: Listing;
  image: string;
  tag?: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  location: string;
  deals: string;
  image: string;
}

/** A Property enriched with everything the detail page needs to render. */
export interface PropertyDetail extends Property {
  gallery: string[];
  description: string;
  features: string[];
  /** Display label, e.g. "For Sale" / "For Rent". */
  purpose: string;
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
}
