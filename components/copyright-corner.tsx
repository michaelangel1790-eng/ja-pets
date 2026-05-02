/**
 * שורת זכויות יוצרים דיסקרטית בפינה השמאלית־התחתונה (לא חופפת לכפתורי צף).
 */
export function CopyrightCorner() {
  const year = new Date().getFullYear();

  return (
    <p
      lang="he"
      className="pointer-events-none fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-[max(0.5rem,env(safe-area-inset-left))] z-[25] m-0 max-w-[min(17rem,46vw)] select-none text-left text-[9px] leading-snug text-amber-600/35 antialiased md:text-[10px] md:text-amber-600/40"
      dir="ltr"
    >
      © {year} JACUZZI · כל הזכויות שמורות
    </p>
  );
}
