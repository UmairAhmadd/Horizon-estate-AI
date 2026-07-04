import Image from "next/image";
import { HeroConciergeCard } from "./HeroConciergeCard";
import { SearchFilters } from "./SearchFilters";
import { Reveal } from "./Reveal";
import { HERO_IMAGE } from "@/lib/data";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#F4ECE2] via-[#EFEFEC] to-[#E6ECF3]">
      <div className="shell pt-24 md:pt-28">
        {/* Heading */}
        <Reveal>
          <p className="eyebrow text-stone">AI-powered property discovery</p>
          <h1 className="mt-4 max-w-4xl font-serif text-[40px] font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl lg:text-[68px]">
            Find a place you will call home
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-stone sm:text-lg">
            Tell our AI what you need, and get matched with properties that fit
            your budget, lifestyle, and timeline.
          </p>
        </Reveal>

        {/* Photo + concierge card */}
        <div className="mt-8 grid gap-5 lg:grid-cols-12 lg:h-[500px]">
          <Reveal className="lg:col-span-8" delay={80}>
            <div className="relative h-[280px] overflow-hidden rounded-[24px] border border-black/5 bg-line sm:h-[380px] lg:h-full">
              <Image
                src={HERO_IMAGE}
                alt="A modern luxury villa with a pool in warm light"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="hero-kenburns object-cover"
              />
            </div>
          </Reveal>

          <Reveal className="lg:col-span-4" delay={160}>
            <HeroConciergeCard />
          </Reveal>
        </div>

        {/* Search */}
        <div className="mt-5 pb-12 md:pb-16">
          <Reveal delay={120}>
            <SearchFilters />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
