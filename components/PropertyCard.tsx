import Image from "next/image";
import Link from "next/link";
import type { Property } from "@/lib/types";
import { SaveButton } from "./SaveButton";

const Dot = () => <span className="text-stone/40">·</span>;

export function PropertyCard({ property }: { property: Property }) {
  const href = `/properties/${property.id}`;
  const location = `${property.area}, ${property.city}`;
  const label =
    property.tag ?? (property.purpose === "rent" ? "For Rent" : property.propertyType);

  return (
    <article className="group flex flex-col transition-transform duration-300 ease-out hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-line">
        <Link href={href} aria-label={`View ${property.title}`}>
          <Image
            src={property.images[0]}
            alt={property.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </Link>

        {/* One minimal label — a status tag if present, otherwise the type */}
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-paper/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-label text-ink backdrop-blur">
          {label}
        </span>

        <SaveButton
          variant="icon"
          className="absolute right-3 top-3"
          property={{
            id: property.id,
            title: property.title,
            location,
            price: property.displayPrice,
            image: property.images[0],
            beds: property.bedrooms,
            baths: property.bathrooms,
            area: property.size,
          }}
        />
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-xl font-semibold leading-tight">
            <Link href={href} className="transition-opacity hover:opacity-70">
              {property.title}
            </Link>
          </h3>
          <p className="whitespace-nowrap font-serif text-lg font-semibold">
            {property.displayPrice}
          </p>
        </div>
        <p className="mt-1 text-sm text-stone">{location}</p>

        <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-[13px] text-stone">
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

        <Link
          href={href}
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ink underline-offset-4 hover:underline"
        >
          View details
          <span aria-hidden>→</span>
        </Link>
      </div>
    </article>
  );
}
