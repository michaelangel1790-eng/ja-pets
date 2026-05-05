"use client";

import { useState } from "react";

const LEAD_ERROR_ID = "lead-form-error-summary";

export function LeadDetailsSection() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [dogType, setDogType] = useState("");
  const [dogWeight, setDogWeight] = useState("");
  const [service, setService] = useState("תספורת מלאה");
  const [notes, setNotes] = useState("");
  const [privacyApproved, setPrivacyApproved] = useState(false);
  const [termsApproved, setTermsApproved] = useState(false);
  const [cancelPolicyApproved, setCancelPolicyApproved] = useState(false);
  const [marketingApproved, setMarketingApproved] = useState(false);
  const [formError, setFormError] = useState("");

  const serviceOptions = [
    "תספורת מלאה",
    "רחצה וטיפוח",
    "דילול פרווה",
    "גזיזת ציפורניים",
    "התייעצות / הצעת מחיר"
  ];

  const missingRequiredFields = !fullName.trim() || !phone.trim() || !area.trim();
  const missingApprovals = !privacyApproved || !termsApproved || !cancelPolicyApproved || !marketingApproved;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!fullName.trim() || !phone.trim() || !area.trim()) {
      setFormError("נא למלא את כל שדות החובה: שם מלא, מספר טלפון ושכונה / עיר.");
      return;
    }

    if (!privacyApproved || !termsApproved || !cancelPolicyApproved || !marketingApproved) {
      setFormError("יש לאשר את כל הסעיפים לפני שליחת הפרטים.");
      return;
    }

    const whatsappLeadNumber = "972505501662";
    const message = `שלום, אשמח לקבל פרטים / לתאם שירות דרך JACUZZI.

שם מלא: ${fullName.trim()}
טלפון: ${phone.trim()}
שכונה / עיר: ${area.trim()}
סוג הכלב / גזע: ${dogType.trim() || "-"}
משקל הכלב: ${dogWeight.trim() || "-"}
סוג השירות המבוקש: ${service}
הערות נוספות: ${notes.trim() || "-"}

אישורים:
מאשר/ת מדיניות פרטיות
מאשר/ת תנאי שימוש
מאשר/ת מדיניות ביטולים
מאשר/ת קבלת הודעות ועדכונים שיווקיים`;

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
          <p className="text-sm font-bold text-jacuzzi-gold">השאירו פרטים ונחזור אליכם עם מענה מהיר דרך וואטסאפ.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
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
            <div className="space-y-1">
              <label htmlFor="lead-dog-type" className="text-xs font-bold text-jacuzzi-gold">
                סוג הכלב / גזע
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
              <label htmlFor="lead-dog-weight" className="text-xs font-bold text-jacuzzi-gold">
                משקל הכלב
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
              <label htmlFor="lead-service" className="text-xs font-bold text-jacuzzi-gold">
                סוג השירות המבוקש
              </label>
              <select
                id="lead-service"
                name="service"
                value={service}
                onChange={(event) => setService(event.target.value)}
                className="w-full rounded-xl bg-transparent px-3 py-2 text-sm text-white outline-none ring-1 ring-white/25 focus:ring-yellow-300/60"
              >
                {serviceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
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
              אישורים נדרשים לפני שליחה <span className="text-jacuzzi-cream/90">(כל הסעיפים חובה)</span>
            </legend>
            <div className="space-y-2 text-xs text-neutral-200">
              <div className="flex items-start gap-2">
                <input
                  id="lead-privacy"
                  type="checkbox"
                  checked={privacyApproved}
                  onChange={(event) => setPrivacyApproved(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30 bg-transparent accent-yellow-300"
                  aria-required="true"
                  aria-invalid={formError ? missingApprovals && !privacyApproved : undefined}
                />
                <label htmlFor="lead-privacy" className="cursor-pointer">
                  קראתי ואני מאשר/ת את{" "}
                  <a
                    href="/privacy-policy"
                    target="_blank"
                    rel="noreferrer"
                    className="!no-underline bg-transparent font-bold !text-jacuzzi-gold visited:!text-jacuzzi-gold hover:!text-jacuzzi-cream"
                    style={{ color: "#fde68a", WebkitTextFillColor: "#fde68a", backgroundColor: "transparent", textDecoration: "none" }}
                  >
                    מדיניות הפרטיות
                  </a>
                  ,{" "}
                  <a
                    href="/terms-of-use"
                    target="_blank"
                    rel="noreferrer"
                    className="!no-underline bg-transparent font-bold !text-jacuzzi-gold visited:!text-jacuzzi-gold hover:!text-jacuzzi-cream"
                    style={{ color: "#fde68a", WebkitTextFillColor: "#fde68a", backgroundColor: "transparent", textDecoration: "none" }}
                  >
                    תנאי השימוש
                  </a>{" "}
                  ו{" "}
                  <a
                    href="/cancellation-policy"
                    target="_blank"
                    rel="noreferrer"
                    className="!no-underline bg-transparent font-bold !text-jacuzzi-gold visited:!text-jacuzzi-gold hover:!text-jacuzzi-cream"
                    style={{ color: "#fde68a", WebkitTextFillColor: "#fde68a", backgroundColor: "transparent", textDecoration: "none" }}
                  >
                    מדיניות הביטולים
                  </a>
                  .
                </label>
              </div>
              <div className="flex items-start gap-2">
                <input
                  id="lead-terms"
                  type="checkbox"
                  checked={termsApproved}
                  onChange={(event) => setTermsApproved(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30 bg-transparent accent-yellow-300"
                  aria-required="true"
                  aria-invalid={formError ? missingApprovals && !termsApproved : undefined}
                />
                <label htmlFor="lead-terms" className="cursor-pointer">
                  אני מאשר/ת את{" "}
                  <a
                    href="/terms-of-use"
                    target="_blank"
                    rel="noreferrer"
                    className="!no-underline bg-transparent font-bold !text-jacuzzi-gold visited:!text-jacuzzi-gold hover:!text-jacuzzi-cream"
                    style={{ color: "#fde68a", WebkitTextFillColor: "#fde68a", backgroundColor: "transparent", textDecoration: "none" }}
                  >
                    תנאי השימוש
                  </a>
                </label>
              </div>
              <div className="flex items-start gap-2">
                <input
                  id="lead-cancel-policy"
                  type="checkbox"
                  checked={cancelPolicyApproved}
                  onChange={(event) => setCancelPolicyApproved(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30 bg-transparent accent-yellow-300"
                  aria-required="true"
                  aria-invalid={formError ? missingApprovals && !cancelPolicyApproved : undefined}
                />
                <label htmlFor="lead-cancel-policy" className="cursor-pointer">
                  אני מאשר/ת את{" "}
                  <a
                    href="/cancellation-policy"
                    target="_blank"
                    rel="noreferrer"
                    className="!no-underline bg-transparent font-bold !text-jacuzzi-gold visited:!text-jacuzzi-gold hover:!text-jacuzzi-cream"
                    style={{ color: "#fde68a", WebkitTextFillColor: "#fde68a", backgroundColor: "transparent", textDecoration: "none" }}
                  >
                    מדיניות הביטולים
                  </a>
                </label>
              </div>
              <div className="flex items-start gap-2">
                <input
                  id="lead-marketing"
                  type="checkbox"
                  checked={marketingApproved}
                  onChange={(event) => setMarketingApproved(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30 bg-transparent accent-yellow-300"
                  aria-required="true"
                  aria-invalid={formError ? missingApprovals && !marketingApproved : undefined}
                />
                <label htmlFor="lead-marketing" className="cursor-pointer">
                  אני מאשר/ת קבלת הודעות ועדכונים שיווקיים בכפוף לדין
                </label>
              </div>
            </div>
          </fieldset>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-b from-[#e8cf82] to-[#d4af37] px-5 py-2 text-sm font-extrabold text-brand-black shadow-[0_4px_14px_rgba(0,0,0,0.35)] hover:brightness-110"
            >
              שליחת פרטים בוואטסאפ
            </button>
            <p className="text-[11px] leading-5 text-neutral-300">
              שליחת פנייה או קביעת תור מהווה הסכמה לתנאי השימוש, מדיניות הפרטיות ומדיניות הביטולים באתר.
            </p>
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
