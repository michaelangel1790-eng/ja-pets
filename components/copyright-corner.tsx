/**
 * שורת זכויות יוצרים דיסקרטית בפינה השמאלית־התחתונה (לא חופפת לכפתורי צף).
 */
export function CopyrightCorner() {
  const year = new Date().getFullYear();

  return (
    <p
      lang="he"
      className="pointer-events-none fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-[max(0.5rem,env(safe-area-inset-left))] z-[25] m-0 max-w-[min(18rem,52vw)] select-none text-left text-xs leading-snug text-amber-600/45 antialiased md:text-[0.8125rem] md:text-amber-600/50"
      dir="ltr"
    >
      © {year} JACUZZI · כל הזכויות שמורות
    </p>
  );
}
