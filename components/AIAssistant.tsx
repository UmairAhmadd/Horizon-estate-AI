"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { suggestedPrompts } from "@/lib/data";
import type {
  AssistantResponse,
  ChatMessage,
  MatchedProperty,
  SearchHistoryEntry,
} from "@/lib/types";
import { ChatPropertyCard } from "./ChatPropertyCard";
import { ConciergeIcon } from "./ConciergeIcon";
import { useSaved } from "@/context/SavedProvider";
import { localLeadMemory } from "@/lib/leadMemory";
import { localSearchHistory, summariseLead } from "@/lib/searchHistory";

interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
  pending?: boolean;
  nextQuestion?: string;
  /** `undefined` = not a search turn; `[]` = searched, no matches. */
  matches?: MatchedProperty[];
  searchUrl?: string;
  /** Compact CTA for action replies (e.g. "View details" → /properties/[id]). */
  actionLink?: { href: string; label: string };
}

const INTRO: Message = {
  id: 0,
  role: "ai",
  text: "Welcome to Horizon. Tell me your budget, location, and lifestyle — I’ll put together a focused shortlist for you.",
};

async function fetchReply(
  message: string,
  history: ChatMessage[]
): Promise<AssistantResponse> {
  const res = await fetch("/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) throw new Error(`Assistant request failed (${res.status})`);
  return (await res.json()) as AssistantResponse;
}

/* ---------------------------- action intents ------------------------------ */
// "save property", "view details", "arrange viewing" — these act on the LAST
// matched cards; they are NOT new searches, so they never hit the matcher.

type ActionKind = "save" | "view" | "schedule";

function parseActionKind(text: string): ActionKind | null {
  const t = text.toLowerCase();
  if (
    /\b(arrange|schedule|book|set ?up)\b/.test(t) &&
    /\b(viewing|tour|visit|appointment)\b/.test(t)
  ) {
    return "schedule";
  }
  if (/\b(save|shortlist|bookmark)\b/.test(t)) return "save";
  if (
    /\bview details\b|\bshow details\b|\bmore details\b|\bsee details\b|\bopen details\b|\bview it\b|\bopen it\b|\bopen (the )?(property|listing|this|that)\b|\bview (the )?(property|listing|this|that|details)\b|\bdetails\b/.test(
      t
    )
  ) {
    return "view";
  }
  return null;
}

// Pick the referenced property from the latest matches (ordinal or name).
function resolveTarget(
  latest: MatchedProperty[],
  text: string
): MatchedProperty | null {
  if (latest.length === 0) return null;
  if (latest.length === 1) return latest[0];
  const t = text.toLowerCase();
  const ord = /\b(first|1st|one|#?1)\b/.test(t)
    ? 0
    : /\b(second|2nd|two|#?2)\b/.test(t)
      ? 1
      : /\b(third|3rd|three|#?3)\b/.test(t)
        ? 2
        : /\blast\b/.test(t)
          ? latest.length - 1
          : null;
  if (ord !== null && ord >= 0 && ord < latest.length) return latest[ord];
  const named = latest.find((p) => t.includes(p.title.toLowerCase()));
  return named ?? null;
}

function timeAgo(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const ClockIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M12 7.5V12l3 1.8"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const NewChatIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);

const TypingDots = () => (
  <span className="flex items-center gap-1 py-1" aria-label="Assistant is typing">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone/60"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </span>
);

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INTRO]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const idRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On the homepage the hero's preview card is the concierge entry point, so
  // the floating trigger stays hidden until you scroll past the hero. On other
  // pages it's available immediately.
  const pathname = usePathname();
  const [showTrigger, setShowTrigger] = useState(pathname !== "/");
  useEffect(() => {
    if (pathname !== "/") {
      setShowTrigger(true);
      return;
    }
    const onScroll = () =>
      setShowTrigger(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Saved shortlist ids feed into the persisted lead memory; toggle/isSaved let
  // the concierge honour "save this property" commands programmatically.
  const { items: savedItems, toggle: toggleSaved, isSaved } = useSaved();

  // A pending "which one?" question so a bare follow-up ("first", "the villa")
  // resolves against the last matched cards instead of starting a new search.
  const pendingActionRef = useRef<ActionKind | null>(null);

  // Local long-term memory: recent searches ("ChatGPT-style" history).
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const currentEntryRef = useRef<{
    id: string;
    key: string;
    createdAt: number;
  } | null>(null);
  useEffect(() => setSearchHistory(localSearchHistory.list()), []);

  const openHistoryEntry = (entry: SearchHistoryEntry) => {
    setMessages([
      INTRO,
      ...entry.messages.map((m) => ({
        id: idRef.current++,
        role: m.role === "assistant" ? ("ai" as const) : ("user" as const),
        text: m.content,
      })),
    ]);
    currentEntryRef.current = {
      id: entry.id,
      key: summariseLead(entry.requirements)?.key ?? entry.id,
      createdAt: entry.createdAt,
    };
    setShowHistory(false);
  };

  const removeHistoryEntry = (id: string) => {
    setSearchHistory(localSearchHistory.remove(id));
    if (currentEntryRef.current?.id === id) currentEntryRef.current = null;
  };

  const clearHistory = () => {
    localSearchHistory.clear();
    setSearchHistory([]);
    currentEntryRef.current = null;
    setShowHistory(false);
  };

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  // Reset the conversation for a fresh property search. Only the short-term
  // state is cleared — saved shortlist, recent searches, and local long-term
  // memory are all preserved.
  const startNewChat = () => {
    setMessages([INTRO]);
    setInput("");
    setShowHistory(false);
    currentEntryRef.current = null; // forget the current search thread
    pendingActionRef.current = null; // drop any pending "which one?" action
    showToast("New search started.");
  };

  // The most recent matched cards shown in the chat — what action commands
  // ("save this", "view details") operate on.
  const latestMatches = (): MatchedProperty[] => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "ai" && m.matches && m.matches.length > 0) return m.matches;
    }
    return [];
  };

  // Append a user turn + a locally-composed assistant turn (no API call).
  const pushLocalTurn = (userText: string, ai: Omit<Message, "id" | "role">) => {
    setMessages((m) => [
      ...m,
      { id: idRef.current++, role: "user", text: userText },
      { id: idRef.current++, role: "ai", ...ai },
    ]);
    setInput("");
    setOpen(true);
  };

  const runAction = (
    kind: ActionKind,
    target: MatchedProperty,
    userText: string
  ) => {
    // Action replies stay compact — a short confirmation (and a link where it
    // helps), never a repeat of the full property card.
    if (kind === "save") {
      const already = isSaved(target.id);
      if (!already) {
        toggleSaved({
          id: target.id,
          title: target.title,
          location: target.location,
          price: target.price,
          image: target.image,
          beds: target.beds,
          baths: target.baths,
          area: target.area,
        });
      }
      pushLocalTurn(userText, {
        text: already
          ? `“${target.title}” is already in your shortlist.`
          : `Saved “${target.title}” to your shortlist.`,
      });
    } else if (kind === "view") {
      pushLocalTurn(userText, {
        text: `Here's “${target.title}”.`,
        actionLink: { href: `/properties/${target.id}`, label: "View details" },
      });
    } else {
      pushLocalTurn(userText, {
        text: `Happy to arrange a viewing for “${target.title}”. What day and time works for you? An advisor will confirm availability.`,
        actionLink: { href: `/properties/${target.id}`, label: "View property" },
      });
    }
  };

  // Handle UI/action commands locally. Returns true when the message was an
  // action (so `send` skips the matcher entirely — no new search, no stale
  // filters, no no-match messaging, no lead-state mutation).
  const handleAction = (text: string): boolean => {
    // Typed reset command — same effect as the "New" header button.
    if (
      /^\s*(start (a )?new (search|chat)|new (search|chat)|start over|reset( chat)?|clear chat)\s*[.!]?\s*$/i.test(
        text
      )
    ) {
      startNewChat();
      return true;
    }

    const latest = latestMatches();

    // Resolve a pending "which one?" reply (e.g. a bare "the second one").
    if (pendingActionRef.current) {
      const kind = pendingActionRef.current;
      const target = resolveTarget(latest, text);
      if (target) {
        pendingActionRef.current = null;
        runAction(kind, target, text);
        return true;
      }
      // Not a resolvable selector — drop the pending state and fall through.
      pendingActionRef.current = null;
    }

    const kind = parseActionKind(text);
    if (!kind) return false;

    if (latest.length === 0) {
      pushLocalTurn(text, {
        text:
          kind === "schedule"
            ? "I'll need a matched property first — tell me what you're looking for and I'll shortlist some, then we can arrange a viewing."
            : kind === "save"
              ? "There's nothing to save yet — search for a property first and I'll add it to your shortlist."
              : "There's nothing to open yet — search for a property first and I'll show you the details.",
      });
      return true;
    }

    const target = resolveTarget(latest, text);
    if (!target) {
      // Multiple matches and no selector — ask which one.
      pendingActionRef.current = kind;
      pushLocalTurn(text, {
        text:
          kind === "schedule"
            ? 'Which property would you like to view, and what time suits you? You can say "first", "second", or the property name.'
            : `Which property would you like to ${kind}? You can say "first", "second", or the property name.`,
      });
      return true;
    }

    runAction(kind, target, text);
    return true;
  };

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || loading) return;

    // Action commands ("save this", "view details", "arrange a viewing") act on
    // the last matched cards — they are not new searches.
    if (handleAction(text)) return;

    const history: ChatMessage[] = messages
      // Skip the static welcome (id 0) — it isn't part of the conversation and
      // would otherwise be stored and replayed as a second welcome on restore.
      .filter((m) => m.id !== 0 && !m.pending && m.text)
      .map((m) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.text,
      }));

    const userMsg: Message = { id: idRef.current++, role: "user", text };
    const pendingId = idRef.current++;
    const pendingMsg: Message = {
      id: pendingId,
      role: "ai",
      text: "",
      pending: true,
    };

    setMessages((m) => [...m, userMsg, pendingMsg]);
    setInput("");
    setOpen(true);
    setLoading(true);

    try {
      const data = await fetchReply(text, history);
      setMessages((m) =>
        m.map((msg) =>
          msg.id === pendingId
            ? {
                id: pendingId,
                role: "ai",
                text: data.reply,
                nextQuestion: data.suggestedNextQuestion,
                matches: data.matchedProperties,
                searchUrl: data.searchUrl,
              }
            : msg
        )
      );

      // Persist a lead-memory snapshot (local now; PostgreSQL-ready later).
      localLeadMemory.save({
        requirements: data.lead,
        chatSummary: text,
        lastMatchedPropertyIds: data.matchedProperties.map((mp) => mp.id),
        savedPropertyIds: savedItems.map((s) => s.id),
        updatedAt: Date.now(),
      });

      // Update "recent searches": continue the current entry, or start a new one
      // when the search (city + purpose) changes.
      const summary = summariseLead(data.lead);
      if (summary) {
        const prev = currentEntryRef.current;
        const continues = prev != null && prev.key === summary.key;
        const id = continues
          ? prev.id
          : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const createdAt = continues ? prev.createdAt : Date.now();
        currentEntryRef.current = { id, key: summary.key, createdAt };
        setSearchHistory(
          localSearchHistory.upsert({
            id,
            title: summary.title,
            summary: summary.summary,
            requirements: data.lead,
            matchedPropertyIds: data.matchedProperties.map((mp) => mp.id),
            messages: [
              ...history,
              { role: "user", content: text },
              { role: "assistant", content: data.reply },
            ],
            createdAt,
            updatedAt: Date.now(),
          })
        );
      }
    } catch {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === pendingId
            ? {
                id: pendingId,
                role: "ai",
                text: "I couldn't reach the concierge just now — please try again in a moment.",
              }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // Let other components open the concierge (e.g. the "Start AI Search" hero
  // CTA and "Ask AI about this property" on the detail page).
  const sendRef = useRef(send);
  sendRef.current = send;
  useEffect(() => {
    const handler = (e: Event) => {
      setOpen(true);
      const detail = (e as CustomEvent).detail as { prompt?: string } | undefined;
      if (detail?.prompt) sendRef.current(detail.prompt);
    };
    window.addEventListener("horizon:ask-ai", handler);
    return () => window.removeEventListener("horizon:ask-ai", handler);
  }, []);

  const triggerShadow = "shadow-[0_20px_50px_-24px_rgba(10,10,10,0.55)]";

  return (
    <>
      {/* ---------------- Trigger (when closed) ---------------- */}
      {!open && showTrigger && (
        <>
          {/* Desktop: compact concierge icon, fixed right / mid-lower */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open AI Property Concierge"
            title="AI Property Concierge"
            className={`fixed right-5 top-[62%] z-40 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-2xl border border-line bg-paper text-ink transition-transform hover:-translate-y-[calc(50%+2px)] lg:flex ${triggerShadow}`}
          >
            <ConciergeIcon className="h-6 w-6" />
          </button>

          {/* Mobile: compact floating button */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open AI Property Concierge"
            className={`fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-paper text-ink lg:hidden ${triggerShadow}`}
          >
            <ConciergeIcon className="h-6 w-6" />
          </button>
        </>
      )}

      {/* ---------------- Drawer (when open) ---------------- */}
      {open && (
        <>
          {/* Subtle overlay — page stays visible behind on desktop */}
          <div
            className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-[2px] lg:bg-ink/20 lg:backdrop-blur-none"
            onClick={() => setOpen(false)}
            aria-hidden
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="AI Property Concierge"
            className="fixed z-50 flex flex-col overflow-hidden border-line bg-paper
              inset-x-0 bottom-0 max-h-[88vh] animate-slide-up rounded-t-3xl border-t
              lg:inset-y-0 lg:right-0 lg:left-auto lg:h-full lg:max-h-none lg:w-[540px] lg:animate-slide-right lg:rounded-none lg:border-l lg:border-t-0 lg:shadow-[-30px_0_80px_-40px_rgba(10,10,10,0.5)]"
          >
            {/* Header */}
            <div className="border-b border-line px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-paper">
                    <ConciergeIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold leading-tight">
                      AI Property Concierge
                    </p>
                    <p className="mt-0.5 text-xs text-stone">
                      Tell me your budget, location, and lifestyle.
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={startNewChat}
                    aria-label="Start a new search"
                    title="Start a new search"
                    className="flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-semibold text-ink transition-colors hover:border-ink"
                  >
                    <NewChatIcon className="h-3.5 w-3.5" />
                    New
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHistory((v) => !v)}
                    aria-pressed={showHistory}
                    aria-label="Recent searches"
                    title="Recent searches"
                    className={`flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors ${
                      showHistory
                        ? "border-ink bg-ink text-paper"
                        : "border-line text-ink hover:border-ink"
                    }`}
                  >
                    <ClockIcon className="h-3.5 w-3.5" />
                    Recent
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close concierge"
                    className="-mr-1 flex h-9 w-9 items-center justify-center rounded-full text-stone transition-colors hover:bg-ink/5 hover:text-ink"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                      <path
                        d="M6 6l12 12M18 6L6 18"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Refined status row */}
              <div className="mt-3.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold text-ink">
                  <span className="h-1.5 w-1.5 rounded-full bg-ink" />
                  Smart matching
                </span>
                <span className="text-[11px] text-stone">
                  Sale &amp; rental budgets handled separately
                </span>
              </div>
            </div>

            {/* Transient confirmation (e.g. after "New search") */}
            {toast && (
              <div
                role="status"
                className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center"
              >
                <span className="rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-paper shadow-[0_10px_30px_-12px_rgba(10,10,10,0.6)]">
                  {toast}
                </span>
              </div>
            )}

            {/* Recent searches (local long-term memory) — kept out of the chat */}
            {showHistory ? (
              <div className="flex-1 overflow-y-auto px-5 py-5">
                <div className="flex items-center justify-between">
                  <p className="eyebrow">Recent searches</p>
                  {searchHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={clearHistory}
                      className="text-xs font-medium text-stone underline-offset-4 transition-colors hover:text-ink hover:underline"
                    >
                      Clear history
                    </button>
                  )}
                </div>

                {searchHistory.length === 0 ? (
                  <p className="mt-6 text-sm leading-relaxed text-stone">
                    No recent searches yet — your searches will show up here so
                    you can pick up where you left off.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {searchHistory.map((e) => (
                      <li key={e.id} className="group relative">
                        <button
                          type="button"
                          onClick={() => openHistoryEntry(e)}
                          className="w-full rounded-xl border border-line bg-white p-3 pr-9 text-left transition-colors hover:border-ink/25"
                        >
                          <p className="truncate text-sm font-semibold text-ink">
                            {e.title}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-stone">
                            {[e.summary, timeAgo(e.updatedAt)]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeHistoryEntry(e.id)}
                          aria-label="Remove search"
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-stone opacity-0 transition hover:bg-ink/5 hover:text-ink group-hover:opacity-100"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                            <path
                              d="M6 6l12 12M18 6L6 18"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div
                ref={scrollRef}
                className="flex-1 space-y-4 overflow-y-auto px-5 py-5"
              >
                {messages.map((m) => {
                if (m.role === "user") {
                  return (
                    <div key={m.id} className="flex justify-end">
                      <p className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-sm leading-relaxed text-paper">
                        {m.text}
                      </p>
                    </div>
                  );
                }

                const hasMatches = m.matches && m.matches.length > 0;

                return (
                  <div key={m.id} className="space-y-3">
                    <div className="flex justify-start">
                      <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-line bg-white px-4 py-2.5 text-sm leading-relaxed text-ink">
                        {m.pending ? <TypingDots /> : <p>{m.text}</p>}
                      </div>
                    </div>

                    {m.actionLink && (
                      <Link
                        href={m.actionLink.href}
                        onClick={() => setOpen(false)}
                        className="inline-flex h-8 items-center gap-1 rounded-full bg-ink px-4 text-xs font-semibold text-paper transition-colors hover:bg-ink/85"
                      >
                        {m.actionLink.label}
                        <span aria-hidden>→</span>
                      </Link>
                    )}

                    {hasMatches && (
                      <div className="space-y-2">
                        {m.matches!.map((mp) => (
                          <ChatPropertyCard key={mp.id} property={mp} />
                        ))}
                        {m.searchUrl && (
                          <Link
                            href={m.searchUrl}
                            onClick={() => setOpen(false)}
                            className="inline-flex items-center gap-1 px-1 pt-0.5 text-xs font-semibold text-ink underline-offset-4 hover:underline"
                          >
                            See all matching properties
                            <span aria-hidden>→</span>
                          </Link>
                        )}
                      </div>
                    )}

                    {/* Next question — shown while collecting or alongside matches.
                        No "no matches" box: the reply itself carries that message. */}
                    {!m.pending && m.nextQuestion && (
                      <p className="px-1 pt-1 text-[13px] italic text-stone">
                        {m.nextQuestion}
                      </p>
                    )}
                  </div>
                );
              })}
              </div>
            )}

            {/* Suggested prompts + input (hidden while viewing history) */}
            {!showHistory && (
              <>
            <div className="flex gap-2 overflow-x-auto border-t border-line px-5 py-3 no-scrollbar">
              {suggestedPrompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => send(p)}
                  disabled={loading}
                  className="whitespace-nowrap rounded-full border border-line bg-white px-3.5 py-2 text-xs font-medium text-ink transition-colors hover:border-ink hover:bg-ink/[0.03] disabled:opacity-40"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-line p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. 5 marla house in Islamabad…"
                className="h-11 flex-1 rounded-full border border-line bg-white px-4 text-sm outline-none placeholder:text-stone/70 focus:border-ink"
                aria-label="Describe your ideal property"
              />
              <button
                type="submit"
                aria-label="Send message"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition-colors hover:bg-ink/85 disabled:opacity-40"
                disabled={!input.trim() || loading}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </form>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
