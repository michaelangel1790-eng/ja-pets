import { whatsappLegalConsentLine } from "@/data/site-data";

type WhatsappConsentNoteProps = {
  className?: string;
  /** קומפקטי ליד עמודות צרות (כפתורים בשורה) */
  tight?: boolean;
};

/**
 * הערת הסכמה משפטית עקבית בעיצוב האתר — ליד קישורי וואטסאפ / טפסים.
 */
export function WhatsappConsentNote({ className = "", tight }: WhatsappConsentNoteProps) {
  return (
    <p
      role="note"
      className={`rounded-xl border border-[#d4af37]/28 bg-gradient-to-br from-black/45 via-black/30 to-[#0a1628]/40 px-3 py-2.5 text-[11px] leading-relaxed text-neutral-200/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[2px] md:text-xs ${tight ? "max-w-[min(20rem,100%)]" : "max-w-xl"} ${className}`.trim()}
    >
      <span className="font-semibold text-[#e8cf82]/95">מידע משפטי · </span>
      {whatsappLegalConsentLine}
    </p>
  );
}
