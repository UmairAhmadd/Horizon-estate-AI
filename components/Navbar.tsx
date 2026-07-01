"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "./ui/Button";
import { useSaved } from "@/context/SavedProvider";

function SavedButton({ solid }: { solid: boolean }) {
  const { count, openDrawer } = useSaved();
  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label={`Saved properties${count > 0 ? ` (${count})` : ""}`}
      className={`relative flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
        solid ? "text-ink hover:bg-ink/5" : "text-paper hover:bg-paper/10"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path
          d="M6 4h12v16l-6-4-6 4V4z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      {count > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold leading-none text-paper ring-2 ring-paper">
          {count}
        </span>
      )}
    </button>
  );
}

const links = [
  { label: "Properties", href: "#properties" },
  { label: "Mortgage", href: "#mortgage" },
  { label: "Company", href: "#company" },
  { label: "Careers", href: "#careers" },
  { label: "Blog", href: "#blog" },
];

export function Navbar({ overlay = true }: { overlay?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!overlay) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);

  // Lock body scroll when the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // On non-overlay pages (no hero behind), the bar is always solid.
  const solid = !overlay || scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid
          ? "bg-paper/90 backdrop-blur-md border-b border-line"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav className="shell flex h-16 items-center justify-between md:h-20">
        {/* Logo */}
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className={`flex items-baseline gap-[2px] transition-colors ${
            solid ? "text-ink" : "text-paper"
          }`}
          aria-label="Horizon Estate AI home"
        >
          <span className="font-serif text-[22px] font-semibold leading-none tracking-tight md:text-2xl">
            Horizon
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-label opacity-70">
            Estate&nbsp;AI
          </span>
        </Link>

        {/* Desktop links */}
        <ul
          className={`hidden items-center gap-9 text-sm font-medium lg:flex ${
            solid ? "text-ink" : "text-paper/90"
          }`}
        >
          {links.map((l) => (
            <li key={l.label}>
              <Link
                href={l.href}
                className="relative py-1 transition-opacity hover:opacity-60"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-1.5 lg:flex">
          <SavedButton solid={solid} />
          <Button
            href="#post"
            variant={solid ? "primary" : "outline"}
            size="sm"
            className={
              solid
                ? "ml-1.5"
                : "ml-1.5 border-paper/40 text-paper hover:border-paper hover:bg-paper/10"
            }
          >
            Post a property
          </Button>
        </div>

        {/* Mobile cluster */}
        <div className="flex items-center gap-1 lg:hidden">
          <SavedButton solid={solid} />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
              solid ? "text-ink hover:bg-ink/5" : "text-paper hover:bg-paper/10"
            }`}
          >
          <div className="relative h-4 w-5">
            <span
              className={`absolute left-0 top-0 h-[1.5px] w-5 bg-current transition-transform duration-300 ${
                open ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-[7px] h-[1.5px] w-5 bg-current transition-opacity duration-200 ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-[14px] h-[1.5px] w-5 bg-current transition-transform duration-300 ${
                open ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </div>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        className={`overflow-hidden border-t border-line bg-paper transition-[max-height] duration-300 ease-out lg:hidden ${
          open ? "max-h-[70vh]" : "max-h-0"
        }`}
      >
        <ul className="shell flex flex-col py-4 text-ink">
          {links.map((l) => (
            <li key={l.label}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className="block border-b border-line py-4 text-lg font-medium"
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li className="pt-5">
            <Button
              href="#post"
              variant="primary"
              size="lg"
              className="w-full"
            >
              Post a property
            </Button>
          </li>
        </ul>
      </div>
    </header>
  );
}
