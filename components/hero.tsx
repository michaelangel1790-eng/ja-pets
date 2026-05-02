import Image from "next/image";
import { mainLogoHeight, mainLogoSrc, mainLogoWidth } from "@/lib/site-images";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-4 pt-10 text-white md:px-10 md:pt-12 lg:px-12 lg:pb-6 lg:pt-14">
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
          </div>
        </div>
      </div>
    </section>
  );
}
