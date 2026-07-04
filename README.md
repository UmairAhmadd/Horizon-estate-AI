# Horizon Estate AI

A premium, customer-facing **AI real-estate property discovery platform** for the
Pakistan market. Describe what you want in plain language — budget, city,
lifestyle, timeline — and an AI concierge turns it into a focused, budget-safe
shortlist you can browse, save, and revisit.

> Portfolio demo. Property data is placeholder data and the AI runs against any
> OpenAI-compatible provider (Groq works free). It runs fully on
> localStorage/in-memory by default, and **optionally** persists to PostgreSQL
> (Prisma) for long-term memory when `DATABASE_URL` is set.

---

## Features

- **AI Property Concierge** — a right-side drawer (desktop) / bottom sheet
  (mobile) that extracts intent from natural language and returns matched
  listings, with suggested prompts and conversation memory.
- **Accurate, trustworthy matching** — budget, city, property type, and purpose
  are hard constraints; matched cards are never over budget. Only bedrooms and
  size are ever relaxed, and no-match states are explained honestly.
- **Separate buy & rent** — `salePrice` and `monthlyRent` are modelled and
  filtered independently, so sale and rent budgets are never mixed.
- **Property listings** — a filterable `/properties` page (location, purpose,
  type, budget, size) and rich `/properties/[id]` detail pages with galleries.
- **Saved shortlist** — save/unsave from cards, chat, and the detail page;
  persisted locally with a swappable repository.
- **Post a property** — a premium modal for owners/agents to submit a listing
  (contact, city/area, sell/rent, type, size, price, beds/baths, description,
  photo placeholder). Submissions are saved as local draft listings for review
  and never auto-published.
- **Premium black-and-white design** — editorial serif + clean sans, natural
  photography, subtle motion, fully responsive.

## Tech stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** (custom monochrome token system; Fraunces + Manrope)
- **OpenAI-compatible LLM** via the Chat Completions API (OpenAI / Groq /
  OpenRouter) with a deterministic local fallback
- No database yet — `localStorage` + in-memory repositories behind clean
  interfaces

## Architecture overview

```
app/
  page.tsx                 Home (hero, search, featured, showcase, footer)
  properties/page.tsx      Listing + filters (reads URL query params)
  properties/[id]/page.tsx Property detail (SSG) + branded not-found
  api/assistant/route.ts   POST — AI concierge (thin; delegates to leadEngine)
  api/saved/route.ts       GET/POST/DELETE — saved shortlist (in-memory mock)
components/                UI: Navbar, Hero, SearchFilters, cards, AIAssistant, …
context/SavedProvider.tsx  Shortlist state (localStorage or /api/saved)
lib/
  data.ts                  Demo listings + filterProperties/getPropertyById (SWAP POINT)
  leadEngine.ts            AI extraction + matching + replies (server-only)
  leadMemory.ts            Lead memory persistence (localStorage; DB-ready)
  savedRepository.ts       Saved-shortlist persistence (local | api)
  db.ts                    Prisma client (server-only; null when no DATABASE_URL)
  server/leadStore.ts      Postgres persistence: leads, messages, prefs, saves
  server/session.ts        httpOnly session-id cookie helper
  types.ts                 Shared types
prisma/
  schema.prisma            properties, leads, conversations, messages, …
  seed.ts                  Seeds demo listings into Postgres
```

**Design seams (where a real backend plugs in):**

- `lib/data.ts → filterProperties` / `getPropertyById` — the single data-access
  point for listings.
- `lib/leadEngine.ts → generateWithOpenAI` — the LLM call (provider-agnostic).
- `lib/leadMemory.ts` and `lib/savedRepository.ts` — persistence interfaces.

## How the AI works

1. The UI sends the user message + chat history to `POST /api/assistant`.
2. `leadEngine.ts` calls an OpenAI-compatible model with a strict system prompt
   and gets back **structured JSON**: extracted lead fields (purpose, city,
   property type, sale/rent budget, bedrooms, size, timeline), a short reply, a
   lead score (internal only), and suggested search params.
3. To stay reliable on smaller/free models, the engine **also runs local regex
   extraction over the whole conversation and backfills** any field the model
   missed.
4. **Matching is done by app logic**, not the LLM: the inferred filters run
   through `filterProperties` against the local demo data. Budget/city/type/
   purpose are core (never relaxed); bedrooms then size may be relaxed. The chat
   cards and the `/properties` "See all" link use the exact same filters.
5. If the model call fails or no key is set, a **deterministic local mock**
   produces the same response shape — the UI never breaks.

The customer never sees the lead score.

## Where data is stored

**Default (no database):**

- **Property listings:** local demo data in `lib/data.ts` (22 realistic
  Islamabad / Lahore / Rawalpindi / Karachi listings, buy + rent).
- **Saved shortlist:** browser `localStorage` (or the in-memory `/api/saved`
  mock when `NEXT_PUBLIC_SAVED_PROVIDER=api`).
- **Lead memory:** browser `localStorage` via `lib/leadMemory.ts`.
- **Posted properties:** owner/agent submissions are saved as `pending` draft
  listings in browser `localStorage` via
  [`lib/propertySubmissions.ts`](lib/propertySubmissions.ts). They are **never
  auto-added to the public listings** — a review step flips `status` to
  `approved`. Swap `localPropertySubmissions` for a PostgreSQL-backed repository
  (a `property_submissions` table) later without touching the modal UI.

**With `DATABASE_URL` set (PostgreSQL long-term memory):** the API routes persist
to Postgres via Prisma and load a returning visitor's stored requirements. This
layer is **fully optional and additive** — remove `DATABASE_URL` and the app
behaves exactly as the default above.

### Memory model

| Layer | What | Where |
| --- | --- | --- |
| **Short-term memory** | The current chat's messages (this session) | React state in the concierge drawer |
| **Local long-term memory** | "Recent searches" — title, purpose/budget summary, extracted requirements, matched ids, and a message snapshot per search | `localStorage` via [`lib/searchHistory.ts`](lib/searchHistory.ts) (swappable repository) |
| **Production memory (future)** | Durable conversations / messages / leads / preferences across devices | PostgreSQL (`conversations`, `messages`, `leads`, `lead_preferences`) via Prisma — already wired, enabled by `DATABASE_URL` |

The "Recent searches" panel lives inside the concierge drawer (toggled from the
header, so it never clutters the chat). Clicking an entry reloads that search's
conversation; "Clear history" wipes the local list. Swapping
`localSearchHistory` for a DB-backed repository upgrades it to cross-device
history without touching the UI.

## PostgreSQL long-term memory (optional)

Prisma models ([`prisma/schema.prisma`](prisma/schema.prisma)):

| Table | Purpose |
| --- | --- |
| `properties` | Listings (seeded from `lib/data.ts`) |
| `leads` | One per anonymous session (cookie); later per user |
| `lead_preferences` | Latest extracted requirements for a lead |
| `conversations` | A chat thread per lead |
| `messages` | Every user + assistant message (+ matched ids) |
| `saved_properties` | A lead's saved shortlist (join to `properties`) |

**What gets persisted (only when `DATABASE_URL` is set):**

- Every chat message → `messages`
- Extracted requirements → `leads` + `lead_preferences`
- Saved properties → `saved_properties` (use `NEXT_PUBLIC_SAVED_PROVIDER=api`)
- On a returning session, stored `lead_preferences` are loaded and merged back
  into the concierge so it remembers earlier requirements.

**Setup:**

```bash
# 1. Set DATABASE_URL in .env.local (see .env.example)
# 2. Create tables + generate the client
npm run db:migrate        # prisma migrate dev  (or: npm run db:push)
# 3. Seed the demo listings
npm run db:seed
# optional: inspect data
npm run db:studio
```

Sessions are keyed by an **httpOnly** `horizon_sid` cookie — database
credentials and the session id never reach client JavaScript. The Prisma client
lives only in `server-only` modules (`lib/db.ts`, `lib/server/*`).

## Environment variables

Copy `.env.example` → `.env.local`. All AI keys are **server-only** — never
prefix with `NEXT_PUBLIC`.

| Variable | Purpose |
| --- | --- |
| `AI_PROVIDER` | `groq` \| `openrouter` \| `openai` — auto-selects the base URL |
| `AI_API_KEY` | Provider API key (server-only). Empty ⇒ local mock fallback |
| `AI_BASE_URL` | Optional explicit override for the API base URL |
| `AI_MODEL` | Model id, e.g. `llama-3.3-70b-versatile`, `gpt-4.1-mini` |
| `DATABASE_URL` | Optional Postgres connection string (server-only). Empty ⇒ localStorage/mock |
| `NEXT_PUBLIC_SAVED_PROVIDER` | `local` (default) or `api` for the saved shortlist |

Free setup (recommended): create a key at
[console.groq.com/keys](https://console.groq.com/keys), then set
`AI_PROVIDER=groq`, `AI_API_KEY=gsk_…`, `AI_MODEL=llama-3.3-70b-versatile`.

## Setup

```bash
npm install                    # also runs `prisma generate`
cp .env.example .env.local     # add your AI key (optional — mock works without)
npm run dev                    # http://localhost:3000

# optional — enable PostgreSQL long-term memory:
#   set DATABASE_URL in .env.local, then:
npm run db:migrate && npm run db:seed

# production:
npm run build && npm run start
```

> Env vars are read at server start — restart `npm run dev` after editing
> `.env.local`.

## Demo prompts

- `5 marla house in Islamabad under 2 crore`
- `Apartment rental under 2 lakh per month`
- `Karachi apartment for sale`
- `Lahore investment property`
- `Rawalpindi family house`
- `10 marla house in Bahria Town`

Try a multi-turn chat too — e.g. "I want to rent" → "in Lahore" → "2 bed". The
concierge remembers earlier turns and only asks for what's still missing.

## Notes / limitations

- Property data and imagery are **placeholders** for demonstration.
- The `/api/saved` API mode uses an **in-memory store** that resets on restart.
- **Post a property** saves local draft listings only (no backend upload yet);
  it's PostgreSQL-ready via the `PropertySubmissionRepository` seam.
- No authentication and no admin dashboard (customer-facing scope only).
