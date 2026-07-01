import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { SearchFilters } from "@/components/SearchFilters";
import { FeaturedProperties } from "@/components/FeaturedProperties";
import { TrustStats } from "@/components/TrustStats";
import { Agents } from "@/components/Agents";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <SearchFilters />
      <FeaturedProperties />
      <TrustStats />
      <Agents />
      <Footer />
    </main>
  );
}
