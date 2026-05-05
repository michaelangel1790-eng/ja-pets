"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "@/components/external-link";
import { whatsappLegalConsentLine } from "@/data/site-data";

const LEAD_ERROR_ID = "lead-form-error-summary";

export function LeadDetailsSection() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [area, setArea] = useState("");
  const [dogName, setDogName] = useState("");
  const [dogType, setDogType] = useState("");
  const [dogAge, setDogAge] = useState("");
  const [dogWeight, setDogWeight] = useState("");
  const [service, setService] = useState("תספורת מלאה");
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const serviceDropdownRef = useRef<HTMLDivElement>(null);
  /** אישור חד־משמעי למסמכים המשפטיים (פרטיות + תנאים + ביטולים) */
  const [legalDocsApproved, setLegalDocsApproved] = useState(false);
  /** שיווק — רשות בלבד */
  const [marketingApproved, setMarketingApproved] = useState(false);
  const [formError, setFormError] = useState("");

  const serviceOptions = [
    "תספורת מלאה",
    "רחצה וטיפוח",
    "דילול פרווה",
    "גזיזת ציפורניים",
    "התייעצות / הצעת מחיר"
  ];

  useEffect(() => {
    if (!serviceMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setServiceMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [serviceMenuOpen]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(e.target as Node)) {
        setServiceMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const missingRequiredFields = !fullName.trim() || !phone.trim() || !area.trim();
  const missingLegalApproval = !legalDocsApproved;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!fullName.trim() || !phone.trim() || !area.trim()) {
      setFormError("נא למלא את כל שדות החובה: שם מלא, מספר טלפון ושכונה / עיר.");
      return;
    }

    if (!legalDocsApproved) {
      setFormError("יש לאשר את מדיניות הפרטיות, תנאי השימוש ומדיניות הביטולים לפני השליחה.");
      return;
    }

    const whatsappLeadNumber = "972505501662";
    const message = `היי JACUZZI,

פרטים מהאתר — תיאום טיפוח.

פרטי לקוח
שם מלא: ${fullName.trim()}
טלפון: ${phone.trim()}
כתובת: ${streetAddress.trim() || "—"}
אזור מגורים: ${area.trim()}

פרטי הכלב
גזע: ${dogType.trim() || "—"}
גיל (בערך): ${dogAge.trim() || "—"}
משקל משוער: ${dogWeight.trim() || "—"}
שם הכלב: ${dogName.trim() || "—"}

שירות: ${service}

הערות: ${notes.trim() || "—"}

לפי הסימון בטופס, האישורים הנדרשים אושרו לפני השליחה.

תודה!

—
${whatsappLegalConsentLine}`;

    const whatsappUrl = `https://wa.me/${whatsappLeadNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section id="lead-form" className="mx-auto mt-8 max-w-6xl px-3 md:mt-6 md:px-6" aria-labelledby="lead-heading">
      <div className="section-shell">
        <h1 id="lead-heading" className="section-title">
          השארת פרטים
        </h1>
        <form
          onSubmit={handleSubmit}
          className="mt-4 rounded-2xl bg-white/5 p-4"
          aria-describedby={formError ? LEAD_ERROR_ID : undefined}
          noValidate
        >
          <p className="text-sm font-bold text-jacuzzi-gold">
            השאירו פרטים — נחזור עם מענה מהיר בוואטסאפ. נא למלא את פרטי הלקוח ואת פרטי הכלב.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <h3 className="col-span-full text-sm font-extrabold text-cyan-200/95">פרטי לקוח</h3>
            <div className="space-y-1">
              <label htmlFor="lead-full-name" className="text-xs font-bold text-jacuzzi-gold">
                שם מלא <span className="text-jacuzzi-cream/90">(חובה)</span>
              </label>
              <input
                id="lead-full-name"
                type="text"
                name="fullName"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-xl bg-transparent px-3 py-2 text-sm text-white outline-none ring-1 ring-white/25 placeholder:text-neutral-300 focus:ring-yellow-300/60"
                aria-required="true"
                aria-invalid={formError ? missingRequiredFields && !fullName.trim() : undefined}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="lead-phone" className="text-xs font-bold text-jacuzzi-gold">
                מספר טלפון <span className="text-jacuzzi-cream/90">(חובה)</span>
              </label>
              <input
                id="lead-phone"
                type="tel"
                name="phone"
                autoComplete="tel"
                inputMode="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-xl bg-transparent px-3 py-2 text-sm text-white outline-none ring-1 ring-white/25 placeholder:text-neutral-300 focus:ring-yellow-300/60"
                aria-required="true"
                aria-invalid={formError ? missingRequiredFields && !phone.trim() : undefined}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="lead-street" className="text-xs font-bold text-jacuzzi-gold">
                כתובת
              </label>
              <input
                id="lead-street"
                type="text"
                name="streetAddress"
                autoComplete="street-address"
                value={streetAddress}
                onChange={(event) => setStreetAddress(event.target.value)}
                className="w-full rounded-xl bg-transparent px-3 py-2 text-sm text-white outline-none ring-1 ring-white/25 placeholder:text-neutral-300 focus:ring-yellow-300/60"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="lead-area" className="text-xs font-bold text-jacuzzi-gold">
                שכונה / עיר <span className="text-jacuzzi-cream/90">(חובה)</span>
              </label>
              <input
                id="lead-area"
                type="text"
                name="area"
                autoComplete="address-level3"
                value={area}
                onChange={(event) => setArea(event.target.value)}
                className="w-full rounded-xl bg-transparent px-3 py-2 text-sm text-white outline-none ring-1 ring-white/25 placeholder:text-neutral-300 focus:ring-yellow-300/60"
                aria-required="true"
                aria-invalid={formError ? missingRequiredFields && !area.trim() : undefined}
              />
            </div>
            <h3 className="col-span-full mt-1 text-sm font-extrabold text-cyan-200/95">פרטי הכלב</h3>
            <div className="space-y-1">
              <label htmlFor="lead-dog-type" className="text-xs font-bold text-jacuzzi-gold">
                גזע
              </label>
              <input
                id="lead-dog-type"
                type="text"
                name="dogType"
                value={dogType}
                onChange={(event) => setDogType(event.target.value)}
                className="w-full rounded-xl bg-transparent px-3 py-2 text-sm text-white outline-none ring-1 ring-white/25 placeholder:text-neutral-300 focus:ring-yellow-300/60"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="lead-dog-age" className="text-xs font-bold text-jacuzzi-gold">
                גיל (בערך)
              </label>
              <input
                id="lead-dog-age"
                type="text"
                name="dogAge"
                value={dogAge}
                onChange={(event) => setDogAge(event.target.value)}
                className="w-full rounded-xl bg-transparent px-3 py-2 text-sm text-white outline-none ring-1 ring-white/25 placeholder:text-neutral-300 focus:ring-yellow-300/60"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="lead-dog-weight" className="text-xs font-bold text-jacuzzi-gold">
                משקל משוער
              </label>
              <input
                id="lead-dog-weight"
                type="text"
                name="dogWeight"
                value={dogWeight}
                onChange={(event) => setDogWeight(event.target.value)}
                className="w-full rounded-xl bg-transparent px-3 py-2 text-sm text-white outline-none ring-1 ring-white/25 placeholder:text-neutral-300 focus:ring-yellow-300/60"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="lead-dog-name" className="text-xs font-bold text-jacuzzi-gold">
                שם הכלב
              </label>
              <input
                id="lead-dog-name"
                type="text"
                name="dogName"
                value={dogName}
                onChange={(event) => setDogName(event.target.value)}
                className="w-full rounded-xl bg-transparent px-3 py-2 text-sm text-white outline-none ring-1 ring-white/25 placeholder:text-neutral-300 focus:ring-yellow-300/60"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label id="lead-service-label" className="text-xs font-bold text-jacuzzi-gold">
                סוג השירות המבוקש
              </label>
              <div ref={serviceDropdownRef} className="relative">
                <button
                  type="button"
                  id="lead-service"
                  dir="rtl"
                  aria-labelledby="lead-service-label"
                  aria-haspopup="listbox"
                  aria-expanded={serviceMenuOpen}
                  onClick={() => setServiceMenuOpen((o) => !o)}
                  className="flex w-full min-h-[2.75rem] items-center justify-between gap-2 rounded-xl border border-[#d4af37]/45 bg-[#0c1322]/95 px-3 py-2 text-sm text-white shadow-inner outline-none ring-1 ring-white/15 transition hover:border-[#d4af37]/65 focus-visible:ring-2 focus-visible:ring-yellow-300/70"
                >
                  <span className="min-w-0 flex-1 truncate">{service}</span>
                  <span className="shrink-0 text-[#e8cf82]" aria-hidden>
                    {serviceMenuOpen ? "▴" : "▾"}
                  </span>
                </button>
                {serviceMenuOpen ? (
                  <ul
                    role="listbox"
                    dir="rtl"
                    aria-labelledby="lead-service-label"
                    className="absolute left-0 right-0 z-50 mt-1 max-h-52 overflow-auto rounded-xl border border-[#d4af37]/40 bg-[#0c1322] py-1 shadow-[0_12px_40px_rgba(0,0,0,0.45)] ring-1 ring-black/30"
                  >
                    {serviceOptions.map((option) => (
                      <li key={option} role="presentation">
                        <button
                          type="button"
                          role="option"
                          aria-selected={service === option}
                          className={`w-full px-3 py-2.5 text-right text-sm transition hover:bg-white/10 ${
                            service === option ? "bg-[#d4af37]/15 text-[#fde68a]" : "text-neutral-100"
                          }`}
                          onClick={() => {
                            setService(option);
                            setServiceMenuOpen(false);
                          }}
                        >
                          {option}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-1">
            <label htmlFor="lead-notes" className="text-xs font-bold text-jacuzzi-gold">
              הערות נוספות
            </label>
            <textarea
              id="lead-notes"
              name="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              className="w-full rounded-xl bg-transparent px-3 py-2 text-sm text-white outline-none ring-1 ring-white/25 placeholder:text-neutral-300 focus:ring-yellow-300/60"
            />
          </div>

          <fieldset className="mt-4 space-y-2 border-0 p-0">
            <legend className="mb-1 text-xs font-bold text-jacuzzi-gold">
              אישורים לפני שליחה
              <span className="mt-1 block font-normal text-[11px] leading-snug text-jacuzzi-cream/85">
                חובה: אישור מדיניות הפרטיות, תנאי השימוש ומדיניות הביטולים · עדכונים שיווקיים — לבחירה בלבד
              </span>
            </legend>
            <div className="space-y-3 text-xs text-neutral-200">
              <div className="flex items-start gap-2">
                <input
                  id="lead-legal-docs"
                  type="checkbox"
                  checked={legalDocsApproved}
                  onChange={(event) => setLegalDocsApproved(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30 bg-transparent accent-yellow-300"
                  aria-required="true"
                  aria-invalid={formError ? missingLegalApproval && !legalDocsApproved : undefined}
                />
                <label htmlFor="lead-legal-docs" className="cursor-pointer leading-relaxed">
                  קראתי ואני מאשר/ת את{" "}
                  <ExternalLink
                    href="/privacy-policy"
                    className="!no-underline bg-transparent font-bold !text-jacuzzi-gold visited:!text-jacuzzi-gold hover:!text-jacuzzi-cream"
                    style={{ color: "#fde68a", WebkitTextFillColor: "#fde68a", backgroundColor: "transparent", textDecoration: "none" }}
                  >
                    מדיניות הפרטיות
                  </ExternalLink>
                  ,{" "}
                  <ExternalLink
                    href="/terms-of-use"
                    className="!no-underline bg-transparent font-bold !text-jacuzzi-gold visited:!text-jacuzzi-gold hover:!text-jacuzzi-cream"
                    style={{ color: "#fde68a", WebkitTextFillColor: "#fde68a", backgroundColor: "transparent", textDecoration: "none" }}
                  >
                    תנאי השימוש
                  </ExternalLink>
                  {'ו'}
                  <ExternalLink
                    href="/cancellation-policy"
                    className="!no-underline bg-transparent font-bold !text-jacuzzi-gold visited:!text-jacuzzi-gold hover:!text-jacuzzi-cream"
                    style={{ color: "#fde68a", WebkitTextFillColor: "#fde68a", backgroundColor: "transparent", textDecoration: "none" }}
                  >
                    מדיניות הביטולים
                  </ExternalLink>
                  .
                </label>
              </div>
              <div className="flex items-start gap-2">
                <input
                  id="lead-marketing"
                  type="checkbox"
                  checked={marketingApproved}
                  onChange={(event) => setMarketingApproved(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30 bg-transparent accent-yellow-300"
                />
                <label htmlFor="lead-marketing" className="cursor-pointer leading-relaxed">
                  <span className="font-bold text-jacuzzi-gold">אני מאשר/ת</span> קבלת{" "}
                  <span className="font-bold text-[#fde68a]">הודעות ועדכונים שיווקיים</span> בכפוף לדין (לא חובה לשליחת
                  הטופס)
                </label>
              </div>
            </div>
          </fieldset>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-b from-[#e8cf82] to-[#d4af37] px-5 py-2 text-sm font-extrabold text-brand-black shadow-[0_4px_14px_rgba(0,0,0,0.35)] hover:brightness-110"
            >
              שליחת פרטים בוואטסאפ
            </button>
            {formError ? (
              <p
                id={LEAD_ERROR_ID}
                role="alert"
                aria-live="assertive"
                className="max-w-md border-s-4 border-red-400 ps-2 text-xs font-bold text-red-200"
              >
                <span className="visually-hidden">שגיאה: </span>
                {formError}
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
}
