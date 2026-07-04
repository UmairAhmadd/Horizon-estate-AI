import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPropertyIds, getPropertyById } from "@/lib/data";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import { SaveButton } from "@/components/SaveButton";
import { Gallery } from "@/components/property/Gallery";
import { AskAIButton } from "@/components/property/AskAIButton";

export function generateStaticParams() {
  return getAllPropertyIds().map((id) => ({ id }));
}

// All property ids are known at build time, so anything not prerendered is a
// genuine 404 (framework-level). When a real DB backs this, flip to `true` and
// rely on notFound() for ids that don't resolve.
export const dynamicParams = false;

export function generateMetadata({
  params,
}: {
  params: { id: string };
}): Metadata {
  const property = getPropertyById(params.id);
  if (!property) return { title: "Property not found — Horizon Estate AI" };
  return {
    title: `${property.title}, ${property.location} — Horizon Estate AI`,
    description: property.description,
  };
}

const Dot = () => <span className="text-stone/40">·</span>;

const Check = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
    <path
      d="M5 12.5l4.5 4.5L19 7.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function PropertyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const property = getPropertyById(params.id);

  // Renders the branded app/properties/[id]/not-found.tsx with a 404 status.
  if (!property) notFound();

  /* ------------------------------- Detail -------------------------------- */
  const savable = {
    id: property.id,
    title: property.title,
    location: property.location,
    price: property.displayPrice,
    image: property.images[0],
    beds: property.bedrooms,
    baths: property.bathrooms,
    area: property.size,
  };

  const askPrompt = `I'd like to know more about "${property.title}" — a ${property.propertyType.toLowerCase()} in ${property.location}. Is it a good fit for me?`;

  return (
    <main>
      <Navbar overlay={false} />

      <div className="pt-16 md:pt-20">
        <div className="shell py-8 md:py-12">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex flex-wrap items-center gap-2 text-sm text-stone"
          >
            <Link href="/" className="transition-colors hover:text-ink">
              Home
            </Link>
            <Dot />
            <Link
              href="/#properties"
              className="transition-colors hover:text-ink"
            >
              Properties
            </Link>
            <Dot />
            <span className="text-ink">{property.title}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-3">
            {/* Main column */}
            <div className="space-y-10 lg:col-span-2">
              <Gallery images={property.images} title={property.title} />

              {/* Header */}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-ink px-3 py-1 text-[10px] font-semibold uppercase tracking-label text-paper">
                    {property.purposeLabel}
                  </span>
                  <span className="rounded-full border border-line px-3 py-1 text-[10px] font-semibold uppercase tracking-label text-stone">
                    {property.propertyType}
                  </span>
                </div>

                <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight sm:text-5xl">
                  {property.title}
                </h1>
                <p className="mt-2 text-stone">{property.location}</p>

                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-line py-4">
                  <p className="font-serif text-3xl font-semibold">
                    {property.displayPrice}
                  </p>
                  <span className="hidden text-line sm:inline">|</span>
                  <div className="flex items-center gap-2 text-sm text-stone">
                    {property.bedrooms > 0 && (
                      <>
                        <span>{property.bedrooms} Bed</span>
                        <Dot />
                      </>
                    )}
                    <span>{property.bathrooms} Bath</span>
                    <Dot />
                    <span>{property.size}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <section>
                <h2 className="eyebrow">About this property</h2>
                <p className="mt-4 text-[15px] leading-relaxed text-stone/90">
                  {property.description}
                </p>
              </section>

              {/* Features */}
              <section>
                <h2 className="eyebrow">Features &amp; amenities</h2>
                <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {property.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line text-ink">
                        <Check />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="space-y-4 lg:sticky lg:top-24">
                {/* CTA card */}
                <div className="rounded-2xl border border-line bg-white p-5">
                  <p className="eyebrow">Interested?</p>
                  <p className="mt-2 font-serif text-2xl font-semibold">
                    {property.displayPrice}
                  </p>
                  <p className="mt-1 text-sm text-stone">
                    {property.purposeLabel} · {property.location}
                  </p>
                  <div className="mt-5 flex flex-col gap-2.5">
                    <AskAIButton prompt={askPrompt} className="w-full" />
                    <SaveButton
                      property={savable}
                      variant="pill"
                      size="lg"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Agent card */}
                <div className="rounded-2xl border border-line bg-white p-5">
                  <p className="eyebrow">Your advisor</p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-line">
                      <Image
                        src={property.agent.image}
                        alt={property.agent.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-serif text-lg font-semibold leading-tight">
                        {property.agent.name}
                      </p>
                      <p className="text-sm text-stone">{property.agent.role}</p>
                      <p className="mt-0.5 text-xs text-stone">
                        {property.agent.location} · {property.agent.deals}
                      </p>
                    </div>
                  </div>
                  <Button
                    href="#contact"
                    variant="outline"
                    size="md"
                    className="mt-5 w-full"
                  >
                    Contact {property.agent.name.split(" ")[0]}
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
