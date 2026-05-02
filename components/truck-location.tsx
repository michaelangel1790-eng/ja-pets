import Image from "next/image";
import { truckMonthlyLocations } from "@/data/marketing-data";
import { truckPromoNobgSrc } from "@/lib/site-images";

export function TruckLocation() {
  const current = truckMonthlyLocations[0];

  return (
    <section id="location" className="mx-auto mt-10 max-w-6xl px-4 md:px-6">
      <div className="section-shell bg-gradient-to-l from-brand-black to-neutral-900 text-white">
        <h2 className="section-title text-white">איפה המשאית החודש?</h2>
        <p className="section-subtitle text-neutral-300">המידע מגיע מקובץ JSON שניתן לעריכה מהירה.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-[1.3fr_1fr]">
          <div className="overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-b from-black/55 via-neutral-950 to-neutral-900 shadow-soft">
            <div className="relative flex min-h-[13rem] w-full items-center justify-center px-4 py-5 md:min-h-[14rem] md:py-6">
              <Image
                src={truckPromoNobgSrc}
                alt="משאית הטיפוח של JACUZZI"
                width={847}
                height={318}
                className="h-auto w-full max-w-full object-contain object-center [filter:drop-shadow(0_0_28px_rgba(236,72,153,0.35))_drop-shadow(0_8px_24px_rgba(0,0,0,0.35))]"
                unoptimized
              />
            </div>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
            <p className="text-lg font-semibold">תאריך: {current.date}</p>
            <p className="mt-2 text-sm text-neutral-200">אזור: {current.area}</p>
            <p className="mt-1 text-sm text-neutral-200">כתובת: {current.address}</p>
            <p className="mt-1 text-sm text-neutral-200">שעות: {current.hours}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
