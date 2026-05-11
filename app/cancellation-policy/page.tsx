import { ExternalLink } from "@/components/external-link";
import { PageWithChrome } from "@/components/page-with-chrome";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata(
  "/cancellation-policy",
  "מדיניות ביטולים",
  "מדיניות ביטולים ותיאום תורים של ג'קוזי — מספרת כלבים בירושלים."
);

export default function CancellationPolicyPage() {
  return (
    <PageWithChrome mainHeadingId="jacuzzi-page-h1">
      <div className="mx-auto max-w-4xl px-4 pb-24 pt-10 md:px-6">
        <section className="section-shell space-y-5">
          <h1 id="jacuzzi-page-h1" className="section-title">
            מדיניות ביטולים
          </h1>
          <p className="text-sm leading-7 text-neutral-100 md:text-base">
            המדיניות נועדה לאפשר שירות הוגן ללקוחות ולניהול יומן תורים יעיל. עצם קביעת התור, אישור התור, שליחת פרטים
            או קבלת שירות מהווים הסכמה מלאה למדיניות זו.
          </p>

          <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">תיאום ושינוי תור</h2>
            <p>ניתן לתאם תור בטלפון או בוואטסאפ.</p>
            <p>בקשות לשינוי מועד תור מומלץ להעביר מוקדם ככל האפשר, על מנת לאפשר זמינות ללקוחות נוספים.</p>
            <p>שינוי מועד כפוף לזמינות בלבד ואינו מובטח.</p>
          </div>

          <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">שריון תור ומקדמות</h2>
            <p>במקרים מסוימים, ייתכן ותידרש מקדמה לצורך שריון תור.</p>
            <p>
              המקדמה אינה ניתנת להחזר בכל מקרה, לרבות ביטול תור, אי הגעה, ביטול מאוחר, שינוי מועד מאוחר, מצב בו הכלב
              אינו מאפשר ביצוע טיפול או כל סיבה אחרת.
            </p>
            <p>המקדמה מהווה דמי התחייבות לשריון הזמן ביומן.</p>
          </div>

          <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">מדיניות ביטולים והגעה</h2>
            <ul className="list-disc space-y-1 pe-6">
              <li>ביטול תור יתבצע בהודעה מראש.</li>
              <li>ביטול פחות מ-24 שעות מראש עשוי לגרור חיוב מלא או דמי ביקור/ביטול.</li>
              <li>אי הגעה או ביטול בהתראה קצרה עשויים לגרור חיוב בהתאם לשיקול דעת העסק.</li>
              <li>במקרה של איחור מצד הלקוח, ייתכן קיצור זמן הטיפול או ביטולו בהתאם ללו"ז.</li>
              <li>ביטול סמוך למועד התור עלול להשפיע על זמינות תורים עתידיים.</li>
            </ul>
          </div>

          <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">ביטול סמוך למועד התור</h2>
            <p>
              ביטול תור ביום שלפני מועד התור או בסמוך אליו עלול לגרור חיוב מלא בגין הטיפול, בהתאם לשיקול דעת העסק.
            </p>
            <p>
              במקרים בהם לקוח מבטל או אינו מגיע לתור מספר פעמים, ייתכן והעסק יסרב לקבוע עבורו תורים עתידיים.
            </p>
            <p>
              החלטות אלו מתקבלות לצורך שמירה על זמינות השירות וניהול תקין של יומן התורים.
            </p>
          </div>

          <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">יציאת צוות ללקוח</h2>
            <p>מרגע יציאת הצוות ללקוח, לא ניתן לבטל את התור ללא חיוב.</p>
            <p>
              אם הלקוח אינו זמין, אינו נמצא, אין חניה/גישה סבירה או לא ניתן לבצע שירות מסיבה התלויה בלקוח — ייגבו דמי
              ביקור/ביטול.
            </p>
          </div>

          <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">דמי ביקור / דמי ביטול</h2>
            <p>דמי ביקור/ביטול מינימליים עומדים על 180 ₪.</p>
            <p>
              דמי ביקור/ביטול עשויים להיגבות במקרים של ביטול מאוחר, אי הגעה, אי אפשרות לבצע טיפול, חוסר חניה/גישה,
              התנהגות כלב מסכנת או מידע מהותי שלא נמסר מראש.
            </p>
          </div>

          <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">אי הגעה / איחור</h2>
            <p>אי הגעה ללא הודעה מראש תיחשב כהפרת תור ועשויה לגרור חיוב.</p>
            <p>
              איחור משמעותי עלול להוביל לביטול התור או קיצור זמן הטיפול, בהתאם לשיקול דעת הצוות.
            </p>
          </div>

          <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">ביטול עקב התנהגות הכלב</h2>
            <p>
              במקרים בהם הכלב אינו משתף פעולה, אינו מאפשר טיפול תקין או מהווה סיכון לצוות, ייתכן הפסקת טיפול.
            </p>
            <p>
              במצבים אלו, ייגבה תשלום בגין דמי ביקור / דמי ביטול (בדרך כלל כ-180 ש"ח לפחות), בהתאם לשיקול דעת העסק.
            </p>
          </div>

          <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">טיפולים מורכבים ופרעושים</h2>
            <p>טיפולים מורכבים עשויים להימשך מספר מפגשים, וכל מפגש יחויב בנפרד.</p>
            <p>במקרה של פרעושים/קרציות/טפילים ייתכן חיוב נוסף של 50–200 ₪ או הפסקת טיפול.</p>
          </div>

          <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">לקוחות עם ביטולים חוזרים</h2>
            <p>
              במקרה של ביטולים חוזרים, אי הגעה או שינויי תורים תדירים, הרשת רשאית לדרוש תשלום מראש או לסרב לשירות עתידי.
            </p>
          </div>

          <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">שיקול דעת מקצועי</h2>
            <p>
              לצוות JACUZZI שמורה הזכות הבלעדית לקבוע האם ניתן לבצע טיפול, להמשיכו או להפסיקו, בהתאם למצב הכלב והתנאים
              בשטח.
            </p>
          </div>

          <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">בטיחות מעל הכול</h2>
            <p>שמירה על בטיחות הצוות והכלב הינה בעדיפות עליונה.</p>
            <p>
              בכל מקרה של סיכון או קושי משמעותי, הצוות רשאי להפסיק את הטיפול באופן מיידי.
            </p>
          </div>

          <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">מדיניות החזרים</h2>
            <p>לא יינתן החזר כספי מכל סיבה שהיא, לרבות אי שביעות רצון.</p>
            <p>
              התשלום הוא עבור זמן העבודה, השירות, ההגעה והצוות — ולא עבור תוצאה אסתטית מובטחת. תיקונים או התאמות יתבצעו
              במהלך זמן הטיפול בלבד.
            </p>
          </div>

          <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">זמן דיווח על טענות</h2>
            <p>טענות או פניות בנוגע לשירות יתקבלו עד 24 שעות ממועד סיום הטיפול בלבד.</p>
          </div>

          <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">ביטול או שינוי מצד הרשת</h2>
            <p>
              רשת JACUZZI רשאית לבטל, לדחות, לשנות או לקצר תור בכל עת לפי שיקול דעתה, ללא צורך בנימוק וללא פיצוי.
            </p>
          </div>

          <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">כוח עליון ועיכובים</h2>
            <p>
              הרשת לא תישא באחריות לעיכובים, שינויי לו"ז או ביטולים הנובעים מנסיבות שאינן בשליטתה, לרבות פקקים, תאונות,
              מזג אוויר, תקלות רכב או כל גורם בלתי צפוי אחר.
            </p>
          </div>

          <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">יצירת קשר</h2>
            <p>
              לשינוי או ביטול תור:{" "}
              <a className="font-semibold text-jacuzzi-gold underline underline-offset-4 hover:text-jacuzzi-cream" href="tel:*5297" aria-label="חיוג לביטול או שינוי תור">
                *5297
              </a>{" "}
              או וואטסאפ{" "}
              <ExternalLink
                className="font-semibold text-jacuzzi-gold underline underline-offset-4 hover:text-jacuzzi-cream"
                href="https://wa.me/972505501662"
                aria-label="פתיחת וואטסאפ לשינוי או ביטול תור"
              >
                050-550-1662
              </ExternalLink>
              .
            </p>
          </div>

          <p className="text-xs text-neutral-200">תאריך עדכון המדיניות: 26/04/2026</p>
        </section>
      </div>
    </PageWithChrome>
  );
}
