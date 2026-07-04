"use client";

import { Button } from "@/components/ui/Button";

/**
 * Opens the global AI assistant with a prefilled question about this property.
 * Decoupled via a window event so the button doesn't need to know how the
 * assistant is mounted — the assistant listens for "horizon:ask-ai".
 */
export function AskAIButton({
  prompt,
  label = "Ask AI about this property",
  className = "",
}: {
  /** Optional — omit to just open the assistant without sending a message. */
  prompt?: string;
  label?: string;
  className?: string;
}) {
  const ask = () => {
    window.dispatchEvent(
      new CustomEvent("horizon:ask-ai", { detail: prompt ? { prompt } : {} })
    );
  };

  return (
    <Button variant="primary" size="lg" onClick={ask} className={className}>
      {label}
      <span aria-hidden className="text-lg leading-none">
        ↗
      </span>
    </Button>
  );
}
