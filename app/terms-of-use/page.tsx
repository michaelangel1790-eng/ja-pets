import type { Metadata } from "next";
import { PageWithChrome } from "@/components/page-with-chrome";

export const metadata: Metadata = {
  title: "תנאי שימוש | JACUZZI",
  description: "תנאי השימוש באתר JACUZZI."
};

export default function TermsOfUsePage() {
  return (
    <PageWithChrome>
      <div className="mx-auto max-w-4xl px-4 pb-24 pt-10 md:px-6">
      <section className="section-shell space-y-5">
        <h1 className="section-title">תנאי שימוש</h1>
        <p className="text-sm leading-7 text-neutral-100 md:text-base">
          השימוש באתר מהווה הסכמה לתנאים אלו. אם אינכם מסכימים לתנאים, יש להימנע משימוש באתר.
        </p>

        <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
          <h2 className="text-base font-bold text-jacuzzi-gold">שימוש מותר באתר</h2>
          <ul className="list-disc space-y-1 pe-6">
            <li>האתר מיועד לקבלת מידע על שירותי העסק וליצירת קשר.</li>
            <li>אין לעשות באתר שימוש בלתי חוקי, פוגעני או כזה העלול לשבש את פעילותו.</li>
          </ul>
        </div>

        <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
          <h2 className="text-base font-bold text-jacuzzi-gold">תוכן ומידע באתר</h2>
          <p>
            אנו עושים מאמץ להציג מידע מעודכן ומדויק. עם זאת, ייתכנו טעויות, אי-דיוקים או שינויים, והמידע באתר אינו
            מהווה התחייבות סופית למחיר או לזמינות שירות.
          </p>
        </div>

        <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
          <h2 className="text-base font-bold text-jacuzzi-gold">קניין רוחני</h2>
          <p>
            כל הזכויות בתכנים, בעיצוב, בתמונות ובסימני המסחר באתר שמורות לבעלי האתר או לבעלי הזכויות שהעניקו הרשאה.
            אין להעתיק, לשכפל או להפיץ תוכן מהאתר ללא אישור מראש.
          </p>
        </div>

        <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
          <h2 className="text-base font-bold text-jacuzzi-gold">הגבלת אחריות</h2>
          <p>
            השימוש באתר הוא באחריות המשתמש בלבד. בעלי האתר לא יישאו באחריות לנזק עקיף או תוצאתי שייגרם כתוצאה משימוש
            באתר או מהסתמכות על מידע המופיע בו.
          </p>
        </div>

        <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
          <h2 className="text-base font-bold text-jacuzzi-gold">אחריות על השירות והכלב</h2>
          <p>
            הלקוח מתחייב למסור מידע מלא ואמין לגבי מצב הכלב, לרבות מצב רפואי, רגישויות והתנהגות.
          </p>
          <p>
            רשת JACUZZI אינה אחראית לתגובות בלתי צפויות של הכלב במהלך הטיפול, לרבות מצבים הנובעים מאופי הכלב או מידע
            שלא נמסר מראש.
          </p>
          <p>
            במקרים מסוימים, לצורך שמירה על בטיחות הכלב והצוות, ייתכן שימוש באמצעי בטיחות, בהתאם לשיקול דעת מקצועי.
          </p>
          <p>
            הטיפול מתבצע תוך הקפדה על רווחת הכלב, אך ייתכנו מצבים חריגים שאינם בשליטת העסק.
          </p>
        </div>

        <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
          <h2 className="text-base font-bold text-jacuzzi-gold">שימוש בתמונות</h2>
          <p>
            ייתכן תיעוד של הכלב במהלך או לאחר הטיפול לצורכי שירות, תיעוד ושיווק.
          </p>
          <p>
            במידה והלקוח אינו מעוניין בשימוש בתמונות, ניתן לעדכן מראש ונכבד זאת באופן מלא.
          </p>
        </div>

        <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
          <h2 className="text-base font-bold text-jacuzzi-gold">תשלומים, מקדמות וביטולים</h2>
          <p>במקרים מסוימים, ייתכן ותידרש מקדמה לצורך שריון תור.</p>
          <p>
            המקדמה אינה ניתנת להחזר בכל מקרה של ביטול, אי הגעה או מצב בו הכלב אינו מאפשר ביצוע טיפול.
          </p>
          <p>ביטול תור בהתראה קצרה או אי הגעה עשויים לגרור חיוב בהתאם לשיקול דעת העסק.</p>
          <p>
            במקרה בו הכלב אינו משתף פעולה, מסכן את הצוות או אינו מאפשר ביצוע טיפול תקין, ייתכן הפסקת טיפול וחיוב
            בדמי ביטול או דמי ביקור.
          </p>
        </div>

        <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
          <h2 className="text-base font-bold text-jacuzzi-gold">מדיניות שירות ותיקונים</h2>
          <p>הלקוח רשאי לבקש תיקונים במהלך זמן הטיפול בלבד.</p>
          <p>
            לאחר סיום הטיפול ועזיבת המקום, לא תינתן אפשרות לתיקונים או שינויים, ולא יינתן החזר כספי מכל סיבה שהיא.
          </p>
          <p>
            אי שביעות רצון אינה מהווה עילה להחזר, כל עוד הטיפול בוצע בהתאם לשיקול דעת מקצועי.
          </p>
        </div>

        <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
          <h2 className="text-base font-bold text-jacuzzi-gold">הפסקת טיפול ושיקול דעת מקצועי</h2>
          <p>
            לצוות JACUZZI שמורה הזכות להפסיק טיפול בכל שלב, במקרים בהם הכלב אינו משתף פעולה, מהווה סיכון או כאשר לא
            מתאפשר לבצע טיפול מקצועי ובטוח.
          </p>
          <p>
            כמו כן, במקרה של אי שיתוף פעולה מצד הלקוח או אי עמידה בהנחיות הצוות, ייתכן ביטול השירות.
          </p>
        </div>

        <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
          <h2 className="text-base font-bold text-jacuzzi-gold">בטיחות מעל הכול</h2>
          <p>שמירה על בטיחות הצוות והכלב הינה בעדיפות עליונה.</p>
          <p>
            בכל מקרה של סיכון, אי שקט קיצוני או התנהגות חריגה, הצוות רשאי לעצור את הטיפול בהתאם לשיקול דעת מקצועי.
          </p>
        </div>

        <div className="space-y-2 text-sm leading-7 text-neutral-100 md:text-base">
          <h2 className="text-base font-bold text-jacuzzi-gold">דין ושיפוט</h2>
          <p>על תנאים אלו יחולו דיני מדינת ישראל, וסמכות השיפוט המקומית תהיה לפי הדין החל.</p>
        </div>

        <p className="text-xs text-neutral-200">תאריך עדכון התנאים: 26/04/2026</p>
      </section>
      </div>
    </PageWithChrome>
  );
}
