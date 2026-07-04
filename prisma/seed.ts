import { PrismaClient } from "@prisma/client";
import { properties } from "../lib/data";

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${properties.length} properties…`);

  for (const p of properties) {
    await prisma.property.upsert({
      where: { id: p.id },
      update: {
        title: p.title,
        city: p.city,
        area: p.area,
        purpose: p.purpose,
        propertyType: p.propertyType,
        salePrice: p.salePrice ?? null,
        monthlyRent: p.monthlyRent ?? null,
        displayPrice: p.displayPrice,
        size: p.size,
        areaSqft: p.areaSqft,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        images: p.images,
        features: p.features,
        description: p.description,
        tag: p.tag ?? null,
      },
      create: {
        id: p.id,
        title: p.title,
        city: p.city,
        area: p.area,
        purpose: p.purpose,
        propertyType: p.propertyType,
        salePrice: p.salePrice ?? null,
        monthlyRent: p.monthlyRent ?? null,
        displayPrice: p.displayPrice,
        size: p.size,
        areaSqft: p.areaSqft,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        images: p.images,
        features: p.features,
        description: p.description,
        tag: p.tag ?? null,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
