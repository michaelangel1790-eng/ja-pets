import { faqItems } from "@/data/site-data";

export function Faq() {
  return (
    <section id="faq" className="mx-auto mt-10 max-w-6xl px-4 md:px-6">
      <div className="section-shell">
        <h2 className="section-title">שאלות נפוצות</h2>
        <div className="mt-6 space-y-3">
          {faqItems.map((item) => (
            <details key={item.question} className="premium-card p-4">
              <summary className="cursor-pointer list-none text-lg font-semibold text-cyan-200">{item.question}</summary>
              <p className="mt-2 text-neutral-200">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
