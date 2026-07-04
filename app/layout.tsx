import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { SavedProvider } from "@/context/SavedProvider";
import { AIAssistant } from "@/components/AIAssistant";
import { SavedDrawer } from "@/components/SavedDrawer";
import { PostPropertyModal } from "@/components/PostPropertyModal";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Horizon Estate AI — Find a place you will call home",
  description:
    "Tell our AI what you need and get matched with properties that fit your budget, lifestyle, and timeline. Premium property discovery across Pakistan.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable}`}>
      <body className="bg-paper text-ink font-sans antialiased">
        <SavedProvider>
          {children}
          {/* Global overlays — available on every route */}
          <AIAssistant />
          <SavedDrawer />
          <PostPropertyModal />
        </SavedProvider>
      </body>
    </html>
  );
}
