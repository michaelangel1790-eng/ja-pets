import { WhatsAppExternalLink } from "@/components/external-link";
import { phoneNumbers, whatsappMessage } from "@/data/site-data";

export function Contact() {
  return (
    <section id="contact" className="mx-auto mb-14 mt-10 max-w-6xl px-4 md:px-6">
      <div className="section-shell gold-ring">
        <h2 className="section-title">יצירת קשר</h2>
        <p className="section-subtitle">טופס UI בלבד כרגע, ללא חיבור לשרת.</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="premium-card p-5">
            <p className="text-lg font-semibold text-jacuzzi-gold">רוצים לקבוע תור מהר? דברו איתנו:</p>
            <ul className="mt-3 space-y-2 text-neutral-200">
              <li>
                <a href="tel:*5297" className="font-bold text-jacuzzi-gold hover:text-jacuzzi-cream">
                  {phoneNumbers.main}
                </a>
              </li>
              <li>
                <a href="tel:0505501662" className="font-bold text-jacuzzi-gold hover:text-jacuzzi-cream">
                  {phoneNumbers.mobileVan}
                </a>
              </li>
              <li>
                <a href="tel:0512952929" className="font-bold text-jacuzzi-gold hover:text-jacuzzi-cream">
                  {phoneNumbers.truck}
                </a>
              </li>
            </ul>
            <WhatsAppExternalLink
              message={whatsappMessage}
              className="mt-5 inline-flex rounded-full border border-[#d4af37]/45 bg-gradient-to-b from-[#e8cf82] to-[#c9a227] px-6 py-3 font-extrabold text-brand-black shadow-[0_6px_18px_rgba(0,0,0,0.35)] hover:brightness-110"
            >
              מעבר לוואטסאפ
            </WhatsAppExternalLink>
          </div>

          <form className="premium-card space-y-3 p-5">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-jacuzzi-gold">שם מלא</span>
              <input className="w-full rounded-xl border border-[#d4af37]/35 bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-[#d4af37]/70" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-jacuzzi-gold">טלפון</span>
              <input className="w-full rounded-xl border border-[#d4af37]/35 bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-[#d4af37]/70" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-jacuzzi-gold">הודעה</span>
              <textarea
                rows={4}
                className="w-full rounded-xl border border-[#d4af37]/35 bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-[#d4af37]/70"
              />
            </label>
            <button
              type="button"
              className="w-full rounded-xl border border-[#d4af37]/40 bg-gradient-to-b from-[#e8cf82] to-[#c9a227] px-4 py-3 font-bold text-brand-black shadow-inner transition hover:brightness-110"
            >
              שליחת פנייה
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
