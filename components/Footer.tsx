import Link from "next/link";

const columns = [
  {
    title: "Explore",
    links: ["Properties", "New Developments", "Commercial", "Mortgage"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Blog", "Contact"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms", "Cookies"],
  },
];

export function Footer() {
  return (
    <footer id="blog" className="border-t border-line bg-paper">
      {/* Extra bottom padding reserves a safe area so the floating AI widget
          never overlaps footer content. */}
      <div className="shell pt-16 pb-28">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-5">
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-2xl font-semibold tracking-tight">
                Horizon
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-label text-stone">
                Estate&nbsp;AI
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone">
              AI-powered property discovery for buyers, renters, and investors
              across Pakistan. Matched to your budget, lifestyle, and timeline.
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="eyebrow">{col.title}</p>
                <ul className="mt-4 space-y-3">
                  {col.links.map((l) => (
                    <li key={l}>
                      <Link
                        href="#"
                        className="text-sm text-stone transition-colors hover:text-ink"
                      >
                        {l}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-line pt-6 text-xs text-stone sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Horizon Estate AI. All rights reserved.</p>
          <p>Islamabad · Lahore · Karachi</p>
        </div>
      </div>
    </footer>
  );
}
