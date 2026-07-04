import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { FeaturedProperties } from "@/components/FeaturedProperties";
import { TrustStats } from "@/components/TrustStats";
import { Showcase } from "@/components/Showcase";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main>
      {/* Light nav over the soft-gradient hero */}
      <Navbar overlay={false} />
      <Hero />
      <FeaturedProperties />
      <TrustStats />
      <Showcase />
      <Footer />
    </main>
  );
}
