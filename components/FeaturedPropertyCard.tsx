import Image from "next/image";
import Link from "next/link";
import type { Property } from "@/lib/types";
import { SaveButton } from "./SaveButton";

const SpecDot = () => <span className="text-stone/50">·</span>;

export function FeaturedPropertyCard({ property }: { property: Property }) {
  const href = `/properties/${property.id}`;

  return (
    <article className="w-full max-w-sm rounded-2xl border border-line bg-paper/95 p-3 shadow-[0_20px_60px_-25px_rgba(10,10,10,0.35)] backdrop-blur-md">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
        <Link href={href} aria-label={`View ${property.title}`}>
          <Image
            src={property.image}
            alt={property.title}
            fill
            sizes="(max-width: 768px) 90vw, 380px"
            className="object-cover"
          />
        </Link>
        {property.tag && (
          <span className="absolute left-3 top-3 rounded-full bg-paper/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-label text-ink">
            {property.tag}
          </span>
        )}
        <SaveButton
          variant="icon"
          className="absolute right-3 top-3"
          property={{
            id: property.id,
            title: property.title,
            location: property.location,
            price: property.price,
            image: property.image,
            beds: property.beds,
            baths: property.baths,
            area: property.area,
          }}
        />
      </div>

      <div className="px-2 pb-1 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-lg font-semibold leading-tight">
              <Link href={href} className="transition-opacity hover:opacity-70">
                {property.title}
              </Link>
            </h3>
            <p className="mt-0.5 text-sm text-stone">{property.location}</p>
          </div>
          <p className="whitespace-nowrap font-serif text-lg font-semibold">
            {property.price}
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-[13px] text-stone">
          <span>{property.beds} Bed</span>
          <SpecDot />
          <span>{property.baths} Bath</span>
          <SpecDot />
          <span>{property.area}</span>
        </div>
      </div>
    </article>
  );
}
