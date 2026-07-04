import Image from "next/image";
import { SHOWCASE_IMAGE } from "@/lib/data";
import { Reveal } from "./Reveal";

const features = [
  {
    title: "AI-guided property matching",
    desc: "Describe what you need in plain words and get a focused shortlist — not endless listings.",
  },
  {
    title: "Sale and rental budgets handled separately",
    desc: "Buying and renting are never mixed, so your budget maps to the right market.",
  },
  {
    title: "Saved shortlist ready for follow-up",
    desc: "Keep the homes you love in one place, ready when you are.",
  },
];

export function Showcase() {
  return (
    <section className="relative overflow-hidden bg-ink text-paper">
      {/* Cinematic backdrop with slow zoom + a soft light sweep */}
      <div className="absolute inset-0">
        <Image
          src={SHOWCASE_IMAGE}
          alt="A luxury villa with a pool in warm evening light"
          fill
          sizes="100vw"
          className="hero-kenburns object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/85 to-ink/55" />
        <div className="pointer-events-none absolute inset-0 light-sweep" />
      </div>

      {/* Content */}
      <div className="shell relative py-24 md:py-32">
        <Reveal className="max-w-2xl">
          <p className="eyebrow text-paper/60">The Horizon difference</p>
          <h2 className="mt-4 font-serif text-3xl font-semibold leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl">
            Search with intent. Match with confidence.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-paper/80 sm:text-lg">
            Describe your lifestyle, budget, and timeline. Horizon Estate AI
            turns it into a focused property shortlist.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-8 sm:grid-cols-3 lg:mt-20">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 90}>
              <div className="border-t border-paper/25 pt-5">
                <h3 className="font-serif text-lg font-semibold leading-snug">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-paper/65">
                  {f.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
