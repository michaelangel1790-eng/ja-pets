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
            מסמך זה נועד להסביר אילו נתונים נאספים במהלך השימוש באתר ובמסגרת מתן השירות, כיצד נעשה בהם שימוש, היכן
            המידע עשוי להישמר, לאילו מטרות הוא משמש, ואילו זכויות עומדות למשתמשים.
          </p>
          <p className="text-sm leading-7 text-neutral-100 md:text-base">
            עצם השימוש באתר, יצירת קשר עם העסק, שליחת פרטים, התכתבות בוואטסאפ, שיחה טלפונית, קביעת תור או קבלת שירות
            מהווים הסכמה למדיניות פרטיות זו, בכפוף לכל דין.
          </p>

          <div className="space-y-2 border-t border-white/10 pt-4 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">איסוף מידע</h2>
            <p>
              בעת יצירת קשר עם העסק, בין אם באמצעות האתר, וואטסאפ, שיחה טלפונית, רשתות חברתיות או כל אמצעי תקשורת אחר,
              ייתכן שייאסף מידע כגון שם, מספר טלפון ופרטים רלוונטיים לצורך מתן השירות.
            </p>
            <p>בעת שימוש באתר, יצירת קשר או קבלת שירות, ייתכן וייאסף המידע הבא:</p>
            <ul className="list-disc space-y-1 pe-6">
              <li>שם מלא</li>
              <li>מספר טלפון</li>
              <li>פרטי יצירת קשר, כולל וואטסאפ</li>
              <li>כתובת מגורים או כתובת הגעה לצורך שירות עד הבית</li>
              <li>פרטים הנמסרים במהלך שיחה, התכתבות או תיאום השירות</li>
              <li>פרטי הכלב, לרבות גזע/סוג, גיל, גודל, מצב פרווה ומידע רלוונטי לשירות</li>
              <li>מידע רפואי או התנהגותי שנמסר על ידי הלקוח</li>
              <li>היסטוריית שירותים וטיפולים</li>
              <li>תמונות וסרטונים של הכלב לפני, במהלך או לאחר הטיפול</li>
              <li>הצעות מחיר, תיעוד תורים, תיעוד ביטולים ותיעוד שירות</li>
            </ul>
            <p>בנוסף, ייתכן שייאסף מידע טכני באופן אוטומטי כגון:</p>
            <ul className="list-disc space-y-1 pe-6">
              <li>סוג מכשיר ודפדפן</li>
              <li>כתובת IP</li>
              <li>דפי גלישה באתר</li>
              <li>נתוני שימוש באתר</li>
              <li>קובצי Cookies וכלי מדידה דיגיטליים</li>
            </ul>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-4 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">מטרות השימוש במידע</h2>
            <p>המידע נאסף ומשמש לצורך:</p>
            <ul className="list-disc space-y-1 pe-6">
              <li>יצירת קשר ומתן שירות</li>
              <li>תיאום תורים</li>
              <li>מתן הצעות מחיר</li>
              <li>ניהול לקוחות</li>
              <li>תיעוד השירותים שניתנו</li>
              <li>שיפור השירות וחוויית הלקוח</li>
              <li>בקרה פנימית ושיפור איכות השירות</li>
              <li>טיפול בפניות, תלונות או מחלוקות</li>
              <li>הגנה על זכויות העסק</li>
              <li>ניהול יומן תורים ותפעול השירות</li>
              <li>שליחת עדכונים, הצעות ומידע שיווקי, בכפוף להסכמה ובהתאם לדין</li>
            </ul>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-4 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">תיעוד ושמירת מידע</h2>
            <p>
              המידע נשמר במערכות ניהול לקוחות של העסק, וכן במסגרת תיעוד שיחות והתקשרויות, כולל טלפון, וואטסאפ, הודעות,
              תמונות, סרטונים והיסטוריית שירות, לצורך ניהול שירות תקין, שיפור איכות השירות, מעקב, בקרה והגנה על זכויות העסק.
            </p>
            <p>
              המידע עשוי להישמר גם במערכות צד שלישי המשמשות את העסק, לרבות מערכות CRM, מערכות וואטסאפ ותקשורת, מערכות
              אחסון, מערכות דיוור, מערכות סליקה, מערכות פרסום וכלים אנליטיים, בהתאם לצורך תפעולי ולפי דין.
            </p>
            <p>
              בקשה למחיקת מידע תיבחן בהתאם להוראות הדין. ייתכן שמידע מסוים יישמר גם לאחר בקשת מחיקה, ככל שהדבר נדרש
              לצורך תיעוד עסקי, חיובים, הגנה משפטית, טיפול במחלוקות, עמידה בדרישות חוק או שמירה על זכויות העסק.
            </p>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-4 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">שימוש בתמונות</h2>
            <p>במהלך השירות ייתכן ויצולמו כלבים לצורכי תיעוד, שיפור השירות, בקרה, פרסום, שיווק והצגת עבודות.</p>
            <p>
              ייתכן תיעוד של הכלב לפני, במהלך ולאחר השירות. התמונות עשויות לשמש לצורכי שיווק, פרסום, הצגת עבודות לפני/אחרי,
              תיעוד מקצועי והגנה על זכויות העסק במקרה של מחלוקת.
            </p>
            <p>
              השימוש בתמונות ייעשה תוך שמירה על כבוד הלקוח. במידה והלקוח אינו מעוניין בשימוש בתמונות לצורכי שיווק או
              פרסום, עליו לעדכן את העסק מראש, והבקשה תכובד.
            </p>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-4 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">מסירת מידע לצדדים שלישיים</h2>
            <p>אנו לא מוכרים מידע אישי לצדדים שלישיים.</p>
            <p>עם זאת, מידע עשוי להיות מועבר לצורך תפעול השירות, לפי חובה חוקית, להגנה על זכויות העסק ולפי צורך משפטי.</p>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-4 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">שימוש בפרסום וכלים דיגיטליים</h2>
            <p>ייתכן שימוש בפלטפורמות כגון Facebook, Instagram ו-TikTok לצורכי פרסום ושיווק.</p>
            <p>
              בנוסף, ייתכן שימוש בכלים טכנולוגיים כגון Cookies, פיקסלים, כלי מדידה וכלים אנליטיים לשיפור חוויית המשתמש,
              התאמת תוכן, מדידת ביצועים, ניתוח שימוש באתר והתאמת פרסומות.
            </p>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-4 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">אבטחת מידע</h2>
            <p>
              אנו נוקטים באמצעי אבטחה סבירים על מנת להגן על המידע האישי, אך אין באפשרותנו להבטיח הגנה מוחלטת מפני גישה
              בלתי מורשית, תקלות, מתקפות סייבר או אירועים שאינם בשליטתנו.
            </p>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-4 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">זכויות המשתמש</h2>
            <p>כל משתמש רשאי, בכפוף לדין:</p>
            <ul className="list-disc space-y-1 pe-6">
              <li>לעיין במידע שנשמר עליו</li>
              <li>לבקש תיקון מידע שאינו מדויק</li>
              <li>לבקש מחיקה של מידע, ככל שהדבר אפשרי לפי דין</li>
              <li>לבקש הסרה מרשימות דיוור</li>
              <li>לבקש הפסקת שימוש בתמונות לצורכי שיווק עתידי</li>
            </ul>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-4 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">יצירת קשר</h2>
            <p>לשאלות או בקשות בנושא פרטיות:</p>
            <p>ממונה פניות פרטיות: צוות JACUZZI</p>
            <p>
              טלפון:{" "}
              <a
                className="font-semibold text-jacuzzi-gold underline underline-offset-4 hover:text-jacuzzi-cream"
                href="tel:*5297"
                aria-label="חיוג למוקד JACUZZI"
              >
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

          <div className="space-y-2 border-t border-white/10 pt-4 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">עדכון המדיניות</h2>
            <p>מדיניות זו עשויה להתעדכן מעת לעת, בהתאם לשינויים בשירות, באתר, בדרישות החוק או בצרכים התפעוליים של העסק.</p>
            <p className="text-xs text-neutral-200">תאריך עדכון אחרון: 26/04/2026</p>
          </div>
        </section>
      </div>
    </PageWithChrome>
  );
}
