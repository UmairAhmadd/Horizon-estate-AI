/**
 * Splash intro — on every full page load the brand wordmark fades up over a
 * clean paper screen, a thin rule draws in, then the whole curtain lifts to
 * reveal the page. Pure CSS (see globals.css), so it starts instantly with the
 * first paint and needs no JS; client-side navigations don't re-trigger it.
 * Hidden entirely under prefers-reduced-motion.
 */
export function SplashIntro() {
  return (
    <div
      aria-hidden
      className="splash-intro pointer-events-none fixed inset-0 z-[100] flex flex-col items-center justify-center bg-paper"
    >
      <div className="splash-word flex items-baseline gap-[3px] text-ink">
        <span className="font-serif text-5xl font-semibold leading-none tracking-tight md:text-6xl">
          Horizon
        </span>
        <span className="text-xs font-semibold uppercase tracking-label opacity-70">
          Estate&nbsp;AI
        </span>
      </div>
      <span className="splash-line mt-6 h-px w-24 bg-ink/50" />
    </div>
  );
}
