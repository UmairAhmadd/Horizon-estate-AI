import Image from "next/image";
import { Button } from "./ui/Button";
import { agents } from "@/lib/data";

export function Agents() {
  return (
    <section id="careers" className="scroll-mt-24 py-20 md:py-28">
      <div className="shell">
        <div className="max-w-xl">
          <p className="eyebrow">Your advisors</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl">
            Meet the people behind the match
          </h2>
          <p className="mt-3 text-stone">
            Every AI shortlist is backed by a specialist who knows the ground —
            pricing, paperwork, and the right questions to ask.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((a) => (
            <article
              key={a.id}
              className="flex flex-col rounded-2xl border border-line bg-white p-4"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-line">
                <Image
                  src={a.image}
                  alt={a.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="grayscale-img object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col px-1 pt-5">
                <h3 className="font-serif text-xl font-semibold">{a.name}</h3>
                <p className="mt-0.5 text-sm text-stone">{a.role}</p>
                <div className="mt-2 flex items-center gap-2 text-[13px] text-stone">
                  <span>{a.location}</span>
                  <span className="text-stone/40">·</span>
                  <span>{a.deals}</span>
                </div>
                <div className="mt-5 pt-1">
                  <Button
                    href="#contact"
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Contact {a.name.split(" ")[0]}
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
