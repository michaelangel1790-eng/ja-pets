import Image from "next/image";
import { mainLogoHeight, mainLogoSrc, mainLogoWidth } from "@/lib/site-images";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-4 pt-10 text-white md:px-10 md:pt-12 lg:px-12 lg:pb-6 lg:pt-14">
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <span className="ambient-bubble ambient-bubble--md ambient-bubble--vivid" style={{ top: "12%", left: "9%", animationDelay: "-4s" }} />
        <span className="ambient-bubble ambient-bubble--lg ambient-bubble--glow ambient-bubble--vivid" style={{ top: "20%", right: "11%", animationDelay: "-10s" }} />
        <span className="ambient-bubble ambient-bubble--sm ambient-bubble--vivid" style={{ top: "66%", left: "22%", animationDelay: "-7s" }} />
      </div>
      <div className="relative mx-auto flex max-w-6xl justify-center lg:max-w-7xl xl:max-w-[88rem]">
        <div className="relative overflow-visible px-3 py-2 md:px-4 md:py-3 lg:px-6">
          <div className="rounded-2xl bg-black px-5 py-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] md:rounded-3xl md:px-10 md:py-7 lg:px-12 lg:py-9">
            <Image
              src={mainLogoSrc}
              alt="לוגו JACUZZI"
              width={mainLogoWidth}
              height={mainLogoHeight}
              className="mx-auto h-[10.5rem] w-auto max-w-[min(96vw,680px)] object-contain md:h-44 md:max-w-[min(96vw,820px)] lg:h-[13rem] lg:max-w-[min(94vw,920px)] xl:h-[14rem] xl:max-w-[min(94vw,1000px)]"
              priority
              unoptimized
            />
            <h1
              id="jacuzzi-main-page-title"
              className="mx-auto mt-5 max-w-[min(96vw,34rem)] text-center text-base font-semibold leading-snug tracking-wide text-neutral-100 md:mt-7 md:text-xl md:leading-relaxed"
            >
              מספרת כלבים ניידת ומשאית טיפוח בירושלים
            </h1>
          </div>
        </div>
      </div>
    </section>
  );
}
