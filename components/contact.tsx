import { WhatsappConsentNote } from "@/components/whatsapp-consent-note";
import { phoneNumbers, whatsappMessage, whatsappNumber } from "@/data/site-data";

function WhatsAppMiniIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

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
            <div className="mt-5 flex flex-col gap-3">
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d4af37]/50 bg-gradient-to-b from-[#e8cf82] to-[#c9a227] px-6 py-3 font-extrabold text-brand-black shadow-[0_6px_18px_rgba(0,0,0,0.35)] transition hover:brightness-110"
              >
                <WhatsAppMiniIcon className="h-5 w-5 shrink-0 text-brand-black/90" />
                מעבר לוואטסאפ
              </a>
              <WhatsappConsentNote tight />
            </div>
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
