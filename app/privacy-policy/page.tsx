import type { Metadata } from "next";
import { PageWithChrome } from "@/components/page-with-chrome";

export const metadata: Metadata = {
  title: "מדיניות פרטיות | JACUZZI",
  description: "מדיניות הפרטיות של אתר JACUZZI."
};

export default function PrivacyPolicyPage() {
  return (
    <PageWithChrome>
      <div className="mx-auto max-w-4xl px-4 pb-24 pt-10 md:px-6">
      <section className="section-shell space-y-5">
        <h1 className="section-title">מדיניות פרטיות</h1>
        <p className="text-sm leading-7 text-neutral-100 md:text-base">
          רשת JACUZZI מכבדת את פרטיות לקוחותיה והגולשים באתר, ורואה חשיבות רבה בשמירה על המידע האישי הנמסר לה.
        </p>
        <p className="text-sm leading-7 text-neutral-100 md:text-base">
          מסמך זה נועד להסביר אילו נתונים נאספים במהלך השימוש באתר ובמסגרת מתן השירות, כיצד נעשה בהם שימוש, ואילו זכויות עומדות למשתמשים.
        </p>

        <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
          <h2 className="text-base font-bold text-jacuzzi-gold">איסוף מידע</h2>
          <p>
            בעת יצירת קשר עם העסק, בין אם באמצעות האתר, וואטסאפ או שיחה טלפונית, ייתכן שייאסף מידע כגון שם, מספר
            טלפון ופרטים רלוונטיים לשירות.
          </p>
          <p>בעת שימוש באתר, יצירת קשר או קבלת שירות, ייתכן וייאסף המידע הבא:</p>
          <ul className="list-disc space-y-1 pe-6">
            <li>שם מלא</li>
            <li>מספר טלפון</li>
            <li>פרטי יצירת קשר, כולל וואטסאפ</li>
            <li>כתובת מגורים לצורך שירות עד הבית</li>
            <li>פרטים הנמסרים במהלך השיחה או ההתכתבות</li>
            <li>היסטוריית שירותים וטיפולים</li>
          </ul>
          <p>בנוסף, ייתכן שייאסף מידע טכני באופן אוטומטי כגון:</p>
          <ul className="list-disc space-y-1 pe-6">
            <li>סוג מכשיר ודפדפן</li>
            <li>כתובת IP</li>
            <li>דפי גלישה באתר</li>
          </ul>
        </div>

        <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
          <h2 className="text-base font-bold text-jacuzzi-gold">מטרות השימוש במידע</h2>
          <p>המידע נאסף ומשמש לצורך:</p>
          <ul className="list-disc space-y-1 pe-6">
            <li>יצירת קשר ומתן שירות</li>
            <li>תיאום תורים</li>
            <li>מתן הצעות מחיר</li>
            <li>תיעוד השירותים שניתנו</li>
            <li>שיפור השירות וחוויית הלקוח</li>
            <li>שליחת עדכונים, הצעות ומידע שיווקי, בכפוף להסכמה</li>
          </ul>
        </div>

        <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
          <h2 className="text-base font-bold text-jacuzzi-gold">תיעוד ושמירת מידע</h2>
          <p>
            המידע נשמר במערכות ניהול לקוחות של העסק, וכן במסגרת תיעוד שיחות והתקשרויות, כולל טלפון ווואטסאפ, לצורך
            ניהול שירות תקין ושיפור איכות השירות.
          </p>
          <p>
            כל פנייה ושירות מתועדים במערכות פנימיות של העסק לצורך ניהול השירות, שיפור חוויית הלקוח ומעקב.
          </p>
        </div>

        <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
          <h2 className="text-base font-bold text-jacuzzi-gold">שימוש בתמונות</h2>
          <p>במהלך השירות ייתכן ויצולמו כלבים לצורכי תיעוד, שיפור השירות ופרסום.</p>
          <p>ייתכן תיעוד של הכלב במהלך השירות. התמונות עשויות לשמש לצורכי שיווק, פרסום והצגת עבודות.</p>
          <p>
            השימוש בתמונות ייעשה תוך שמירה על כבוד הלקוח, ובמידת הצורך תינתן אפשרות ללקוח לבקש שלא לעשות שימוש בתמונות.
          </p>
          <p>הלקוח רשאי לבקש שלא לעשות שימוש בתמונות.</p>
        </div>

        <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
          <h2 className="text-base font-bold text-jacuzzi-gold">מסירת מידע לצדדים שלישיים</h2>
          <p>אנו לא מוכרים מידע אישי לצדדים שלישיים.</p>
          <p>עם זאת, מידע עשוי להיות מועבר במקרים הבאים:</p>
          <ul className="list-disc space-y-1 pe-6">
            <li>לצורך תפעול השירות, כגון ספקי מערכות טכנולוגיות</li>
            <li>כאשר קיימת חובה חוקית</li>
            <li>לצורך הגנה על זכויות העסק</li>
          </ul>
        </div>

        <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
          <h2 className="text-base font-bold text-jacuzzi-gold">שימוש בפרסום וכלים דיגיטליים</h2>
          <p>
            ייתכן שימוש בפלטפורמות כגון Facebook, Instagram ו-TikTok לצורכי פרסום ושיווק.
          </p>
          <p>
            בנוסף, ייתכן שימוש בכלים טכנולוגיים (כגון קוקיז או פיקסלים) לשיפור חוויית המשתמש והתאמת תוכן.
          </p>
          <p>
            האתר עשוי להשתמש בקובצי Cookies ובכלי מדידה ופרסום, כגון פייסבוק, אינסטגרם וטיקטוק, לצורך:
          </p>
          <ul className="list-disc space-y-1 pe-6">
            <li>ניתוח שימוש באתר</li>
            <li>שיפור חוויית המשתמש</li>
            <li>התאמת פרסומות</li>
          </ul>
          <p>המשתמש יכול לשלוט בהגדרות אלו דרך הדפדפן.</p>
        </div>

        <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
          <h2 className="text-base font-bold text-jacuzzi-gold">אבטחת מידע</h2>
          <p>
            אנו נוקטים באמצעי אבטחה סבירים על מנת להגן על המידע האישי, אך אין באפשרותנו להבטיח הגנה מוחלטת מפני גישה
            בלתי מורשית.
          </p>
        </div>

        <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
          <h2 className="text-base font-bold text-jacuzzi-gold">זכויות המשתמש</h2>
          <p>כל משתמש רשאי:</p>
          <ul className="list-disc space-y-1 pe-6">
            <li>לעיין במידע שנשמר עליו</li>
            <li>לבקש תיקון או מחיקה של מידע</li>
            <li>לבקש הסרה מרשימות דיוור</li>
          </ul>
          <p>לשם כך ניתן ליצור קשר בפרטים המופיעים מטה.</p>
        </div>

        <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
          <h2 className="text-base font-bold text-jacuzzi-gold">יצירת קשר</h2>
          <p>לשאלות או בקשות בנושא פרטיות:</p>
          <p>ממונה פניות פרטיות: צוות JACUZZI</p>
          <p>
            טלפון:{" "}
            <a className="font-semibold text-jacuzzi-gold underline underline-offset-4 hover:text-jacuzzi-cream" href="tel:*5297" aria-label="חיוג למוקד JACUZZI">
              *5297
            </a>
          </p>
          <p>
            וואטסאפ:{" "}
            <a
              className="font-semibold text-jacuzzi-gold underline underline-offset-4 hover:text-jacuzzi-cream"
              href="https://wa.me/972505501662"
              target="_blank"
              rel="noreferrer"
              aria-label="פתיחת וואטסאפ ליצירת קשר"
            >
              050-550-1662
            </a>
          </p>
        </div>

        <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
          <h2 className="text-base font-bold text-jacuzzi-gold">עדכון המדיניות</h2>
          <p>מדיניות זו עשויה להתעדכן מעת לעת.</p>
          <p className="text-xs text-neutral-200">תאריך עדכון אחרון: 26/04/2026</p>
        </div>
      </section>
      </div>
    </PageWithChrome>
  );
}
