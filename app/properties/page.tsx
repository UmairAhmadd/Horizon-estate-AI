import type { Metadata } from "next";
import { filterProperties, parseFilters } from "@/lib/data";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PropertyCard } from "@/components/PropertyCard";
import { ListingFilters } from "@/components/ListingFilters";
import { AskAIButton } from "@/components/property/AskAIButton";

export const metadata: Metadata = {
  title: "Properties — Horizon Estate AI",
  description:
    "Browse verified properties across Pakistan and filter by location, price, size, and more.",
};

export default function PropertiesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filters = parseFilters(searchParams);
  const results = filterProperties(filters);

  return (
    <main>
      <Navbar overlay={false} />

      <div className="pt-16 md:pt-20">
        <div className="shell py-8 md:py-12">
          {/* Header */}
          <header className="mb-8">
            <p className="eyebrow">Browse listings</p>
            <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight sm:text-5xl">
              Properties
            </h1>
            <p className="mt-3 text-stone">
              {results.length}{" "}
              {results.length === 1
                ? "property matches"
                : "properties match"}{" "}
              your search.
            </p>
          </header>

          {/* Filters */}
          <ListingFilters />

          {/* Results */}
          {results.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          ) : (
            <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-20 text-center">
              <h2 className="font-serif text-2xl font-semibold">
                No properties found
              </h2>
              <p className="mt-3 max-w-md text-stone">
                Try changing your filters or ask AI to help.
              </p>
              <AskAIButton
                className="mt-8"
                label="Ask AI Assistant"
                prompt="I couldn't find a property with my current filters. Can you help me find something that fits?"
              />
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
