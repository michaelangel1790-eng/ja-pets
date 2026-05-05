import { TopNavLinks } from "@/components/top-nav-links";

/**
 * Server Component: הלוגו בטקסט כמו בעיצוב המקורי; תמונת הלוגו הגדולה נשארת ב-Hero.
 */
export function TopNav() {
  return (
    <header
      role="banner"
      aria-label="ראש האתר — ניווט ראשי JACUZZI"
      className="sticky top-0 z-40 border-b border-white/10 bg-brand-black/95 backdrop-blur pt-[max(0px,env(safe-area-inset-top,0px))]"
    >
      <nav
        aria-label="ניווט ראשי"
        className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 py-3 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] md:pl-[max(1.5rem,env(safe-area-inset-left,0px))] md:pr-[max(1.5rem,env(safe-area-inset-right,0px))] lg:max-w-7xl xl:max-w-[88rem]"
      >
        <a
          href="/"
          className="inline-flex shrink-0 items-center no-underline transition-opacity duration-200 hover:opacity-90"
          aria-label="JACUZZI - דף הבית"
        >
          <span className="text-sm font-light tracking-[0.16em] text-[#e6c16a] md:text-base md:tracking-[0.2em]">
            JACUZZI
          </span>
        </a>
        <TopNavLinks />
      </nav>
    </header>
  );
}
