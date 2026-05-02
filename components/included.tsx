import { includedItems } from "@/data/site-data";

export function Included() {
  return (
    <section id="included" className="mx-auto mt-10 max-w-6xl px-4 md:px-6">
      <div className="section-shell">
        <h2 className="section-title">מה כלול בטיפול</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {includedItems.map((item) => (
            <article key={item} className="premium-card p-4 text-center">
              <p className="font-semibold text-white">{item}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
