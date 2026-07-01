"use client";

import { useSaved } from "@/context/SavedProvider";
import type { SavablePropertyInput } from "@/lib/types";

const Bookmark = ({ filled, className = "h-[15px] w-[15px]" }: { filled: boolean; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path
      d="M6 4h12v16l-6-4-6 4V4z"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

interface SaveButtonProps {
  property: SavablePropertyInput;
  variant?: "pill" | "icon";
  size?: "sm" | "lg";
  className?: string;
}

export function SaveButton({
  property,
  variant = "pill",
  size = "sm",
  className = "",
}: SaveButtonProps) {
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(property.id);

  const label = saved ? "Remove from saved" : "Save property";

  const handle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(property);
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handle}
        aria-pressed={saved}
        aria-label={label}
        title={label}
        className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 ${
          saved
            ? "bg-ink text-paper"
            : "bg-paper/90 text-ink hover:bg-paper"
        } ${className}`}
      >
        <Bookmark filled={saved} />
      </button>
    );
  }

  const pillSize = size === "lg" ? "h-[52px] px-5 text-sm" : "h-8 px-3 text-xs";

  return (
    <button
      type="button"
      onClick={handle}
      aria-pressed={saved}
      aria-label={label}
      className={`flex items-center justify-center gap-1.5 rounded-full border font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 ${pillSize} ${
        saved
          ? "border-ink bg-ink text-paper"
          : "border-line text-ink hover:border-ink"
      } ${className}`}
    >
      <Bookmark filled={saved} />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
