"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { galleryItems, type GalleryCategory, type GalleryItem } from "@/data/marketing-data";

const categories: GalleryCategory[] = ["הכל", "תספורות", "דילול", "מקלחות"];

export function GallerySection() {
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>("הכל");
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  const filteredItems = useMemo(() => {
    if (activeCategory === "הכל") {
      return galleryItems;
    }

    return galleryItems.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  return (
    <section id="gallery" dir="rtl" className="mx-auto mt-10 max-w-6xl px-4 md:px-6">
      <div className="section-shell">
        <h2 className="section-title">גלריה</h2>
        <p className="section-subtitle">אפשר לסנן לפי סוג טיפול ולראות עבודות לדוגמה.</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {categories.map((category) => {
            const isActive = activeCategory === category;

            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  isActive
                    ? "bg-gradient-to-l from-pink-500 to-cyan-400 text-brand-black"
                    : "bg-white/10 text-cyan-100 hover:bg-white/20"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <figure
              key={item.id}
              className="premium-card overflow-hidden transition hover:-translate-y-0.5"
            >
              <button type="button" className="block w-full text-right" onClick={() => setSelectedItem(item)}>
                <Image
                  src={item.image}
                  alt={`${item.treatmentName} - ${item.dogType}`}
                  width={1200}
                  height={700}
                  className="h-44 w-full object-cover"
                />
                <figcaption className="space-y-1 p-3">
                  <p className="text-sm font-semibold text-cyan-200">{item.treatmentName}</p>
                  <p className="text-xs text-pink-200">{item.dogType}</p>
                </figcaption>
              </button>
            </figure>
          ))}
        </div>
      </div>

      {selectedItem ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="תצוגת תמונה מוגדלת"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={selectedItem.image}
              alt={`${selectedItem.treatmentName} - ${selectedItem.dogType}`}
              width={1600}
              height={1000}
              className="h-auto max-h-[70vh] w-full object-cover"
            />
            <div className="flex items-center justify-between gap-3 bg-neutral-950 p-4">
              <div>
                <p className="text-base font-bold text-cyan-200">{selectedItem.treatmentName}</p>
                <p className="text-sm text-pink-200">{selectedItem.dogType}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
              >
                סגירה
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
