import { PropertyCard } from "./PropertyCard";
import { Button } from "./ui/Button";
import { properties } from "@/lib/data";

export function FeaturedProperties() {
  return (
    <section id="properties" className="scroll-mt-24 py-20 md:py-28">
      <div className="shell">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="eyebrow">Featured listings</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl">
              Homes worth a closer look
            </h2>
            <p className="mt-3 text-stone">
              A hand-picked selection of verified properties across Pakistan’s
              most sought-after neighbourhoods.
            </p>
          </div>
          <Button href="/properties" variant="outline" size="md">
            View all properties
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
