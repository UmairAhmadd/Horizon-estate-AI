import type { Property, Agent, Stat, PropertyDetail } from "./types";

// High-quality real estate placeholder imagery (all ids verified to load).
const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/**
 * HERO IMAGE — the one and only place the hero background is set.
 * Swap by replacing the id string (keep img() + width).
 */
export const HERO_IMAGE = img("photo-1580587771525-78b9dba3b914", 2000);

/** SHOWCASE IMAGE — the cinematic luxury band on the homepage. */
export const SHOWCASE_IMAGE = img("photo-1613490493576-7fde63acd811", 2000);

// Verified image pool (see the image-verification step). Galleries are built
// from this so no listing ever renders a broken image.
const POOL = [
  "photo-1580587771525-78b9dba3b914",
  "photo-1600585154340-be6161a56a0c",
  "photo-1512917774080-9991f1c4c750",
  "photo-1600607687939-ce8a6c25118c",
  "photo-1600566753086-00f18fb6b3ea",
  "photo-1600047509807-ba8f99d2cdde",
  "photo-1568605114967-8130f3a36994",
  "photo-1570129477492-45c003edd2be",
  "photo-1576941089067-2de3c901e126",
  "photo-1600585154526-990dced4db0d",
  "photo-1600566752355-35792bedcfea",
  "photo-1600210492486-724fe5c67fb0",
  "photo-1605276374104-dee2a0ed3cd6",
  "photo-1613977257363-707ba9348227",
  "photo-1512918728675-ed5a9ecdebfd",
  "photo-1493809842364-78817add7ffb",
  "photo-1522708323590-d24dbb6b0267",
  "photo-1560448204-e02f11c3d0e2",
  "photo-1502005229762-cf1b2da7c5d6",
  "photo-1449844908441-8829872d2607",
  "photo-1523217582562-09d0def993a6",
  "photo-1613490493576-7fde63acd811",
];

/** Build a 4-image gallery starting at a pool index (cover first). */
const g = (start: number): string[] =>
  [0, 1, 2, 3].map((k) => img(POOL[(start + k) % POOL.length]));

const HOUSE_FEATURES = [
  "Covered parking",
  "24/7 gated security",
  "Backup power supply",
  "Modular fitted kitchen",
  "Landscaped lawn",
  "High-speed internet ready",
];
const APT_FEATURES = [
  "Lift access",
  "Standby generator",
  "Covered parking",
  "Community security",
  "Modular kitchen",
  "Balcony / city view",
];
const PLOT_FEATURES = [
  "Corner plot",
  "Wide road frontage",
  "Developed sector",
  "Utilities available",
  "Clear title",
  "Ready to build",
];

export const properties: Property[] = [
  /* ------------------------------- Islamabad ----------------------------- */
  {
    id: "isb-g13-5m",
    title: "5 Marla Modern House",
    city: "Islamabad",
    area: "G-13",
    purpose: "buy",
    propertyType: "House",
    salePrice: 19_500_000,
    displayPrice: "PKR 1.95 Cr",
    size: "5 Marla",
    areaSqft: 1125,
    bedrooms: 3,
    bathrooms: 3,
    images: g(1),
    features: HOUSE_FEATURES,
    description:
      "A bright, well-kept 5 marla house in the sought-after G-13 sector — practical room sizes, a modern kitchen, and quick access to the Kashmir Highway. A strong first home within a sensible budget.",
    tag: "Verified",
  },
  {
    id: "isb-g11-10m",
    title: "10 Marla Family House",
    city: "Islamabad",
    area: "G-11",
    purpose: "buy",
    propertyType: "House",
    salePrice: 42_000_000,
    displayPrice: "PKR 4.2 Cr",
    size: "10 Marla",
    areaSqft: 2250,
    bedrooms: 4,
    bathrooms: 4,
    images: g(6),
    features: HOUSE_FEATURES,
    description:
      "Spacious 10 marla home in established G-11, with a double-height lounge, four generous bedrooms, and a private lawn — walking distance to markets and schools.",
  },
  {
    id: "isb-f8-1k",
    title: "1 Kanal Luxury House",
    city: "Islamabad",
    area: "F-8",
    purpose: "buy",
    propertyType: "House",
    salePrice: 115_000_000,
    displayPrice: "PKR 11.5 Cr",
    size: "1 Kanal",
    areaSqft: 4500,
    bedrooms: 5,
    bathrooms: 6,
    images: g(9),
    features: HOUSE_FEATURES,
    description:
      "A statement 1 kanal residence in prime F-8 — floor-to-ceiling glazing, imported fittings, a landscaped garden, and a basement home theatre. Central, prestigious, move-in ready.",
    tag: "Verified",
  },
  {
    id: "isb-dha-10m",
    title: "10 Marla House, DHA Phase 2",
    city: "Islamabad",
    area: "DHA",
    purpose: "buy",
    propertyType: "House",
    salePrice: 55_000_000,
    displayPrice: "PKR 5.5 Cr",
    size: "10 Marla",
    areaSqft: 2250,
    bedrooms: 4,
    bathrooms: 4,
    images: g(12),
    features: HOUSE_FEATURES,
    description:
      "Contemporary 10 marla house in secure, well-planned DHA Phase 2 — open-plan living, a fitted kitchen, and a rooftop terrace with Margalla views.",
  },
  {
    id: "isb-bahria-villa",
    title: "1 Kanal Villa, Bahria Town",
    city: "Islamabad",
    area: "Bahria Town",
    purpose: "buy",
    propertyType: "Villa",
    salePrice: 78_000_000,
    displayPrice: "PKR 7.8 Cr",
    size: "1 Kanal",
    areaSqft: 4500,
    bedrooms: 5,
    bathrooms: 5,
    images: g(14),
    features: HOUSE_FEATURES,
    description:
      "A resort-style villa in Bahria Town with a private pool, landscaped gardens, and a gated community offering parks, dining, and round-the-clock security.",
    tag: "New",
  },
  {
    id: "isb-f8-apt-rent",
    title: "2 Bed Apartment, F-8",
    city: "Islamabad",
    area: "F-8",
    purpose: "rent",
    propertyType: "Apartment",
    monthlyRent: 160_000,
    displayPrice: "PKR 1.6 Lakh/mo",
    size: "1,250 sq ft",
    areaSqft: 1250,
    bedrooms: 2,
    bathrooms: 2,
    images: g(15),
    features: APT_FEATURES,
    description:
      "A modern 2-bed rental in central F-8 — lift building, secure parking, and a bright open living area. Ideal for professionals wanting a central, low-maintenance base.",
  },
  {
    id: "isb-g13-apt-rent",
    title: "3 Bed Apartment, G-13",
    city: "Islamabad",
    area: "G-13",
    purpose: "rent",
    propertyType: "Apartment",
    monthlyRent: 120_000,
    displayPrice: "PKR 1.2 Lakh/mo",
    size: "1,500 sq ft",
    areaSqft: 1500,
    bedrooms: 3,
    bathrooms: 3,
    images: g(16),
    features: APT_FEATURES,
    description:
      "A family-sized 3-bed apartment in G-13 with generator backup, covered parking, and easy access to the metro — comfortable and well within a modest rent budget.",
  },
  {
    id: "isb-dha-penthouse",
    title: "Penthouse, DHA Phase 1",
    city: "Islamabad",
    area: "DHA",
    purpose: "buy",
    propertyType: "Penthouse",
    salePrice: 95_000_000,
    displayPrice: "PKR 9.5 Cr",
    size: "3,000 sq ft",
    areaSqft: 3000,
    bedrooms: 3,
    bathrooms: 4,
    images: g(2),
    features: APT_FEATURES,
    description:
      "A top-floor penthouse in DHA with a wrap-around terrace, panoramic views, and premium finishes throughout — a rare turnkey luxury apartment.",
  },

  /* --------------------------------- Lahore ------------------------------ */
  {
    id: "lhr-dha-1k",
    title: "1 Kanal House, DHA Phase 5",
    city: "Lahore",
    area: "DHA",
    purpose: "buy",
    propertyType: "House",
    salePrice: 90_000_000,
    displayPrice: "PKR 9 Cr",
    size: "1 Kanal",
    areaSqft: 4500,
    bedrooms: 5,
    bathrooms: 6,
    images: g(3),
    features: HOUSE_FEATURES,
    description:
      "An elegant 1 kanal house in DHA Phase 5 — double unit, five bedrooms, a home office, and a landscaped garden on a quiet, tree-lined street.",
    tag: "Verified",
  },
  {
    id: "lhr-gulberg-apt-buy",
    title: "2 Bed Apartment, Gulberg",
    city: "Lahore",
    area: "Gulberg",
    purpose: "buy",
    propertyType: "Apartment",
    salePrice: 32_000_000,
    displayPrice: "PKR 3.2 Cr",
    size: "1,600 sq ft",
    areaSqft: 1600,
    bedrooms: 2,
    bathrooms: 2,
    images: g(17),
    features: APT_FEATURES,
    description:
      "A high-yield 2-bed apartment in the heart of Gulberg — strong rental demand, managed building, and prime commercial surroundings. A solid investment buy.",
    tag: "Investment",
  },
  {
    id: "lhr-bahria-10m",
    title: "10 Marla House, Bahria Town",
    city: "Lahore",
    area: "Bahria Town",
    purpose: "buy",
    propertyType: "House",
    salePrice: 38_000_000,
    displayPrice: "PKR 3.8 Cr",
    size: "10 Marla",
    areaSqft: 2250,
    bedrooms: 4,
    bathrooms: 3,
    images: g(4),
    features: HOUSE_FEATURES,
    description:
      "A tidy 10 marla house in gated Bahria Town Lahore — family-friendly, with parks and amenities nearby and reliable security throughout the community.",
  },
  {
    id: "lhr-johar-5m",
    title: "5 Marla House, Johar Town",
    city: "Lahore",
    area: "Johar Town",
    purpose: "buy",
    propertyType: "House",
    salePrice: 22_000_000,
    displayPrice: "PKR 2.2 Cr",
    size: "5 Marla",
    areaSqft: 1125,
    bedrooms: 3,
    bathrooms: 3,
    images: g(5),
    features: HOUSE_FEATURES,
    description:
      "An affordable 5 marla house in central Johar Town — close to Emporium Mall and Expo Centre, with good schools and hospitals within easy reach.",
  },
  {
    id: "lhr-gulberg-apt-rent",
    title: "2 Bed Apartment, Gulberg",
    city: "Lahore",
    area: "Gulberg",
    purpose: "rent",
    propertyType: "Apartment",
    monthlyRent: 180_000,
    displayPrice: "PKR 1.8 Lakh/mo",
    size: "1,600 sq ft",
    areaSqft: 1600,
    bedrooms: 2,
    bathrooms: 2,
    images: g(18),
    features: APT_FEATURES,
    description:
      "A serviced 2-bed rental in Gulberg with a gym, lift, and secure parking — a polished, central address for professionals.",
  },
  {
    id: "lhr-dha-plot",
    title: "1 Kanal Plot, DHA Phase 6",
    city: "Lahore",
    area: "DHA",
    purpose: "buy",
    propertyType: "Plot",
    salePrice: 65_000_000,
    displayPrice: "PKR 6.5 Cr",
    size: "1 Kanal",
    areaSqft: 4500,
    bedrooms: 0,
    bathrooms: 0,
    images: g(19),
    features: PLOT_FEATURES,
    description:
      "A prime 1 kanal residential plot in DHA Phase 6 — developed sector, wide road, and strong capital appreciation. Ready for your custom build.",
    tag: "Investment",
  },

  /* ------------------------------- Rawalpindi ---------------------------- */
  {
    id: "rwp-bahria-10m",
    title: "10 Marla Family House, Bahria Town",
    city: "Rawalpindi",
    area: "Bahria Town",
    purpose: "buy",
    propertyType: "House",
    salePrice: 41_000_000,
    displayPrice: "PKR 4.1 Cr",
    size: "10 Marla",
    areaSqft: 2250,
    bedrooms: 4,
    bathrooms: 4,
    images: g(7),
    features: HOUSE_FEATURES,
    description:
      "A comfortable 10 marla family house in Bahria Town Rawalpindi — four bedrooms, a large lounge, and a safe, amenity-rich gated community perfect for families.",
    tag: "Verified",
  },
  {
    id: "rwp-dha-5m",
    title: "5 Marla House, DHA",
    city: "Rawalpindi",
    area: "DHA",
    purpose: "buy",
    propertyType: "House",
    salePrice: 24_000_000,
    displayPrice: "PKR 2.4 Cr",
    size: "5 Marla",
    areaSqft: 1125,
    bedrooms: 3,
    bathrooms: 3,
    images: g(8),
    features: HOUSE_FEATURES,
    description:
      "A neat 5 marla house in DHA Rawalpindi — modern elevation, three bedrooms, and quick access to the GT Road and Islamabad.",
  },
  {
    id: "rwp-satellite-7m",
    title: "7 Marla House, Satellite Town",
    city: "Rawalpindi",
    area: "Satellite Town",
    purpose: "buy",
    propertyType: "House",
    salePrice: 28_000_000,
    displayPrice: "PKR 2.8 Cr",
    size: "7 Marla",
    areaSqft: 1575,
    bedrooms: 3,
    bathrooms: 3,
    images: g(10),
    features: HOUSE_FEATURES,
    description:
      "A well-located 7 marla house in established Satellite Town — central, walkable, and close to markets, mosques, and schools.",
  },
  {
    id: "rwp-bahria-apt-rent",
    title: "2 Bed Apartment, Bahria Town",
    city: "Rawalpindi",
    area: "Bahria Town",
    purpose: "rent",
    propertyType: "Apartment",
    monthlyRent: 95_000,
    displayPrice: "PKR 95k/mo",
    size: "1,100 sq ft",
    areaSqft: 1100,
    bedrooms: 2,
    bathrooms: 2,
    images: g(11),
    features: APT_FEATURES,
    description:
      "An affordable 2-bed rental in Bahria Town Rawalpindi — secure community, backup power, and covered parking at a budget-friendly monthly rent.",
  },

  /* --------------------------------- Karachi ----------------------------- */
  {
    id: "khi-dha-house",
    title: "500 sq yd House, DHA Phase 8",
    city: "Karachi",
    area: "DHA",
    purpose: "buy",
    propertyType: "House",
    salePrice: 120_000_000,
    displayPrice: "PKR 12 Cr",
    size: "4,500 sq ft",
    areaSqft: 4500,
    bedrooms: 5,
    bathrooms: 6,
    images: g(13),
    features: HOUSE_FEATURES,
    description:
      "A grand 500 sq yd house in DHA Phase 8 — sea breeze, six baths, a double garage, and premium finishes in Karachi's most prestigious address.",
    tag: "Verified",
  },
  {
    id: "khi-clifton-apt-buy",
    title: "3 Bed Sea-View Apartment, Clifton",
    city: "Karachi",
    area: "Clifton",
    purpose: "buy",
    propertyType: "Apartment",
    salePrice: 45_000_000,
    displayPrice: "PKR 4.5 Cr",
    size: "2,200 sq ft",
    areaSqft: 2200,
    bedrooms: 3,
    bathrooms: 3,
    images: g(20),
    features: APT_FEATURES,
    description:
      "A bright 3-bed apartment in Clifton with uninterrupted sea views, a managed building, and covered parking — a premium coastal home for sale.",
    tag: "Sea view",
  },
  {
    id: "khi-gulshan-apt-buy",
    title: "2 Bed Apartment, Gulshan",
    city: "Karachi",
    area: "Gulshan",
    purpose: "buy",
    propertyType: "Apartment",
    salePrice: 18_000_000,
    displayPrice: "PKR 1.8 Cr",
    size: "1,200 sq ft",
    areaSqft: 1200,
    bedrooms: 2,
    bathrooms: 2,
    images: g(21),
    features: APT_FEATURES,
    description:
      "A value-priced 2-bed apartment in Gulshan-e-Iqbal — practical layout, community security, and excellent connectivity across Karachi.",
  },
  {
    id: "khi-clifton-apt-rent",
    title: "3 Bed Apartment, Clifton",
    city: "Karachi",
    area: "Clifton",
    purpose: "rent",
    propertyType: "Apartment",
    monthlyRent: 250_000,
    displayPrice: "PKR 2.5 Lakh/mo",
    size: "2,000 sq ft",
    areaSqft: 2000,
    bedrooms: 3,
    bathrooms: 3,
    images: g(0),
    features: APT_FEATURES,
    description:
      "A spacious 3-bed rental in Clifton with sea-facing balconies, a gym, and 24/7 security — an upscale furnished-ready home.",
  },
];

/** Kept for reuse (e.g. a featured slot) — the first listing. */
export const featuredProperty: Property = properties[0];

export const agents: Agent[] = [
  {
    id: "a1",
    name: "Ayesha Khan",
    role: "Senior Property Advisor",
    location: "Islamabad",
    deals: "320+ closings",
    image: img("photo-1573496359142-b8d87734a5a2", 600),
  },
  {
    id: "a2",
    name: "Bilal Ahmed",
    role: "Investment Specialist",
    location: "Lahore",
    deals: "260+ closings",
    image: img("photo-1560250097-0b93528c311a", 600),
  },
  {
    id: "a3",
    name: "Sara Malik",
    role: "Luxury Homes Lead",
    location: "Karachi",
    deals: "180+ closings",
    image: img("photo-1580489944761-15a19d654956", 600),
  },
];

export const stats: Stat[] = [
  { value: `${properties.length}`, label: "Demo listings" },
  { value: "4", label: "Cities covered" },
  { value: "Buy & Rent", label: "Handled separately" },
  { value: "24/7", label: "AI concierge" },
];

export const suggestedPrompts: string[] = [
  "5 marla house in Islamabad under 2 crore",
  "Apartment rental under 2 lakh/month",
  "Karachi apartment for sale",
];

/* -------------------------------------------------------------------------- */
/*  Property detail lookup                                                     */
/*                                                                            */
/*  SWAP POINT — replace getPropertyById with a DB/API fetch later. The       */
/*  detail page only depends on this returning a PropertyDetail.              */
/* -------------------------------------------------------------------------- */

const allProperties: Property[] = properties;

/** Used by generateStaticParams to pre-render every detail page. */
export function getAllPropertyIds(): string[] {
  return allProperties.map((p) => p.id);
}

function agentForCity(city: string): Agent {
  return agents.find((a) => a.location === city) ?? agents[0];
}

export function getPropertyById(id: string): PropertyDetail | undefined {
  const p = allProperties.find((x) => x.id === id);
  if (!p) return undefined;
  return {
    ...p,
    location: `${p.area}, ${p.city}`,
    purposeLabel: p.purpose === "rent" ? "For Rent" : "For Sale",
    agent: agentForCity(p.city),
  };
}

/* -------------------------------------------------------------------------- */
/*  Listing search + filtering                                                 */
/*                                                                            */
/*  SWAP POINT — filterProperties is the single data-access seam for the       */
/*  listing page and the AI matcher. Replace its body with a DB/API query      */
/*  later; callers keep working as long as it returns Property[].             */
/* -------------------------------------------------------------------------- */

/** Shared option lists so the homepage and listing filters stay in sync. */
export const filterOptions = {
  locations: ["Islamabad", "Lahore", "Rawalpindi", "Karachi"],
  types: ["House", "Apartment", "Villa", "Penthouse", "Plot"],
  purposes: [
    { label: "Buy", value: "buy" },
    { label: "Rent", value: "rent" },
  ],
  salePrices: [
    { label: "Under 50 Lakh", value: "5000000" },
    { label: "Under 1 Cr", value: "10000000" },
    { label: "Under 2 Cr", value: "20000000" },
    { label: "Under 5 Cr", value: "50000000" },
    { label: "Under 12 Cr", value: "120000000" },
  ],
  rentPrices: [
    { label: "Under 1 Lakh / mo", value: "100000" },
    { label: "Under 1.5 Lakh / mo", value: "150000" },
    { label: "Under 2 Lakh / mo", value: "200000" },
    { label: "Under 3 Lakh / mo", value: "300000" },
  ],
  beds: [
    { label: "1+", value: "1" },
    { label: "2+", value: "2" },
    { label: "3+", value: "3" },
    { label: "4+", value: "4" },
    { label: "5+", value: "5" },
  ],
  sizes: [
    { label: "5 Marla+", value: "1125" },
    { label: "10 Marla+", value: "2250" },
    { label: "1 Kanal+", value: "4500" },
    { label: "2 Kanal+", value: "9000" },
  ],
} as const;

export interface PropertyFilters {
  location?: string; // city name (case-insensitive)
  type?: string; // property type (case-insensitive)
  purpose?: string; // "buy" | "rent"
  /** Max sale price in PKR — only ever compared against salePrice. */
  maxSalePrice?: number;
  /** Max monthly rent in PKR — only ever compared against monthlyRent. */
  maxRent?: number;
  minBeds?: number;
  minAreaSqft?: number;
}

type RawParams = Record<string, string | string[] | undefined>;

/** Turn URL search params into a typed, validated filter object. */
export function parseFilters(params: RawParams): PropertyFilters {
  const one = (key: string): string | undefined => {
    const v = params[key];
    const s = Array.isArray(v) ? v[0] : v;
    return s && s.trim() !== "" ? s : undefined;
  };
  const num = (key: string): number | undefined => {
    const s = one(key);
    const n = s ? Number(s) : NaN;
    return Number.isFinite(n) ? n : undefined;
  };

  return {
    location: one("location"),
    type: one("type"),
    purpose: one("purpose"),
    maxSalePrice: num("salePrice"),
    maxRent: num("rent"),
    minBeds: num("beds"),
    minAreaSqft: num("size"),
  };
}

export function filterProperties(filters: PropertyFilters): Property[] {
  return allProperties.filter((p) => {
    if (filters.location) {
      // Match a city ("islamabad") OR an area/sector ("g-13", "dha", "gulberg"),
      // so an area-only location from the AI still resolves to real listings.
      const loc = filters.location.toLowerCase();
      if (p.city.toLowerCase() !== loc && p.area.toLowerCase() !== loc) {
        return false;
      }
    }
    if (
      filters.type &&
      p.propertyType.toLowerCase() !== filters.type.toLowerCase()
    ) {
      return false;
    }

    if (filters.purpose === "rent" && p.purpose !== "rent") return false;
    if (filters.purpose === "buy" && p.purpose !== "buy") return false;

    // A sale budget only compares against sale listings (and rent vs rent), so
    // rent and sale prices are never mixed.
    if (filters.maxSalePrice !== undefined) {
      if (p.purpose !== "buy") return false;
      if (p.salePrice === undefined || p.salePrice > filters.maxSalePrice) {
        return false;
      }
    }
    if (filters.maxRent !== undefined) {
      if (p.purpose !== "rent") return false;
      if (p.monthlyRent === undefined || p.monthlyRent > filters.maxRent) {
        return false;
      }
    }

    if (filters.minBeds !== undefined && p.bedrooms < filters.minBeds) {
      return false;
    }
    if (filters.minAreaSqft !== undefined && p.areaSqft < filters.minAreaSqft) {
      return false;
    }
    return true;
  });
}
