import Image from "next/image";
import { Button } from "./ui/Button";
import { FeaturedPropertyCard } from "./FeaturedPropertyCard";
import { HERO_IMAGE, featuredProperty } from "@/lib/data";

export function Hero() {
  return (
    <section className="relative min-h-[92vh] w-full overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src={HERO_IMAGE}
          alt="A modern luxury home at dusk"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Subtle scrim — keeps the headline and nav legible over the photo */}
        <div className="absolute inset-0 bg-gradient-to-br from-ink/75 via-ink/45 to-ink/25" />
      </div>

      {/* Content */}
      <div className="shell relative flex min-h-[92vh] items-center pb-40 pt-28 md:pb-48">
        <div className="grid w-full items-center gap-10 lg:grid-cols-12">
          {/* Left: copy */}
          <div className="max-w-2xl animate-fade-up lg:col-span-7">
            <p className="eyebrow text-paper/70">
              AI-powered property discovery
            </p>
            <h1 className="mt-5 font-serif text-[44px] font-semibold leading-[1.03] tracking-tight text-paper sm:text-6xl lg:text-7xl">
              Find a place you
              <br className="hidden sm:block" /> will call home
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-paper/80 sm:text-lg">
              Tell our AI what you need, and get matched with properties that fit
              your budget, lifestyle, and timeline.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button href="#assistant" variant="primary" size="lg">
                Start AI Search
                <span aria-hidden className="text-lg leading-none">
                  ↗
                </span>
              </Button>
              <Button
                href="/properties"
                variant="outline"
                size="lg"
                className="border-paper/40 text-paper hover:border-paper hover:bg-paper/10"
              >
                Browse Properties
              </Button>
            </div>
          </div>

          {/* Right: floating featured card */}
          <div className="hidden animate-fade-up justify-end lg:col-span-5 lg:flex [animation-delay:150ms]">
            <FeaturedPropertyCard property={featuredProperty} />
          </div>
        </div>
      </div>
    </section>
  );
}
