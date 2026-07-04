"use client";

import { useEffect } from "react";

/**
 * Refcounted body scroll lock. Multiple overlays (concierge drawer, saved
 * drawer, post-property modal, mobile nav) can be open at once — the body
 * unlocks only when the LAST one closes, instead of each overlay stomping
 * document.body.style.overflow on its own.
 */
let locks = 0;

export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    locks += 1;
    document.body.style.overflow = "hidden";
    return () => {
      locks = Math.max(0, locks - 1);
      if (locks === 0) document.body.style.overflow = "";
    };
  }, [active]);
}
