import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-6 py-16 text-center">
      <p className="text-sm font-medium text-neutral-500">404</p>
      <h1 className="mt-2 text-2xl font-bold text-neutral-900">הדף לא נמצא</h1>
      <p className="mt-3 text-neutral-600">
        ייתכן שהקישור ישן או שהדף הוזז. אפשר לחזור לדף הבית או לעבור למפת האתר.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          דף הבית
        </Link>
        <Link href="/site-map" className="text-sm font-semibold text-amber-800 underline-offset-4 hover:underline">
          מפת האתר
        </Link>
      </div>
    </main>
  );
}
