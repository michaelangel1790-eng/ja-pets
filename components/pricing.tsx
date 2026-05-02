import { pricingPlans } from "@/data/marketing-data";

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto mt-10 max-w-6xl px-4 md:px-6">
      <div className="section-shell">
        <h2 className="section-title">מחירון</h2>
        <p className="section-subtitle">מסלול פלטינום (עד הבית) מול מסלול פרימיום (משאית).</p>
        <div className="premium-card mt-6 overflow-x-auto">
          <table className="min-w-full overflow-hidden rounded-2xl text-right">
            <thead className="border-b border-[#d4af37]/35 bg-gradient-to-l from-[#2a2318]/95 via-[#1a1612]/98 to-[#2a2318]/95 text-jacuzzi-cream">
              <tr>
                <th className="px-4 py-3 font-semibold">משקל</th>
                <th className="px-4 py-3 font-semibold">מסלול פלטינום</th>
                <th className="px-4 py-3 font-semibold">מסלול פרימיום</th>
              </tr>
            </thead>
            <tbody>
              {pricingPlans.map((row) => (
                <tr key={row.size} className="border-t border-white/10 bg-transparent even:bg-white/5">
                  <td className="px-4 py-3 font-medium text-white">{row.size}</td>
                  <td className="px-4 py-3 text-jacuzzi-gold">{row.platinum}</td>
                  <td className="px-4 py-3 text-pink-300">{row.premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-neutral-300">
          * המחיר הסופי נקבע לפי גודל הכלב, מצב הפרווה, קשרים, אופי הכלב וזמן הטיפול
        </p>
      </div>
    </section>
  );
}
