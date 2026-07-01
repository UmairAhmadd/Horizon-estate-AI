"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { suggestedPrompts } from "@/lib/data";
import type { AssistantResponse, ChatMessage, MatchedProperty } from "@/lib/types";
import { ChatPropertyCard } from "./ChatPropertyCard";

interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
  pending?: boolean;
  /** Follow-up the assistant suggests asking next. */
  nextQuestion?: string;
  /**
   * Property suggestions for this turn.
   * `undefined` = not a search turn (e.g. intro); `[]` = searched, no matches.
   */
  matches?: MatchedProperty[];
  /** Listing URL pre-filled with this turn's inferred filters. */
  searchUrl?: string;
}

const INTRO: Message = {
  id: 0,
  role: "ai",
  text: "Hello — I’m your property concierge. Tell me your budget, location, and lifestyle, and I’ll shortlist homes that fit.",
};

/**
 * Talk to the backend route. All matching/extraction logic lives server-side in
 * lib/leadEngine.ts — this component only renders the conversation.
 */
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

const Sparkle = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path
      d="M12 3l1.6 4.9L18.5 9.5l-4.9 1.6L12 16l-1.6-4.9L5.5 9.5l4.9-1.6L12 3z"
      fill="currentColor"
    />
    <path
      d="M18.5 14.5l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1z"
      fill="currentColor"
      opacity="0.6"
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
  const idRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || loading) return;

    // Build history from the visible conversation before this turn.
    const history: ChatMessage[] = messages
      .filter((m) => !m.pending && m.text)
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

  // Let any component open the assistant with a prefilled prompt
  // (e.g. the "Ask AI about this property" CTA on the detail page).
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

  return (
    <>
      {/* Anchor for "Start AI Search" */}
      <span id="assistant" className="sr-only" />

      {/* ---------------- Launcher (when closed) ---------------- */}
      {!open && (
        <>
          {/* Desktop: compact concierge panel */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group fixed bottom-6 right-6 z-40 hidden w-[300px] items-center gap-3 rounded-2xl border border-line bg-paper p-3 text-left shadow-[0_24px_60px_-30px_rgba(10,10,10,0.5)] transition-transform hover:-translate-y-0.5 lg:flex"
            aria-label="Open AI Property Assistant"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink text-paper">
              <Sparkle className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink">
                AI Property Assistant
              </span>
              <span className="block truncate text-xs text-stone">
                Describe your ideal property
              </span>
            </span>
          </button>

          {/* Mobile: floating bottom button */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="fixed bottom-5 right-5 z-40 flex h-14 items-center gap-2 rounded-full bg-ink pl-4 pr-5 text-paper shadow-[0_18px_40px_-15px_rgba(10,10,10,0.7)] lg:hidden"
            aria-label="Open AI Property Assistant"
          >
            <Sparkle className="h-5 w-5" />
            <span className="text-sm font-semibold">Ask AI</span>
          </button>
        </>
      )}

      {/* ---------------- Full panel (when open) ---------------- */}
      {open && (
        <>
          {/* Mobile scrim */}
          <div
            className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-[2px] lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />

          <div
            role="dialog"
            aria-label="AI Property Assistant"
            className="fixed z-50 flex animate-panel-in flex-col overflow-hidden border-line bg-paper
              inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl border-t
              lg:inset-auto lg:bottom-6 lg:right-6 lg:h-[560px] lg:max-h-[80vh] lg:w-[380px] lg:rounded-3xl lg:border lg:shadow-[0_40px_90px_-40px_rgba(10,10,10,0.6)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-paper">
                  <Sparkle className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold leading-tight">
                    AI Property Assistant
                  </p>
                  <p className="text-xs text-stone">Describe your ideal property</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
                className="flex h-9 w-9 items-center justify-center rounded-full text-stone transition-colors hover:bg-ink/5 hover:text-ink"
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

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-4 overflow-y-auto px-5 py-5"
            >
              {messages.map((m) => {
                if (m.role === "user") {
                  return (
                    <div key={m.id} className="flex justify-end">
                      <p className="max-w-[85%] rounded-2xl bg-ink px-4 py-2.5 text-sm leading-relaxed text-paper">
                        {m.text}
                      </p>
                    </div>
                  );
                }

                const hasMatches = m.matches && m.matches.length > 0;
                const noMatches = m.matches && m.matches.length === 0;

                return (
                  <div key={m.id} className="space-y-3">
                    {/* Reply bubble */}
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl border border-line bg-white px-4 py-2.5 text-sm leading-relaxed text-ink">
                        {m.pending ? <TypingDots /> : <p>{m.text}</p>}
                      </div>
                    </div>

                    {/* Matched property cards */}
                    {hasMatches && (
                      <div className="space-y-2">
                        {m.matches!.map((mp) => (
                          <ChatPropertyCard key={mp.id} property={mp} />
                        ))}
                        {m.searchUrl && (
                          <Link
                            href={m.searchUrl}
                            className="inline-flex items-center gap-1 px-1 pt-0.5 text-xs font-semibold text-ink underline-offset-4 hover:underline"
                          >
                            See all matching properties
                            <span aria-hidden>→</span>
                          </Link>
                        )}
                        {m.nextQuestion && (
                          <p className="px-1 pt-1 text-[13px] italic text-stone">
                            {m.nextQuestion}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Empty state */}
                    {noMatches && (
                      <div className="rounded-xl border border-dashed border-line bg-ink/[0.02] px-4 py-4 text-sm">
                        <p className="font-semibold text-ink">
                          No matches to show yet
                        </p>
                        <p className="mt-1 text-[13px] text-stone">
                          {m.nextQuestion ??
                            "Tell me a little more and I’ll pull together some options."}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Suggested prompts */}
            <div className="flex gap-2 overflow-x-auto border-t border-line px-5 py-3 no-scrollbar">
              {suggestedPrompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => send(p)}
                  disabled={loading}
                  className="whitespace-nowrap rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-ink hover:bg-ink/[0.04] disabled:opacity-40"
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
                placeholder="e.g. 10 marla house in DHA Lahore…"
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
          </div>
        </>
      )}
    </>
  );
}
