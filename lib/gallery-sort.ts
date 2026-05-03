import type { GalleryItem } from "@/data/marketing-data";

/** כמו sortGalleryItems ב־API: מובילות קודם, שאר לפי הסדר המקורי בכל קבוצה */
export function sortGalleryItemsLikeApi(items: GalleryItem[]): GalleryItem[] {
  const featuredItems = items.filter((item) => item.featured);
  const regularItems = items.filter((item) => !item.featured);
  return [...featuredItems, ...regularItems];
}
