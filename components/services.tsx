import Image from "next/image";
import { truckPromoNobgSrc } from "@/lib/site-images";

export function Services() {
  return (
    <section id="services" className="mx-auto mt-10 max-w-6xl px-4 md:px-6">
      <div className="section-shell">
        <h2 className="section-title">השירותים שלנו</h2>
        <p className="section-subtitle">שני מסלולים לבחירה לפי הנוחות והתקציב שלכם.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="premium-card flex flex-col overflow-hidden border-[#d4af37]/35">
            <div className="relative h-48 w-full overflow-hidden md:h-52">
              <Image
                src="/images/van-mobile.png"
                alt="רכב מספרה ניידת עד הבית"
                width={1200}
                height={600}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-5">
              <h3 className="text-xl font-extrabold text-jacuzzi-gold">מסלול פלטינום – עד הבית</h3>
              <p className="mt-2 text-neutral-200">נוחות מלאה: אנחנו מגיעים אליכם עם כל הציוד הנדרש.</p>
            </div>
          </article>
          <article className="premium-card flex flex-col overflow-hidden border-pink-500/40">
            <div className="relative flex h-48 w-full items-center justify-center bg-gradient-to-b from-black/60 via-neutral-950 to-neutral-900 md:h-52">
              <Image
                src={truckPromoNobgSrc}
                alt="משאית טיפוח ניידת של JACUZZI"
                width={847}
                height={318}
                className="h-full w-full max-h-full object-contain object-center px-3 py-2 [filter:drop-shadow(0_0_36px_rgba(236,72,153,0.45))_drop-shadow(0_0_56px_rgba(255,255,255,0.08))_drop-shadow(0_4px_14px_rgba(255,255,255,0.15))]"
                unoptimized
              />
            </div>
            <div className="p-5">
              <h3 className="text-xl font-extrabold text-pink-400">מסלול פרימיום – משאית</h3>
              <p className="mt-2 text-neutral-200">מחיר משתלם יותר: אתם מגיעים למשאית במיקום הפעילות.</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
