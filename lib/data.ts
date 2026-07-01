import type { Property, Agent, Stat, PropertyDetail } from "./types";

// High-quality real estate placeholder imagery (rendered grayscale in UI).
const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const HERO_IMAGE = img(
  "photo-1600596542815-ffad4c1539a9",
  1600
);

export const featuredProperty: Property = {
  id: "hp-hero",
  title: "The Margalla Villa",
  location: "F-7, Islamabad",
  city: "Islamabad",
  price: "PKR 12.5 Cr",
  salePrice: 125_000_000,
  beds: 5,
  baths: 6,
  area: "1 Kanal",
  areaSqft: 4500,
  type: "Villa",
  listing: "Buy",
  image: img("photo-1613490493576-7fde63acd811", 900),
  tag: "Featured",
};

export const properties: Property[] = [
  {
    id: "p1",
    title: "Glasshouse Residence",
    location: "DHA Phase 6, Lahore",
    city: "Lahore",
    price: "PKR 9.8 Cr",
    salePrice: 98_000_000,
    beds: 4,
    baths: 5,
    area: "1 Kanal",
    areaSqft: 4500,
    type: "House",
    listing: "Buy",
    image: img("photo-1600585154340-be6161a56a0c"),
    tag: "Verified",
  },
  {
    id: "p2",
    title: "Seaview Sky Apartment",
    location: "Clifton, Karachi",
    city: "Karachi",
    price: "PKR 4.2 Cr",
    salePrice: 42_000_000,
    beds: 3,
    baths: 3,
    area: "2,400 sq ft",
    areaSqft: 2400,
    type: "Apartment",
    listing: "Buy",
    image: img("photo-1512917774080-9991f1c4c750"),
  },
  {
    id: "p3",
    title: "Courtyard Townhouse",
    location: "Bahria Town, Islamabad",
    city: "Islamabad",
    price: "PKR 3.1 Cr",
    salePrice: 31_000_000,
    beds: 3,
    baths: 4,
    area: "10 Marla",
    areaSqft: 2250,
    type: "Townhouse",
    listing: "Buy",
    image: img("photo-1600607687939-ce8a6c25118c"),
    tag: "New",
  },
  {
    id: "p4",
    title: "The Monolith Loft",
    location: "Gulberg, Lahore",
    city: "Lahore",
    price: "PKR 1.8 Lakh / mo",
    monthlyRent: 180_000,
    priceNote: "Rent",
    beds: 2,
    baths: 2,
    area: "1,600 sq ft",
    areaSqft: 1600,
    type: "Apartment",
    listing: "Rent",
    image: img("photo-1600566753086-00f18fb6b3ea"),
  },
  {
    id: "p5",
    title: "Ivory Garden House",
    location: "F-8, Islamabad",
    city: "Islamabad",
    price: "PKR 6.5 Cr",
    salePrice: 65_000_000,
    beds: 4,
    baths: 4,
    area: "14 Marla",
    areaSqft: 3150,
    type: "House",
    listing: "Buy",
    image: img("photo-1600047509807-ba8f99d2cdde"),
    tag: "Verified",
  },
  {
    id: "p6",
    title: "Skyline Commercial Floor",
    location: "I-9, Islamabad",
    city: "Islamabad",
    price: "PKR 22 Cr",
    salePrice: 220_000_000,
    beds: 0,
    baths: 4,
    area: "8,000 sq ft",
    areaSqft: 8000,
    type: "Office",
    listing: "Commercial",
    image: img("photo-1497366754035-f200968a6e72"),
  },
];

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
  { value: "1,200+", label: "Properties listed" },
  { value: "450+", label: "Verified buyers" },
  { value: "98%", label: "Client satisfaction" },
  { value: "24 hrs", label: "Avg. match time" },
];

export const suggestedPrompts: string[] = [
  "I need a 5 marla house in Islamabad",
  "Find an apartment under 80 lakh",
  "Suggest investment properties",
];

export const listingTabs: { label: string; value: string }[] = [
  { label: "Buy", value: "Buy" },
  { label: "Rent", value: "Rent" },
  { label: "New Developments", value: "New Developments" },
  { label: "Commercial", value: "Commercial" },
];

/* -------------------------------------------------------------------------- */
/*  Property detail lookup                                                     */
/*                                                                            */
/*  SWAP POINT — replace getPropertyById with a DB/API fetch later. The       */
/*  detail page only depends on this function returning a PropertyDetail.     */
/* -------------------------------------------------------------------------- */

const allProperties: Property[] = [featuredProperty, ...properties];

/** Used by generateStaticParams to pre-render every detail page. */
export function getAllPropertyIds(): string[] {
  return allProperties.map((p) => p.id);
}

function buildGallery(p: Property): string[] {
  // Placeholder gallery: the hero shot plus a few other listings' imagery.
  const others = allProperties.filter((x) => x.id !== p.id).map((x) => x.image);
  return [p.image, ...others.slice(0, 3)];
}

function purposeLabel(listing: Property["listing"]): string {
  switch (listing) {
    case "Rent":
      return "For Rent";
    case "Commercial":
      return "Commercial";
    case "New Developments":
      return "New Development";
    default:
      return "For Sale";
  }
}

function buildDescription(p: Property): string {
  const bedText = p.beds > 0 ? `${p.beds}-bedroom ` : "";
  return `This ${bedText}${p.type.toLowerCase()} in ${p.location} pairs calm, light-filled interiors with considered detailing throughout. Set across ${p.area}, it offers generous, well-proportioned spaces, quality finishes, and a layout that works as well for quiet everyday living as it does for entertaining. Every Horizon listing is verified and ready to view at a time that suits you.`;
}

function buildFeatures(p: Property): string[] {
  if (p.listing === "Commercial") {
    return [
      "Prime road frontage",
      "Dedicated parking",
      "24/7 security",
      "Backup power",
      "High-speed fibre",
      "Central heating & cooling",
    ];
  }
  return [
    "Covered parking",
    "24/7 gated security",
    "Backup power supply",
    "Modular fitted kitchen",
    "Landscaped outdoor space",
    "High-speed internet ready",
  ];
}

function agentForCity(city: string): Agent {
  return agents.find((a) => a.location === city) ?? agents[0];
}

export function getPropertyById(id: string): PropertyDetail | undefined {
  const p = allProperties.find((x) => x.id === id);
  if (!p) return undefined;
  return {
    ...p,
    gallery: buildGallery(p),
    description: buildDescription(p),
    features: buildFeatures(p),
    purpose: purposeLabel(p.listing),
    agent: agentForCity(p.city),
  };
}

/* -------------------------------------------------------------------------- */
/*  Listing search + filtering                                                 */
/*                                                                            */
/*  SWAP POINT — filterProperties is the single data-access seam for the       */
/*  listing page. Replace its body with a DB/API query later; the page and     */
/*  filter UI keep working as long as it returns Property[].                   */
/* -------------------------------------------------------------------------- */

/** Shared option lists so the homepage and listing filters stay in sync. */
export const filterOptions = {
  locations: ["Islamabad", "Lahore", "Karachi", "Rawalpindi"],
  types: ["House", "Apartment", "Villa", "Townhouse", "Office", "Plot"],
  purposes: [
    { label: "Buy", value: "buy" },
    { label: "Rent", value: "rent" },
  ],
  salePrices: [
    { label: "Under 50 Lakh", value: "5000000" },
    { label: "Under 1 Cr", value: "10000000" },
    { label: "Under 5 Cr", value: "50000000" },
    { label: "Under 25 Cr", value: "250000000" },
  ],
  rentPrices: [
    { label: "Under 50k / mo", value: "50000" },
    { label: "Under 1 Lakh / mo", value: "100000" },
    { label: "Under 2 Lakh / mo", value: "200000" },
    { label: "Under 5 Lakh / mo", value: "500000" },
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

const isRental = (p: Property) => p.listing === "Rent";

export function filterProperties(filters: PropertyFilters): Property[] {
  return allProperties.filter((p) => {
    if (
      filters.location &&
      p.city.toLowerCase() !== filters.location.toLowerCase()
    ) {
      return false;
    }
    if (filters.type && p.type.toLowerCase() !== filters.type.toLowerCase()) {
      return false;
    }

    if (filters.purpose === "rent" && !isRental(p)) return false;
    if (filters.purpose === "buy" && isRental(p)) return false;

    // A sale budget only ever compares against sale listings (and vice versa),
    // so rent and sale prices are never mixed.
    if (filters.maxSalePrice !== undefined) {
      if (isRental(p)) return false;
      if (p.salePrice === undefined || p.salePrice > filters.maxSalePrice) {
        return false;
      }
    }
    if (filters.maxRent !== undefined) {
      if (!isRental(p)) return false;
      if (p.monthlyRent === undefined || p.monthlyRent > filters.maxRent) {
        return false;
      }
    }

    if (filters.minBeds !== undefined && p.beds < filters.minBeds) {
      return false;
    }
    if (filters.minAreaSqft !== undefined && p.areaSqft < filters.minAreaSqft) {
      return false;
    }
    return true;
  });
}
