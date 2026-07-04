"use client";

import Image from "next/image";
import { useState } from "react";

export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const gallery = images.length > 0 ? images : [""];

  return (
    <div>
      <div className="relative aspect-[16/11] w-full overflow-hidden rounded-2xl bg-line sm:aspect-[16/10]">
        <Image
          src={gallery[active]}
          alt={`${title} — image ${active + 1}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-cover"
        />
      </div>

      {gallery.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
          {gallery.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active}
              className={`relative aspect-[4/3] overflow-hidden rounded-lg transition-opacity ${
                i === active
                  ? "ring-2 ring-ink ring-offset-2 ring-offset-paper"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="22vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
