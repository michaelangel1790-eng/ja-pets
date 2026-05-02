import truckLocationData from "@/data/truck-location.json";
import { mainLogoSrc, truckPromoFlatSrc } from "@/lib/site-images";

export type GalleryCategory = "הכל" | "תספורות" | "דילול" | "מקלחות";

export type GalleryItem = {
  id: string;
  image: string;
  category: GalleryCategory;
  dogType: string;
  treatmentName: string;
  caption?: string;
  featured?: boolean;
};

export type PricingPlan = {
  size: string;
  platinum: string;
  premium: string;
};

export type TruckLocation = {
  date: string;
  area: string;
  address: string;
  hours: string;
};

export const pricingPlans: PricingPlan[] = [
  { size: "עד 10 ק״ג", platinum: "290 - 420 ₪", premium: "280 - 360 ₪" },
  { size: "עד 20 ק״ג", platinum: "300 - 450 ₪", premium: "300 - 390 ₪" },
  { size: "עד 30 ק״ג", platinum: "390 - 520 ₪", premium: "320 - 450 ₪" },
  { size: "עד 40 ק״ג", platinum: "430 - 580 ₪", premium: "380 - 520 ₪" },
  { size: "עד 50 ק״ג", platinum: "490 - 650 ₪", premium: "420 - 580 ₪" }
];

export const haircutPricingPlans: PricingPlan[] = [...pricingPlans];

export const thinningPricingPlans: PricingPlan[] = [
  { size: "עד 10 ק״ג", platinum: "370 - 500 ₪", premium: "360 - 440 ₪" },
  { size: "עד 20 ק״ג", platinum: "380 - 530 ₪", premium: "380 - 470 ₪" },
  { size: "עד 30 ק״ג", platinum: "470 - 600 ₪", premium: "400 - 530 ₪" },
  { size: "עד 40 ק״ג", platinum: "510 - 660 ₪", premium: "460 - 600 ₪" },
  { size: "עד 50 ק״ג", platinum: "570 - 730 ₪", premium: "500 - 660 ₪" }
];

export const truckMonthlyLocations: TruckLocation[] = truckLocationData as TruckLocation[];

export const galleryItems: GalleryItem[] = [
  {
    id: "g1",
    image: "/images/van-mobile.png",
    category: "תספורות",
    dogType: "שיצו",
    treatmentName: "תספורת מלאה"
  },
  {
    id: "g2",
    image: truckPromoFlatSrc,
    category: "תספורות",
    dogType: "פודל",
    treatmentName: "תספורת גזע"
  },
  {
    id: "g3",
    image: mainLogoSrc,
    category: "דילול",
    dogType: "האסקי",
    treatmentName: "דילול עונתי"
  },
  {
    id: "g4",
    image: "/images/van-mobile.png",
    category: "דילול",
    dogType: "רועה גרמני",
    treatmentName: "שחרור קשרים ודילול"
  },
  {
    id: "g5",
    image: truckPromoFlatSrc,
    category: "מקלחות",
    dogType: "קוקר ספנייל",
    treatmentName: "מקלחת וסירוק מקצועי"
  },
  {
    id: "g6",
    image: mainLogoSrc,
    category: "מקלחות",
    dogType: "גולדן רטריבר",
    treatmentName: "מקלחת עדינה לעור רגיש"
  }
];
