import type { Metadata } from "next";
import { PageWithChrome } from "@/components/page-with-chrome";

export const metadata: Metadata = {
  title: "תנאי שימוש | JACUZZI",
  description: "תנאי השימוש באתר JACUZZI."
};

export default function TermsOfUsePage() {
  return (
    <PageWithChrome mainHeadingId="jacuzzi-page-h1">
      <div className="mx-auto max-w-4xl px-4 pb-24 pt-10 md:px-6">
        <section className="section-shell space-y-5">
          <h1 id="jacuzzi-page-h1" className="section-title">
            תנאי שימוש
          </h1>
          <p className="text-sm leading-7 text-neutral-100 md:text-base">
            השימוש באתר, יצירת קשר עם העסק, קביעת תור או קבלת שירות מהווים הסכמה מלאה לתנאים אלו, למדיניות הפרטיות
            ולמדיניות הביטולים של רשת JACUZZI, גם ללא חתימה פיזית.
          </p>
          <p className="text-sm leading-7 text-neutral-100 md:text-base">
            אם אינכם מסכימים לתנאים, יש להימנע משימוש באתר ומשירותי העסק.
          </p>

          <div className="space-y-2 border-t border-white/10 pt-4 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">שימוש מותר באתר</h2>
            <p>האתר מיועד לקבלת מידע על שירותי העסק וליצירת קשר.</p>
            <p>
              אין לעשות באתר שימוש בלתי חוקי, פוגעני, מטעה, מסחרי בלתי מורשה או כזה העלול לשבש את פעילותו, לפגוע באתר,
              במשתמשים אחרים או בצדדים שלישיים.
            </p>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-4 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">תוכן ומידע באתר</h2>
            <p>
              אנו עושים מאמץ להציג מידע מעודכן ומדויק. עם זאת, ייתכנו טעויות, אי-דיוקים, שינויים, עדכונים או חוסרים,
              והמידע באתר אינו מהווה התחייבות סופית למחיר, לזמינות שירות, לשעת הגעה, למשך טיפול או לתוצאה מסוימת.
            </p>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-4 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">קניין רוחני</h2>
            <p>
              כל הזכויות בתכנים, בעיצוב, בתמונות, בסרטונים, בלוגו, בשם JACUZZI ובכל חומר אחר באתר שמורות לבעלי האתר או
              לבעלי הזכויות שהעניקו הרשאה.
            </p>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-4 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">שירותי העסק</h2>
            <p>
              רשת JACUZZI מספקת שירותי טיפוח לכלבים, לרבות תספורת, רחצה, דילול, טיפול בפרווה, פתיחת קשרים, שיקום וטיפול
              בכלבים חרדתיים, תוקפניים או מורכבים, לפי שיקול דעת מקצועי.
            </p>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-4 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">אחריות הלקוח והכלב</h2>
            <p>
              הלקוח מתחייב למסור מידע מלא, מדויק ואמין לגבי מצב הכלב, לרבות מצב רפואי, רגישויות, מחלות רקע, תרופות,
              התנהגות, חרדה, תוקפנות ונשיכות בעבר.
            </p>
            <p>אי מסירת מידע מהותי או מסירת מידע חלקי/שגוי מהווה אחריות מלאה של הלקוח.</p>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-4 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">חיסונים, בריאות וסיכונים בטיפול</h2>
            <p>הלקוח מתחייב כי הכלב מחוסן ומתחייב לעדכן מראש בכל מצב בריאותי חריג.</p>
            <p>
              הטיפול עשוי לכלול סיכונים טבעיים כגון גירויים, אדמומיות, חתכים שטחיים, תגובות לחומרים, לחץ, חרדה או החמרת
              מצב קיים, במיוחד בכלבים מבוגרים (מעל גיל 8) או כלבים עם מחלות רקע.
            </p>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-4 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">כלבים תוקפניים / מורכבים</h2>
            <p>כלב שנשך בעבר חובה לדווח עליו מראש. הרשת רשאית לסרב לטיפול או להפסיקו בכל שלב.</p>
            <p>טיפול בכלבים מורכבים הוא תהליך, ללא התחייבות להשלמה בפגישה אחת, וכל מפגש יחויב בנפרד.</p>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-4 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">פרווה, קשרים, דילול ושיקום</h2>
            <p>
              במצב פרווה מוזנח או קשרים קשים ייתכן צורך בקיצור משמעותי/גילוח מלא. לא תתקבלנה טענות לגבי תוצאה אסתטית
              כאשר מצב הפרווה מחייב טיפול מקצועי מסוג זה.
            </p>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-4 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">חומרים, פרעושים ותשלומים</h2>
            <p>נעשה שימוש בחומרים מקצועיים. הבאת חומרים מצד הלקוח היא באחריות הלקוח בלבד.</p>
            <p>במקרה של פרעושים/קרציות/טפילים תיתכן תוספת של 50–200 ₪ או הפסקת טיפול.</p>
            <p>התשלום הוא עבור זמן העבודה והשירות המקצועי, ולא עבור תוצאה אסתטית מובטחת.</p>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-4 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">תיעוד, טיפול ללא בעלים וחירום רפואי</h2>
            <p>הטיפול מתבצע ברכב שירות, בדרך כלל ללא נוכחות הבעלים בתוך הרכב.</p>
            <p>הרשת רשאית לצלם את הכלב לצורכי תיעוד, שיווק, בקרה והגנה משפטית.</p>
            <p>במקרה חירום רפואי, תתקבל החלטה מקצועית לפי שיקול דעת הספר/ית, לרבות פנייה לווטרינר.</p>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-4 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">נזקים, חניה, ביטולים והפסקת טיפול</h2>
            <p>נזק לרכב השירות, לציוד או לרכוש שייגרם על ידי הכלב יחויב על חשבון הלקוח.</p>
            <p>
              חובה לספק חניה וגישה סבירה. בהיעדר חניה/גישה, ייתכן מעבר לנקודה חלופית או חיוב בדמי ביקור/ביטול.
            </p>
            <p>לרשת שמורה הזכות להפסיק טיפול או לבטל שירות בכל שלב, לפי שיקול דעת מקצועי ותפעולי.</p>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-4 text-sm leading-7 text-neutral-100 md:text-base">
            <h2 className="text-base font-bold text-jacuzzi-gold">הגבלת אחריות, כוח עליון, דין ושפה</h2>
            <p>האחריות, ככל שתחול, מוגבלת לנזק ישיר בלבד ועד לגובה התשלום ששולם עבור השירות הרלוונטי.</p>
            <p>אין אחריות לעיכובים/שינויים עקב כוח עליון, עומסים, פקקים, תקלות או נסיבות שאינן בשליטת הרשת.</p>
            <p>על תנאים אלה יחולו דיני מדינת ישראל. הנוסח המחייב הוא בעברית בלבד.</p>
          </div>

          <p className="text-xs text-neutral-200">תאריך עדכון התנאים: 26/04/2026</p>
        </section>
      </div>
    </PageWithChrome>
  );
}
