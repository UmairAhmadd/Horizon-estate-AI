import Image from "next/image";
import Link from "next/link";
import type { MatchedProperty } from "@/lib/types";
import { SaveButton } from "./SaveButton";

const Dot = () => <span className="text-stone/40">·</span>;

export function ChatPropertyCard({ property }: { property: MatchedProperty }) {
  return (
    <article className="overflow-hidden rounded-xl border border-line bg-white">
      {/* Body */}
      <div className="flex gap-3 p-2.5">
        <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg bg-line">
          <Image
            src={property.image}
            alt={property.title}
            fill
            sizes="72px"
            className="object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="truncate font-serif text-sm font-semibold leading-tight">
              {property.title}
            </h4>
            <span className="whitespace-nowrap text-sm font-semibold">
              {property.price}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-stone">
            {property.location}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-stone">
            {property.beds > 0 && (
              <>
                <span>{property.beds} Bed</span>
                <Dot />
              </>
            )}
            <span>{property.baths} Bath</span>
            <Dot />
            <span>{property.area}</span>
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="px-2.5">
        <p className="rounded-md bg-ink/[0.04] px-2 py-1 text-[11px] leading-snug text-stone">
          <span className="font-semibold text-ink">Matched because:</span>{" "}
          {property.reason}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 p-2.5">
        <Link
          href={`/properties/${property.id}`}
          className="flex h-8 flex-1 items-center justify-center rounded-full bg-ink text-xs font-semibold text-paper transition-colors hover:bg-ink/85"
        >
          View details
        </Link>
        <SaveButton
          variant="pill"
          className="shrink-0"
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
    </article>
  );
}
