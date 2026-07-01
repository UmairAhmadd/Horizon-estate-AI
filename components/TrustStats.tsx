import { stats } from "@/lib/data";

export function TrustStats() {
  return (
    <section id="company" className="scroll-mt-24 bg-ink text-paper">
      <div className="shell py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-5">
            <p className="eyebrow text-paper/60">Why Horizon</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl">
              A calmer way to buy, sell, and invest
            </h2>
            <p className="mt-4 max-w-md text-paper/70">
              We pair verified listings with an AI concierge, so every match is
              grounded in your real budget, lifestyle, and timeline — not guesswork.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-10 lg:col-span-7 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="border-t border-paper/20 pt-5">
                <p className="font-serif text-4xl font-semibold leading-none sm:text-5xl">
                  {s.value}
                </p>
                <p className="mt-3 text-sm text-paper/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
