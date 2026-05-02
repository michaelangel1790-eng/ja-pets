import { howItWorksSteps } from "@/data/site-data";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto mt-10 max-w-6xl px-4 md:px-6">
      <div className="section-shell">
        <h2 className="section-title">איך זה עובד?</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {howItWorksSteps.map((step, index) => (
            <article key={step} className="premium-card p-5">
              <p className="inline-flex rounded-full bg-gradient-to-l from-pink-500 to-cyan-400 px-3 py-1 text-xs font-bold text-brand-black">
                שלב {index + 1}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{step}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
