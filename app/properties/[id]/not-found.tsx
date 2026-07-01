import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";

export default function PropertyNotFound() {
  return (
    <main>
      <Navbar overlay={false} />
      <section className="shell flex min-h-[70vh] flex-col items-center justify-center pt-16 text-center md:pt-20">
        <p className="eyebrow">Error 404</p>
        <h1 className="mt-4 font-serif text-4xl font-semibold sm:text-5xl">
          Property not found
        </h1>
        <p className="mt-4 max-w-md text-stone">
          We couldn’t find that property. It may have been removed, or the link
          might be incorrect.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button href="/#properties" variant="primary" size="lg">
            Browse properties
          </Button>
          <Button href="/" variant="outline" size="lg">
            Back to home
          </Button>
        </div>
      </section>
      <Footer />
    </main>
  );
}
