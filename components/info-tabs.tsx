"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { haircutPricingPlans, thinningPricingPlans, truckMonthlyLocations, type GalleryItem } from "@/data/marketing-data";
import { compressFilesForGalleryUpload } from "@/lib/gallery-compress-client";
import { truckPromoNobgSrc } from "@/lib/site-images";
import {
  faqItems,
  howItWorksSteps,
  phoneNumbers,
  testimonials,
  whatsappMessage,
  whatsappMessageGallery,
  whatsappMessageTruckLocation,
  whatsappNumber
} from "@/data/site-data";
import { safeParseResponseJson } from "@/lib/safe-response-json";
import { sortGalleryItemsLikeApi } from "@/lib/gallery-sort";
import { GALLERY_ALLOWED_CAPTIONS } from "@/lib/gallery-captions";
import { WhatsappConsentNote } from "@/components/whatsapp-consent-note";

/** העלאה סדרתית יציבה (תמונה-תמונה אוטומטית) כדי למנוע כשלים בהעלאה מרובה. */
const GALLERY_UPLOAD_CHUNK_SIZE = 1;

/** תוכן בלעדי ללשונית «מה כלול» — כרטיסים פרימיום */
const INCLUDED_TAB_CARDS: { title: string; description: string; icon: string }[] = [
  { title: "טיפול מלא", description: "תספורת ומקלחת מקצועית", icon: "◆" },
  { title: "תספורת מקצועית", description: "התאמה לפי סוג הכלב, מצב הפרווה והבקשה של הלקוח", icon: "◇" },
  { title: "ניקוי אוזניים וציפורניים", description: "מתבצע בהתאם לשיקול דעת מקצועי של הספר", icon: "◈" },
  { title: "טיפולים משלימים", description: "טיפול בפרעושים וקרציות בתוספת תשלום ובהתאם לצורך", icon: "✦" },
  { title: "התאמה אישית", description: "כל טיפול מותאם לגודל הכלב, אופי הכלב ומצב הפרווה", icon: "✧" }
];

/** כותרות עמודות מחירון — זהב (כמו תמיד); הרקע בשורה נפרד בעדינות לפי מסלול */
const PRICING_COLUMN_HEADER_STYLE: CSSProperties = {
  color: "#d4af37",
  WebkitTextFillColor: "#d4af37"
};

const GALLERY_ADMIN_SESSION_KEY = "jacuzzi-gallery-admin-session";
const LOCATION_ADMIN_SESSION_KEY = "jacuzzi-location-admin-session";
const REVIEWS_ADMIN_SESSION_KEY = "jacuzzi-reviews-admin-session";

function postGalleryFormWithProgress(
  formData: FormData,
  sessionToken: string,
  onUploadProgress: (pct: number) => void
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/gallery");
    xhr.setRequestHeader("x-admin-session", sessionToken);
    xhr.responseType = "text";
    xhr.onload = () => {
      resolve(
        new Response(xhr.responseText, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: { "Content-Type": xhr.getResponseHeader("Content-Type") || "application/json" }
        })
      );
    };
    xhr.onerror = () => reject(new Error("העלאה נכשלה — בדוק חיבור לאינטרנט"));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        onUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.send(formData);
  });
}

type TabId =
  | "services"
  | "pricing"
  | "how"
  | "included"
  | "about"
  | "testimonials"
  | "gallery"
  | "location"
  | "faq"
  | "contact";

type ReviewItem = {
  name: string;
  area: string;
  review: string;
  rating: number;
};

type PendingReviewItem = ReviewItem & {
  id: string;
};

type TruckLocation = {
  date: string;
  area: string;
  address: string;
  hours: string;
};

/**
 * סדר לרשת 2 עמודות (כמו בעיצוב המקורי): שורה אחר שורה -
 * ימין | שמאל: אודות|המלצות, שירותים|מחירון, איך קובעים|מה כלול, גלריה|מיקום, שאלות|יצירת קשר.
 */
const tabs: { id: TabId; label: string }[] = [
  { id: "about", label: "אודות עלינו" },
  { id: "testimonials", label: "המלצות לקוחות" },
  { id: "services", label: "שירותים" },
  { id: "pricing", label: "מחירון" },
  { id: "how", label: "איך קובעים" },
  { id: "included", label: "מה כלול" },
  { id: "gallery", label: "גלריה" },
  { id: "location", label: "מיקום המשאית" },
  { id: "faq", label: "שאלות נפוצות" },
  { id: "contact", label: "יצירת קשר" }
];

const TAB_IDS: TabId[] = tabs.map((tab) => tab.id);

export function InfoTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("about");
  const [monthlyLocations, setMonthlyLocations] = useState<TruckLocation[]>(truckMonthlyLocations);
  const [liveTestimonials, setLiveTestimonials] = useState<ReviewItem[]>(testimonials);
  const [testimonialsPage, setTestimonialsPage] = useState(1);
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
  const [reviewName, setReviewName] = useState("");
  const [reviewArea, setReviewArea] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewPrivacyApproved, setReviewPrivacyApproved] = useState(false);
  const [reviewSubmitMessage, setReviewSubmitMessage] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<"all" | 5 | 4 | 3>("all");
  const [adminCode, setAdminCode] = useState("");
  const [pendingReviews, setPendingReviews] = useState<PendingReviewItem[]>([]);
  const [adminMessage, setAdminMessage] = useState("");
  const [isModerationBusy, setIsModerationBusy] = useState(false);
  const [locationAdminCode, setLocationAdminCode] = useState("");
  const [editableLocations, setEditableLocations] = useState<TruckLocation[]>(truckMonthlyLocations);
  const [locationAdminMessage, setLocationAdminMessage] = useState("");
  const [isSavingLocations, setIsSavingLocations] = useState(false);
  const [isRestoringLocations, setIsRestoringLocations] = useState(false);
  const [isLocationAdminAuthorized, setIsLocationAdminAuthorized] = useState(false);
  const [isVerifyingLocationAdminCode, setIsVerifyingLocationAdminCode] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryItem[]>([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);
  /** נכון אחרי טעינה ראשונה מ־API — עד אז לא מציגים רשת תמונות (בלי דמו/מטמון ישן) */
  const [galleryHydrated, setGalleryHydrated] = useState(false);
  const [galleryAdminCode, setGalleryAdminCode] = useState("");
  const [galleryAdminMessage, setGalleryAdminMessage] = useState("");
  const [isGalleryAdminAuthorized, setIsGalleryAdminAuthorized] = useState(false);
  const lastVerifiedGalleryCodeRef = useRef<string | null>(null);
  const hasLoadedGalleryRef = useRef(false);
  const lastVerifiedLocationSessionRef = useRef<string | null>(null);
  const lastVerifiedReviewsSessionRef = useRef<string | null>(null);
  const [isVerifyingGalleryAdminCode, setIsVerifyingGalleryAdminCode] = useState(false);
  const [isUploadingGalleryImages, setIsUploadingGalleryImages] = useState(false);
  const [galleryCompressProgress, setGalleryCompressProgress] = useState(0);
  const [galleryUploadProgress, setGalleryUploadProgress] = useState(0);
  const [featuredSavingId, setFeaturedSavingId] = useState<string | null>(null);
  const [captionSavingId, setCaptionSavingId] = useState<string | null>(null);
  const [galleryThumbLoaded, setGalleryThumbLoaded] = useState<Record<string, boolean>>({});
  const [reorderingGalleryItemId, setReorderingGalleryItemId] = useState<string | null>(null);
  const [deletingGalleryItemId, setDeletingGalleryItemId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [galleryTouchStartX, setGalleryTouchStartX] = useState<number | null>(null);
  const [galleryTouchStartY, setGalleryTouchStartY] = useState<number | null>(null);
  const [lightboxDirection, setLightboxDirection] = useState<"next" | "prev" | null>(null);
  const [isLightboxImageLoading, setIsLightboxImageLoading] = useState(false);
  const [galleryPage, setGalleryPage] = useState(1);
  const [mobileGalleryVisibleCount, setMobileGalleryVisibleCount] = useState(8);
  const [galleryZoom, setGalleryZoom] = useState(1);
  const [isClient, setIsClient] = useState(false);
  const [isDesktopGalleryViewport, setIsDesktopGalleryViewport] = useState(false);
  const [uploadCaption, setUploadCaption] = useState("");
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const lightboxContainerRef = useRef<HTMLDivElement | null>(null);
  const lastLightboxTriggerRef = useRef<HTMLElement | null>(null);
  /** תמונה פתוחה בלייטבוקס לפי id — כדי שלא יחליפו תמונה אחרת אחרי שינוי מובילה/כיתוב ומיון מחדש */
  const lightboxFocusedItemIdRef = useRef<string | null>(null);
  /** סנכרון מצב לתור כתיבות — מונע דריסת כיתובים/מובילות בבקשות מקבילות לשרת */
  const galleryImagesRef = useRef<GalleryItem[]>([]);
  const galleryWriteChainRef = useRef(Promise.resolve());

  useEffect(() => {
    galleryImagesRef.current = galleryImages;
  }, [galleryImages]);

  function enqueueGalleryWrite<T>(fn: () => Promise<T>): Promise<T> {
    const runPromise = galleryWriteChainRef.current.then(() => fn());
    galleryWriteChainRef.current = runPromise.then(
      () => {},
      () => {}
    );
    return runPromise;
  }

  function orderGalleryFeaturedFirst(items: GalleryItem[]): GalleryItem[] {
    return [...items].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  }

  const preventImageSave = (event: React.SyntheticEvent) => {
    event.preventDefault();
  };

  const handleTabListKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const currentIndex = TAB_IDS.indexOf(activeTab);
      let nextIndex = currentIndex;
      if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = TAB_IDS.length - 1;
      else if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % TAB_IDS.length;
      else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + TAB_IDS.length) % TAB_IDS.length;
      const nextId = TAB_IDS[nextIndex];
      setActiveTab(nextId);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", nextId);
        url.hash = "tabs";
        const qs = url.searchParams.toString();
        window.history.replaceState(null, "", qs ? `${url.pathname}?${qs}#tabs` : `${url.pathname}#tabs`);
      }
      queueMicrotask(() => {
        document.getElementById(`tab-${nextId}`)?.focus();
      });
    },
    [activeTab]
  );

  const combinedPricingRows = haircutPricingPlans.map((row, index) => ({
    size: row.size,
    haircutPlatinum: row.platinum,
    haircutPremium: row.premium,
    thinningPlatinum: thinningPricingPlans[index]?.platinum ?? row.platinum,
    thinningPremium: thinningPricingPlans[index]?.premium ?? row.premium
  }));
  const REVIEW_PREVIEW_LENGTH = 80;
  const TESTIMONIALS_PER_PAGE = 15;
  const MOBILE_GALLERY_BATCH_SIZE = 8;
  const GALLERY_ITEMS_PER_PAGE = isDesktopGalleryViewport ? 16 : 12;
  const featuredFirstGalleryItems = useMemo(
    () => [...galleryImages].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured))),
    [galleryImages]
  );
  const showGalleryGrid = galleryHydrated && !isGalleryLoading;
  const filteredTestimonials = liveTestimonials.filter((item) =>
    ratingFilter === "all" ? true : item.rating === ratingFilter
  );
  const totalTestimonialsPages = Math.max(1, Math.ceil(filteredTestimonials.length / TESTIMONIALS_PER_PAGE));
  const pagedTestimonials = filteredTestimonials.slice(
    (testimonialsPage - 1) * TESTIMONIALS_PER_PAGE,
    testimonialsPage * TESTIMONIALS_PER_PAGE
  );
  const totalGalleryPages = Math.max(1, Math.ceil(featuredFirstGalleryItems.length / GALLERY_ITEMS_PER_PAGE));
  const pagedGalleryItems = isDesktopGalleryViewport
    ? featuredFirstGalleryItems.slice((galleryPage - 1) * GALLERY_ITEMS_PER_PAGE, galleryPage * GALLERY_ITEMS_PER_PAGE)
    : featuredFirstGalleryItems.slice(0, mobileGalleryVisibleCount);
  const currentGalleryItem =
    selectedImageIndex !== null && selectedImageIndex >= 0 && selectedImageIndex < featuredFirstGalleryItems.length
      ? featuredFirstGalleryItems[selectedImageIndex]
      : null;
  const lightboxAnimationClass =
    lightboxDirection === "next"
      ? "gallery-slide-next"
      : lightboxDirection === "prev"
        ? "gallery-slide-prev"
        : "gallery-fade-in";
  const isAdminMode = isGalleryAdminAuthorized;
  const canManageGallery = isAdminMode || Boolean(lastVerifiedGalleryCodeRef.current);

  const loadTruckLocation = useCallback(async () => {
    try {
      const response = await fetch("/api/truck-location", { cache: "no-store" });
      if (!response.ok) return;
      const payload = await safeParseResponseJson<{
        locations?: Array<{ date?: string; area?: string; address?: string; hours?: string }>;
      }>(response);
      if (Array.isArray(payload.locations) && payload.locations.length > 0) {
        const cleaned = payload.locations
          .map((row) => ({
            date: row.date ?? "",
            area: row.area ?? "",
            address: row.address ?? "",
            hours: row.hours ?? ""
          }))
          .filter((row) => row.date || row.area || row.address || row.hours);

        if (cleaned.length > 0) {
          setMonthlyLocations(cleaned);
          setEditableLocations(cleaned);
        }
      }
    } catch {
      // Keep fallback data from local file if external source unavailable.
    }
  }, []);

  const loadGalleryItems = useCallback(async (forceRefresh = false, options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (hasLoadedGalleryRef.current && !forceRefresh) {
      setGalleryHydrated(true);
      return;
    }
    if (!silent) {
      setIsGalleryLoading(true);
    }
    try {
      const url = forceRefresh ? `/api/gallery?_=${Date.now()}` : "/api/gallery";
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) return;
      const payload = await safeParseResponseJson<{ items?: GalleryItem[] }>(response);
      if (Array.isArray(payload.items)) {
        setGalleryImages(payload.items);
        hasLoadedGalleryRef.current = true;
      }
    } catch {
      // Keep empty list if gallery API is unavailable.
    } finally {
      if (!silent) {
        setIsGalleryLoading(false);
      }
      setGalleryHydrated(true);
    }
  }, []);

  useEffect(() => {
    loadTruckLocation();

    const now = new Date();
    const nextRefresh = new Date(now);
    nextRefresh.setHours(8, 0, 0, 0);
    if (nextRefresh <= now) {
      nextRefresh.setDate(nextRefresh.getDate() + 1);
    }

    const msUntilNextRefresh = nextRefresh.getTime() - now.getTime();
    let dailyIntervalId: ReturnType<typeof setInterval> | null = null;

    const timeoutId = setTimeout(() => {
      loadTruckLocation();
      dailyIntervalId = setInterval(loadTruckLocation, 24 * 60 * 60 * 1000);
    }, msUntilNextRefresh);

    return () => {
      clearTimeout(timeoutId);
      if (dailyIntervalId) {
        clearInterval(dailyIntervalId);
      }
    };
  }, [loadTruckLocation]);

  useEffect(() => {
    if (activeTab === "location") {
      loadTruckLocation();
    }
    if (activeTab === "gallery" && !hasLoadedGalleryRef.current) {
      loadGalleryItems();
    }
  }, [activeTab, loadGalleryItems, loadTruckLocation]);

  useEffect(() => {
    if (activeTab !== "gallery") {
      setIsLightboxOpen(false);
      setSelectedImageIndex(null);
      setDeleteConfirmId(null);
      setGalleryTouchStartX(null);
      setGalleryTouchStartY(null);
    }
  }, [activeTab]);

  useEffect(() => {
    const openTabFromNav = (event: Event) => {
      const customEvent = event as CustomEvent<{ tabId?: string }>;
      const tabId = customEvent.detail?.tabId;
      if (tabId && TAB_IDS.includes(tabId as TabId)) {
        setActiveTab(tabId as TabId);
      }
    };

    window.addEventListener("open-info-tab", openTabFromNav);

    const syncTabFromUrl = () => {
      const searchTab = new URLSearchParams(window.location.search).get("tab");
      if (searchTab && TAB_IDS.includes(searchTab as TabId)) {
        setActiveTab(searchTab as TabId);
      }
    };
    syncTabFromUrl();
    window.addEventListener("popstate", syncTabFromUrl);
    window.addEventListener("hashchange", syncTabFromUrl);

    return () => {
      window.removeEventListener("open-info-tab", openTabFromNav);
      window.removeEventListener("popstate", syncTabFromUrl);
      window.removeEventListener("hashchange", syncTabFromUrl);
    };
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(GALLERY_ADMIN_SESSION_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as { token?: string };
      const token = typeof data.token === "string" && data.token.length > 0 ? data.token : "";
      if (token) {
        setIsGalleryAdminAuthorized(true);
        lastVerifiedGalleryCodeRef.current = token;
      }
    } catch {
      sessionStorage.removeItem(GALLERY_ADMIN_SESSION_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LOCATION_ADMIN_SESSION_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as { token?: string };
      if (typeof data.token === "string" && data.token.length > 0) {
        lastVerifiedLocationSessionRef.current = data.token;
        setIsLocationAdminAuthorized(true);
      }
    } catch {
      sessionStorage.removeItem(LOCATION_ADMIN_SESSION_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(REVIEWS_ADMIN_SESSION_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as { token?: string };
      if (typeof data.token === "string" && data.token.length > 0) {
        lastVerifiedReviewsSessionRef.current = data.token;
      }
    } catch {
      sessionStorage.removeItem(REVIEWS_ADMIN_SESSION_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const applyViewport = () => setIsDesktopGalleryViewport(window.innerWidth >= 900);
    applyViewport();
    window.addEventListener("resize", applyViewport);
    return () => window.removeEventListener("resize", applyViewport);
  }, []);

  useEffect(() => {
    if (activeTab === "testimonials") {
      setTestimonialsPage(1);
    }
    if (activeTab === "gallery") {
      setGalleryPage(1);
    }
  }, [activeTab]);

  useEffect(() => {
    setTestimonialsPage(1);
  }, [ratingFilter]);

  useEffect(() => {
    setGalleryPage((prev) => Math.min(prev, totalGalleryPages));
  }, [totalGalleryPages]);

  useEffect(() => {
    if (isDesktopGalleryViewport) return;
    setMobileGalleryVisibleCount((prev) => {
      const safePrev = Math.max(MOBILE_GALLERY_BATCH_SIZE, prev);
      if (featuredFirstGalleryItems.length <= safePrev) return safePrev;
      return Math.min(featuredFirstGalleryItems.length, safePrev);
    });
  }, [MOBILE_GALLERY_BATCH_SIZE, featuredFirstGalleryItems.length, isDesktopGalleryViewport]);

  const closeLightbox = useCallback(() => {
    const triggerElement = lastLightboxTriggerRef.current;
    lightboxFocusedItemIdRef.current = null;
    setSelectedImageIndex(null);
    setIsLightboxOpen(false);
    setGalleryZoom(1);
    setLightboxDirection(null);
    setIsLightboxImageLoading(false);
    if (triggerElement) {
      const el = triggerElement;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          try {
            el.focus({ preventScroll: true });
          } catch {
            el.focus();
          }
        });
      });
    }
    lastLightboxTriggerRef.current = null;
  }, []);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const id = lightboxFocusedItemIdRef.current;
    if (!id) return;
    const newIdx = featuredFirstGalleryItems.findIndex((x) => x.id === id);
    if (newIdx < 0) {
      closeLightbox();
      return;
    }
    setSelectedImageIndex((prev) => (prev !== newIdx ? newIdx : prev));
  }, [featuredFirstGalleryItems, isLightboxOpen, closeLightbox]);

  useEffect(() => {
    if (selectedImageIndex === null || !isLightboxOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        const prevIndex = selectedImageIndex === 0 ? featuredFirstGalleryItems.length - 1 : selectedImageIndex - 1;
        const item = featuredFirstGalleryItems[prevIndex];
        lightboxFocusedItemIdRef.current = item?.id ?? null;
        setLightboxDirection("prev");
        setSelectedImageIndex(prevIndex);
        setGalleryZoom(1);
        setIsLightboxImageLoading(true);
      } else if (event.key === "ArrowRight") {
        const nextIndex = selectedImageIndex === featuredFirstGalleryItems.length - 1 ? 0 : selectedImageIndex + 1;
        const item = featuredFirstGalleryItems[nextIndex];
        lightboxFocusedItemIdRef.current = item?.id ?? null;
        setLightboxDirection("next");
        setSelectedImageIndex(nextIndex);
        setGalleryZoom(1);
        setIsLightboxImageLoading(true);
      } else if (event.key === "Escape") {
        closeLightbox();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeLightbox, featuredFirstGalleryItems, isLightboxOpen, selectedImageIndex]);

  useEffect(() => {
    if (!featuredFirstGalleryItems.length) {
      closeLightbox();
      return;
    }

    if (selectedImageIndex !== null && selectedImageIndex >= featuredFirstGalleryItems.length) {
      setSelectedImageIndex(featuredFirstGalleryItems.length - 1);
    }
  }, [closeLightbox, featuredFirstGalleryItems.length, selectedImageIndex]);

  useEffect(() => {
    if (isLightboxOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
    return;
  }, [isLightboxOpen]);

  useEffect(() => {
    if (!isLightboxOpen || !lightboxContainerRef.current) return;

    const container = lightboxContainerRef.current;
    const focusableSelector = [
      "button:not([disabled])",
      "a[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])"
    ].join(", ");
    const focusableElements = Array.from(container.querySelectorAll<HTMLElement>(focusableSelector));
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    try {
      firstElement?.focus({ preventScroll: true });
    } catch {
      firstElement?.focus();
    }

    const onTrapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || focusableElements.length === 0) return;
      const activeElement = document.activeElement as HTMLElement | null;
      if (event.shiftKey) {
        if (!activeElement || activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
        return;
      }
      if (!activeElement || activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    };

    container.addEventListener("keydown", onTrapFocus);
    return () => container.removeEventListener("keydown", onTrapFocus);
  }, [isLightboxOpen]);

  useEffect(() => {
    if (!isLightboxOpen || selectedImageIndex === null || featuredFirstGalleryItems.length === 0) return;

    const prevIndex = selectedImageIndex === 0 ? featuredFirstGalleryItems.length - 1 : selectedImageIndex - 1;
    const nextIndex = selectedImageIndex === featuredFirstGalleryItems.length - 1 ? 0 : selectedImageIndex + 1;
    const preload = [featuredFirstGalleryItems[prevIndex]?.image, featuredFirstGalleryItems[nextIndex]?.image].filter(Boolean);

    preload.forEach((src) => {
      const image = new window.Image();
      image.src = src as string;
    });
  }, [featuredFirstGalleryItems, isLightboxOpen, selectedImageIndex]);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const response = await fetch("/api/reviews", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          reviews?: Array<{ name?: string; area?: string; review?: string; rating?: number; image_url?: string }>;
        };
        if (Array.isArray(payload.reviews) && payload.reviews.length > 0) {
          const normalized = payload.reviews
            .map((item) => ({
              name: item.name ?? "",
              area: item.area ?? "",
              review: item.review ?? "",
              rating: Math.max(0, Math.min(5, Math.round(Number(item.rating ?? 0))))
            }))
            .filter((item) => item.name || item.area || item.review);

          if (normalized.length > 0) {
            setLiveTestimonials(normalized);
          }
        }
      } catch {
        // Keep fallback testimonials if external source unavailable.
      }
    };

    loadReviews();
  }, []);

  const handleReviewSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReviewSubmitMessage("");

    if (!reviewName.trim() || !reviewArea.trim() || !reviewText.trim()) {
      setReviewSubmitMessage("נא למלא שם מלא, אזור מגורים וטקסט ביקורת.");
      return;
    }
    if (!reviewPrivacyApproved) {
      setReviewSubmitMessage("יש לאשר את מדיניות הפרטיות לפני שליחת הביקורת.");
      return;
    }

    setIsSubmittingReview(true);

    try {
      const response = await fetch("/api/reviews-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: reviewName,
          area: reviewArea,
          review: reviewText,
          rating: reviewRating
        })
      });

      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(payload.error || "שליחת הביקורת נכשלה");
      }

      setReviewSubmitMessage(payload.message || "הביקורת נשלחה וממתינה לאישור");
      setReviewName("");
      setReviewArea("");
      setReviewText("");
      setReviewRating(5);
      setReviewPrivacyApproved(false);
    } catch (error) {
      setReviewSubmitMessage(error instanceof Error ? error.message : "שליחת הביקורת נכשלה");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const loadPendingReviews = async () => {
    if (!adminCode.trim() && !lastVerifiedReviewsSessionRef.current) {
      setAdminMessage("יש להזין קוד מנהל");
      return;
    }
    setIsModerationBusy(true);
    setAdminMessage("");
    try {
      let sessionToken = lastVerifiedReviewsSessionRef.current;
      if (!sessionToken) {
        const verifyResponse = await fetch("/api/reviews-moderation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verify-code", code: adminCode.trim() })
        });
        const verifyPayload = await safeParseResponseJson<{ error?: string; sessionToken?: string }>(verifyResponse);
        if (!verifyResponse.ok || !verifyPayload.sessionToken) {
          throw new Error(verifyPayload.error || "אימות מנהל נכשל");
        }
        sessionToken = verifyPayload.sessionToken;
        lastVerifiedReviewsSessionRef.current = sessionToken;
        try {
          sessionStorage.setItem(REVIEWS_ADMIN_SESSION_KEY, JSON.stringify({ token: sessionToken }));
        } catch {
          // ignore
        }
      }
      const response = await fetch("/api/reviews-moderation", {
        cache: "no-store",
        headers: { "x-admin-session": sessionToken }
      });
      const payload = await safeParseResponseJson<{ pending?: PendingReviewItem[]; error?: string }>(response);
      if (!response.ok) {
        throw new Error(payload.error || "טעינת ביקורות ממתינות נכשלה");
      }
      setPendingReviews(payload.pending ?? []);
      if ((payload.pending ?? []).length === 0) {
        setAdminMessage("אין כרגע ביקורות ממתינות");
      }
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : "טעינת ביקורות ממתינות נכשלה");
    } finally {
      setIsModerationBusy(false);
    }
  };

  const moderateReview = async (id: string, action: "approve" | "reject") => {
    if (!adminCode.trim() && !lastVerifiedReviewsSessionRef.current) {
      setAdminMessage("יש להזין קוד מנהל");
      return;
    }
    setIsModerationBusy(true);
    setAdminMessage("");
    try {
      let sessionToken = lastVerifiedReviewsSessionRef.current;
      if (!sessionToken) {
        const verifyResponse = await fetch("/api/reviews-moderation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verify-code", code: adminCode.trim() })
        });
        const verifyPayload = await safeParseResponseJson<{ error?: string; sessionToken?: string }>(verifyResponse);
        if (!verifyResponse.ok || !verifyPayload.sessionToken) {
          throw new Error(verifyPayload.error || "אימות מנהל נכשל");
        }
        sessionToken = verifyPayload.sessionToken;
        lastVerifiedReviewsSessionRef.current = sessionToken;
        try {
          sessionStorage.setItem(REVIEWS_ADMIN_SESSION_KEY, JSON.stringify({ token: sessionToken }));
        } catch {
          // ignore
        }
      }
      const response = await fetch("/api/reviews-moderation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-session": sessionToken
        },
        body: JSON.stringify({ action, id })
      });
      const payload = await safeParseResponseJson<{ error?: string }>(response);
      if (!response.ok) {
        throw new Error(payload.error || "עדכון הביקורת נכשל");
      }
      setPendingReviews((prev) => prev.filter((item) => item.id !== id));
      setAdminMessage(action === "approve" ? "הביקורת אושרה" : "הביקורת נדחתה");
      if (action === "approve") {
        const approved = pendingReviews.find((item) => item.id === id);
        if (approved) {
          setLiveTestimonials((prev) => [approved, ...prev]);
        }
      }
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : "עדכון הביקורת נכשל");
    } finally {
      setIsModerationBusy(false);
    }
  };

  const toggleReview = (key: string) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const copyAddress = async (address: string) => {
    try {
      if (!address) return;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(address);
        return;
      }
      const tempInput = document.createElement("input");
      tempInput.value = address;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
    } catch {
      // Silent fail to keep UX clean on restricted browsers.
    }
  };

  const updateEditableLocation = (index: number, field: keyof TruckLocation, value: string) => {
    setEditableLocations((prev) =>
      prev.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row))
    );
  };

  const addEditableLocationRow = () => {
    setEditableLocations((prev) => [...prev, { date: "", area: "", address: "", hours: "" }]);
  };

  const removeEditableLocationRow = (index: number) => {
    setEditableLocations((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  };

  const verifyLocationAdminCode = async () => {
    if (!locationAdminCode.trim()) {
      setLocationAdminMessage("יש להזין קוד מנהל");
      setIsLocationAdminAuthorized(false);
      return;
    }

    setIsVerifyingLocationAdminCode(true);
    setLocationAdminMessage("");
    try {
      const response = await fetch("/api/truck-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: locationAdminCode.trim(), action: "verify-code" })
      });
      const payload = await safeParseResponseJson<{ error?: string; sessionToken?: string }>(response);
      if (!response.ok || !payload.sessionToken) {
        throw new Error(payload.error || "אימות מנהל נכשל");
      }
      lastVerifiedLocationSessionRef.current = payload.sessionToken;
      try {
        sessionStorage.setItem(LOCATION_ADMIN_SESSION_KEY, JSON.stringify({ token: payload.sessionToken }));
      } catch {
        // ignore
      }
      setIsLocationAdminAuthorized(true);
      setLocationAdminMessage("הקוד אומת, אפשר לערוך ולשמור מיקומים");
    } catch (error) {
      setIsLocationAdminAuthorized(false);
      setLocationAdminMessage(error instanceof Error ? error.message : "קוד מנהל שגוי");
    } finally {
      setIsVerifyingLocationAdminCode(false);
    }
  };

  const saveTruckLocations = async () => {
    if (!isLocationAdminAuthorized) {
      setLocationAdminMessage("צריך לאמת קוד מנהל לפני עריכה");
      return;
    }

    const cleaned = editableLocations
      .map((row) => ({
        date: row.date.trim(),
        area: row.area.trim(),
        address: row.address.trim(),
        hours: row.hours.trim()
      }))
      .filter((row) => row.date || row.area || row.address || row.hours);

    if (cleaned.length === 0) {
      setLocationAdminMessage("יש להזין לפחות מיקום אחד תקין");
      return;
    }
    const invalidRowIndex = cleaned.findIndex((row) => !row.date || !row.area || !row.address || !row.hours);
    if (invalidRowIndex >= 0) {
      setLocationAdminMessage(`בשורה ${invalidRowIndex + 1} יש להשלים תאריך, אזור, כתובת ושעות פעילות`);
      return;
    }

    setIsSavingLocations(true);
    setLocationAdminMessage("");
    try {
      const sessionToken = lastVerifiedLocationSessionRef.current;
      if (!sessionToken) {
        throw new Error("יש לאמת מחדש קוד מנהל");
      }
      const response = await fetch("/api/truck-location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-session": sessionToken
        },
        body: JSON.stringify({ locations: cleaned })
      });

      const payload = await safeParseResponseJson<{ error?: string; locations?: TruckLocation[] }>(response);
      if (!response.ok) {
        throw new Error(payload.error || "שמירת מיקומי המשאית נכשלה");
      }

      const savedRows = Array.isArray(payload.locations) ? payload.locations : cleaned;
      setMonthlyLocations(savedRows);
      setEditableLocations(savedRows);
      setLocationAdminMessage("המיקומים נשמרו בהצלחה");
    } catch (error) {
      setLocationAdminMessage(error instanceof Error ? error.message : "שמירת מיקומי המשאית נכשלה");
    } finally {
      setIsSavingLocations(false);
    }
  };

  const restoreLastTruckLocations = async () => {
    if (!isLocationAdminAuthorized) {
      setLocationAdminMessage("צריך לאמת קוד מנהל לפני שחזור");
      return;
    }

    setIsRestoringLocations(true);
    setLocationAdminMessage("");
    try {
      const sessionToken = lastVerifiedLocationSessionRef.current;
      if (!sessionToken) {
        throw new Error("יש לאמת מחדש קוד מנהל");
      }
      const response = await fetch("/api/truck-location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-session": sessionToken
        },
        body: JSON.stringify({ action: "restore-last" })
      });

      const payload = await safeParseResponseJson<{ error?: string; locations?: TruckLocation[] }>(response);
      if (!response.ok) {
        throw new Error(payload.error || "שחזור הגרסה האחרונה נכשל");
      }

      const restoredRows = Array.isArray(payload.locations) ? payload.locations : [];
      setMonthlyLocations(restoredRows);
      setEditableLocations(restoredRows);
      setLocationAdminMessage("בוצע שחזור לגרסה האחרונה");
    } catch (error) {
      setLocationAdminMessage(error instanceof Error ? error.message : "שחזור הגרסה האחרונה נכשל");
    } finally {
      setIsRestoringLocations(false);
    }
  };

  const verifyGalleryAdminCode = async () => {
    if (!galleryAdminCode.trim()) {
      setGalleryAdminMessage("יש להזין קוד מנהל");
      setIsGalleryAdminAuthorized(false);
      lastVerifiedGalleryCodeRef.current = null;
      try {
        sessionStorage.removeItem(GALLERY_ADMIN_SESSION_KEY);
      } catch {
        // ignore
      }
      return;
    }

    setIsVerifyingGalleryAdminCode(true);
    setGalleryAdminMessage("");
    try {
      const response = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: galleryAdminCode.trim(), action: "verify-code" })
      });
      const payload = await safeParseResponseJson<{
        error?: string;
        ok?: boolean;
        token?: string;
        sessionToken?: string;
        message?: string;
      }>(response);
      let gallerySessionToken = "";
      if (typeof payload.token === "string" && payload.token.trim()) {
        gallerySessionToken = payload.token.trim();
      } else if (typeof payload.sessionToken === "string" && payload.sessionToken.trim()) {
        gallerySessionToken = payload.sessionToken.trim();
      }
      if (!response.ok || !gallerySessionToken) {
        throw new Error(
          (typeof payload.error === "string" && payload.error.trim()) || "אימות מנהל נכשל"
        );
      }
      lastVerifiedGalleryCodeRef.current = gallerySessionToken;
      try {
        sessionStorage.setItem(GALLERY_ADMIN_SESSION_KEY, JSON.stringify({ token: gallerySessionToken }));
      } catch {
        // ignore storage quota / private mode
      }
      setIsGalleryAdminAuthorized(true);
      setGalleryAdminMessage("הקוד אומת, אפשר להעלות תמונות");
    } catch (error) {
      setIsGalleryAdminAuthorized(false);
      lastVerifiedGalleryCodeRef.current = null;
      try {
        sessionStorage.removeItem(GALLERY_ADMIN_SESSION_KEY);
      } catch {
        // ignore
      }
      setGalleryAdminMessage(error instanceof Error ? error.message : "קוד מנהל שגוי");
    } finally {
      setIsVerifyingGalleryAdminCode(false);
    }
  };

  const uploadImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const rawFiles = input.files;

    if (!canManageGallery) {
      setGalleryAdminMessage("צריך לאמת קוד מנהל לפני העלאת תמונות");
      if (input) input.value = "";
      return;
    }

    if (!rawFiles || rawFiles.length === 0) return;

    const files = Array.from(rawFiles);

    setIsUploadingGalleryImages(true);
    setGalleryCompressProgress(0);
    setGalleryUploadProgress(0);
    setGalleryAdminMessage("מכווץ ומעלה תמונות...");
    try {
      const compressed = await compressFilesForGalleryUpload(files, {
        onProgress: (p) => setGalleryCompressProgress(p)
      });
      if (!compressed.ok) {
        setGalleryAdminMessage(compressed.error);
        return;
      }

      const sessionToken = lastVerifiedGalleryCodeRef.current;
      if (!sessionToken) {
        throw new Error("יש לאמת מחדש קוד מנהל");
      }

      const toUpload = compressed.files;
      const chunks: (typeof toUpload)[] = [];
      for (let i = 0; i < toUpload.length; i += GALLERY_UPLOAD_CHUNK_SIZE) {
        chunks.push(toUpload.slice(i, i + GALLERY_UPLOAD_CHUNK_SIZE));
      }
      const totalChunks = chunks.length;
      let lastPayload: {
        error?: string;
        message?: string;
        items?: GalleryItem[];
        created?: GalleryItem[];
        ok?: boolean;
      } = {};
      const shouldRetryAsSingleUpload = (errorText?: string): boolean => {
        if (!errorText) return false;
        return (
          errorText.includes("תשובת השרת לא בפורמט") ||
          errorText.includes("השרת החזיר תשובה שאינה תקינה") ||
          errorText.includes("HTML במקום JSON")
        );
      };

      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
        const chunk = chunks[chunkIndex];
        await enqueueGalleryWrite(async () => {
          const runUploadAttempt = async (attemptFiles: File[]) => {
            const formData = new FormData();
            formData.append("action", "upload");
            if (uploadCaption) {
              formData.append("caption", uploadCaption);
            }
            const captionsArr = attemptFiles.map(() => uploadCaption);
            formData.append("captions", JSON.stringify(captionsArr));
            attemptFiles.forEach((file) => formData.append("images", file));

            const response = await postGalleryFormWithProgress(formData, sessionToken, (pct) => {
              const overall = ((chunkIndex + pct / 100) / totalChunks) * 100;
              setGalleryUploadProgress(Math.min(100, Math.round(overall)));
            });
            const payload = await safeParseResponseJson<{
              error?: string;
              message?: string;
              items?: GalleryItem[];
              created?: GalleryItem[];
              ok?: boolean;
            }>(response);
            return { response, payload };
          };

          setGalleryAdminMessage(
            totalChunks > 1
              ? `מעלה קבוצה ${chunkIndex + 1} מתוך ${totalChunks} (${chunk.length} תמונות)...`
              : "מעלה תמונות..."
          );

          let { response, payload } = await runUploadAttempt(chunk);
          const chunkPayloadMalformed = shouldRetryAsSingleUpload(payload.error);
          if (chunk.length > 1 && chunkPayloadMalformed) {
            setGalleryAdminMessage("זוהתה בעיית שרת, ממשיך בהעלאה חכמה אוטומטית...");
            for (let i = 0; i < chunk.length; i += 1) {
              const singleResult = await runUploadAttempt([chunk[i]]);
              response = singleResult.response;
              payload = singleResult.payload;
              if (shouldRetryAsSingleUpload(payload.error)) {
                throw new Error("השרת החזיר תשובה לא תקינה גם בהעלאה יחידה. נסה שוב בעוד רגע.");
              }
              if (!response.ok) {
                const serverErr =
                  typeof payload.error === "string" && payload.error.trim()
                    ? payload.error.trim()
                    : "העלאת התמונות נכשלה";
                throw new Error(serverErr);
              }
              if (Array.isArray(payload.items)) {
                setGalleryImages(payload.items);
              } else if (Array.isArray(payload.created) && payload.created.length > 0) {
                setGalleryImages((prev) => sortGalleryItemsLikeApi([...payload.created!, ...prev]));
              } else {
                await loadGalleryItems(true, { silent: true });
              }
              setGalleryUploadProgress(
                Math.min(100, Math.round(((chunkIndex + (i + 1) / chunk.length) / totalChunks) * 100))
              );
              lastPayload = payload;
            }
            return;
          }
          if (chunkPayloadMalformed) {
            throw new Error("השרת החזיר תשובה לא תקינה. נסה שוב בעוד רגע.");
          }

          if (!response.ok) {
            const serverErr =
              typeof payload.error === "string" && payload.error.trim()
                ? payload.error.trim()
                : "העלאת התמונות נכשלה";
            throw new Error(serverErr);
          }
          if (
            typeof payload.error === "string" &&
            payload.error.trim() &&
            !Array.isArray(payload.items) &&
            !Array.isArray(payload.created)
          ) {
            throw new Error(payload.error.trim());
          }
          if (Array.isArray(payload.items)) {
            setGalleryImages(payload.items);
          } else if (Array.isArray(payload.created) && payload.created.length > 0) {
            const newlyCreated = payload.created;
            setGalleryImages((prev) => sortGalleryItemsLikeApi([...newlyCreated, ...prev]));
          } else {
            await loadGalleryItems(true, { silent: true });
          }
          lastPayload = payload;
        });
      }

      setGalleryAdminMessage(
        typeof lastPayload.message === "string" && lastPayload.message.trim()
          ? lastPayload.message.trim()
          : toUpload.length > 1
            ? `${toUpload.length} תמונות הועלו בהצלחה`
            : "התמונה נוספה בהצלחה"
      );
    } catch (error) {
      setGalleryAdminMessage(error instanceof Error ? error.message : "העלאת התמונות נכשלה");
    } finally {
      setIsUploadingGalleryImages(false);
      setGalleryCompressProgress(0);
      setGalleryUploadProgress(0);
      if (input) input.value = "";
    }
  };

  const deleteImage = async (id: string) => {
    if (!canManageGallery) {
      setGalleryAdminMessage("צריך לאמת קוד מנהל לפני מחיקה");
      return;
    }

    setGalleryAdminMessage("");
    await enqueueGalleryWrite(async () => {
      setDeletingGalleryItemId(id);
      try {
        const sessionToken = lastVerifiedGalleryCodeRef.current;
        if (!sessionToken) {
          throw new Error("יש לאמת מחדש קוד מנהל");
        }
        const formData = new FormData();
        formData.append("action", "delete");
        formData.append("id", id);

        const response = await fetch("/api/gallery", {
          method: "POST",
          cache: "no-store",
          headers: { "x-admin-session": sessionToken },
          body: formData
        });
        const payload = await safeParseResponseJson<{ error?: string; message?: string; items?: GalleryItem[] }>(
          response
        );
        if (!response.ok) {
          throw new Error(payload.error || "מחיקת התמונה נכשלה");
        }
        if (Array.isArray(payload.items)) {
          setGalleryImages(payload.items);
        } else {
          await loadGalleryItems(true, { silent: true });
        }
        setGalleryAdminMessage(payload.message || "התמונה נמחקה בהצלחה");
      } catch (error) {
        setGalleryAdminMessage(error instanceof Error ? error.message : "מחיקת התמונה נכשלה");
      } finally {
        setDeletingGalleryItemId(null);
        setDeleteConfirmId(null);
      }
    });
  };

  const reorderImages = async (id: string, direction: "forward" | "backward") => {
    if (!canManageGallery) return;
    const sessionToken = lastVerifiedGalleryCodeRef.current;
    if (!sessionToken) {
      setGalleryAdminMessage("יש לאמת מחדש קוד מנהל");
      return;
    }

    await enqueueGalleryWrite(async () => {
      const ordered = orderGalleryFeaturedFirst(galleryImagesRef.current);
      const currentIndex = ordered.findIndex((item) => item.id === id);
      if (currentIndex < 0) return;
      const targetIndex = direction === "forward" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= ordered.length) return;

      const previousOrder = galleryImagesRef.current;
      const optimistic = [...ordered];
      const [moved] = optimistic.splice(currentIndex, 1);
      optimistic.splice(targetIndex, 0, moved);
      setGalleryImages(optimistic);
      setReorderingGalleryItemId(id);
      setGalleryAdminMessage("");

      try {
        const response = await fetch("/api/gallery", {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            "x-admin-session": sessionToken
          },
          body: JSON.stringify({
            action: "reorder",
            orderedIds: optimistic.map((item) => item.id)
          })
        });
        const payload = await safeParseResponseJson<{ error?: string; message?: string; items?: GalleryItem[] }>(
          response
        );
        if (!response.ok) {
          throw new Error(payload.error || "סידור התמונות נכשל");
        }
        if (Array.isArray(payload.items)) {
          setGalleryImages(payload.items);
        } else {
          await loadGalleryItems(true, { silent: true });
        }
        setGalleryAdminMessage(payload.message || "סדר התמונות עודכן");
      } catch (error) {
        setGalleryImages(previousOrder);
        setGalleryAdminMessage(error instanceof Error ? error.message : "סידור התמונות נכשל");
      } finally {
        setReorderingGalleryItemId(null);
      }
    });
  };

  const toggleFeaturedImage = async (id: string, featured: boolean) => {
    if (!canManageGallery) {
      setGalleryAdminMessage("צריך לאמת קוד מנהל לפני סימון כוכב");
      return;
    }
    const sessionToken = lastVerifiedGalleryCodeRef.current;
    if (!sessionToken) {
      setGalleryAdminMessage("יש לאמת מחדש קוד מנהל");
      return;
    }

    setGalleryAdminMessage("");
    await enqueueGalleryWrite(async () => {
      const previousItems = galleryImagesRef.current;
      setFeaturedSavingId(id);
      setGalleryImages((prev) =>
        prev.map((item) => (item.id === id ? { ...item, featured } : item))
      );
      try {
        const response = await fetch("/api/gallery", {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            "x-admin-session": sessionToken
          },
          body: JSON.stringify({
            action: "toggle-featured",
            id,
            featured
          })
        });
        const payload = await safeParseResponseJson<{ error?: string; message?: string; items?: GalleryItem[] }>(
          response
        );
        if (!response.ok) {
          throw new Error(payload.error || "עדכון סימון הכוכב נכשל");
        }
        if (Array.isArray(payload.items)) {
          setGalleryImages(payload.items);
        }
        setGalleryAdminMessage(payload.message?.trim() || "סימון הכוכב עודכן");
      } catch (error) {
        setGalleryImages(previousItems);
        setGalleryAdminMessage(error instanceof Error ? error.message : "עדכון סימון הכוכב נכשל");
      } finally {
        setFeaturedSavingId(null);
      }
    });
  };

  const saveGalleryItemCaption = async (id: string, caption: string) => {
    if (!canManageGallery) {
      setGalleryAdminMessage("צריך לאמת קוד מנהל");
      return;
    }
    const sessionToken = lastVerifiedGalleryCodeRef.current;
    if (!sessionToken) {
      setGalleryAdminMessage("יש לאמת מחדש קוד מנהל");
      return;
    }
    setGalleryAdminMessage("");
    await enqueueGalleryWrite(async () => {
      const snapshot = galleryImagesRef.current;
      setCaptionSavingId(id);
      setGalleryImages((prev) =>
        prev.map((item) => (item.id === id ? { ...item, caption } : item))
      );
      try {
        const response = await fetch("/api/gallery", {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            "x-admin-session": sessionToken
          },
          body: JSON.stringify({
            action: "update-caption",
            id,
            caption
          })
        });
        const payload = await safeParseResponseJson<{ error?: string; message?: string; items?: GalleryItem[] }>(
          response
        );
        if (!response.ok) {
          throw new Error(payload.error || "עדכון הכיתוב נכשל");
        }
        if (Array.isArray(payload.items)) {
          setGalleryImages(payload.items);
        }
        setGalleryAdminMessage(
          typeof payload.message === "string" && payload.message.trim()
            ? payload.message.trim()
            : "כיתוב התמונה עודכן"
        );
      } catch (error) {
        setGalleryImages(snapshot);
        setGalleryAdminMessage(error instanceof Error ? error.message : "עדכון הכיתוב נכשל");
      } finally {
        setCaptionSavingId(null);
      }
    });
  };

  const openLightbox = (index: number, triggerElement?: HTMLElement | null) => {
    if (index < 0 || index >= featuredFirstGalleryItems.length) return;
    const item = featuredFirstGalleryItems[index];
    lightboxFocusedItemIdRef.current = item?.id ?? null;
    lastLightboxTriggerRef.current = triggerElement || null;
    setSelectedImageIndex(index);
    setIsLightboxOpen(true);
    setGalleryZoom(1);
    setLightboxDirection(null);
    setIsLightboxImageLoading(true);
  };
  const openGalleryByIndex = openLightbox;

  const previousImage = () => {
    if (selectedImageIndex === null || selectedImageIndex < 0) return;
    const prevIndex = selectedImageIndex === 0 ? featuredFirstGalleryItems.length - 1 : selectedImageIndex - 1;
    const item = featuredFirstGalleryItems[prevIndex];
    lightboxFocusedItemIdRef.current = item?.id ?? null;
    setLightboxDirection("prev");
    setSelectedImageIndex(prevIndex);
    setGalleryZoom(1);
    setIsLightboxImageLoading(true);
  };

  const nextImage = () => {
    if (selectedImageIndex === null || selectedImageIndex < 0) return;
    const nextIndex = selectedImageIndex === featuredFirstGalleryItems.length - 1 ? 0 : selectedImageIndex + 1;
    const item = featuredFirstGalleryItems[nextIndex];
    lightboxFocusedItemIdRef.current = item?.id ?? null;
    setLightboxDirection("next");
    setSelectedImageIndex(nextIndex);
    setGalleryZoom(1);
    setIsLightboxImageLoading(true);
  };

  const onGalleryTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    setGalleryTouchStartX(event.changedTouches[0]?.clientX ?? null);
    setGalleryTouchStartY(event.changedTouches[0]?.clientY ?? null);
  };

  const onGalleryTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (galleryTouchStartX === null || galleryTouchStartY === null) return;
    const touchEndX = event.changedTouches[0]?.clientX ?? galleryTouchStartX;
    const touchEndY = event.changedTouches[0]?.clientY ?? galleryTouchStartY;
    const deltaX = touchEndX - galleryTouchStartX;
    const deltaY = touchEndY - galleryTouchStartY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const horizontalSwipeThreshold = 50;
    const verticalCloseThreshold = 95;
    if (deltaY > 0 && absY >= verticalCloseThreshold && absY > absX * 1.15) {
      closeLightbox();
    } else if (absX >= horizontalSwipeThreshold && absX > absY * 1.05) {
      if (deltaX > 0) {
        previousImage();
      } else {
        nextImage();
      }
    }
    setGalleryTouchStartX(null);
    setGalleryTouchStartY(null);
  };

  const zoomInGallery = () => setGalleryZoom((prev) => Math.min(3, Number((prev + 0.25).toFixed(2))));
  const zoomOutGallery = () => setGalleryZoom((prev) => Math.max(1, Number((prev - 0.25).toFixed(2))));
  const resetGalleryZoom = () => setGalleryZoom(1);

  return (
    <section
      id="tabs"
      aria-label="מידע מפורט על השירות"
      className="mx-auto mb-16 mt-8 max-w-6xl scroll-mt-24 px-3 md:mb-14 md:mt-4 md:px-6 lg:max-w-7xl lg:px-8 xl:max-w-[88rem]"
    >
      <div className="section-shell relative overflow-hidden" data-active-tab={activeTab}>
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-0 w-[17%] min-w-[44px] max-w-[140px]">
          <span className="ambient-bubble ambient-bubble--sm ambient-bubble--glow" style={{ top: "10%", left: "8%", animationDelay: "-3s" }} />
          <span className="ambient-bubble ambient-bubble--md" style={{ top: "42%", left: "20%", animationDelay: "-8s" }} />
          <span className="ambient-bubble ambient-bubble--sm" style={{ top: "76%", left: "12%", animationDelay: "-13s" }} />
          <span className="ambient-bubble ambient-bubble--sm ambient-bubble--vivid" style={{ top: "28%", left: "4%", animationDelay: "-17s" }} />
          <span className="ambient-bubble ambient-bubble--md ambient-bubble--soft" style={{ top: "61%", left: "2%", animationDelay: "-22s" }} />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-0 w-[17%] min-w-[44px] max-w-[140px]">
          <span className="ambient-bubble ambient-bubble--md ambient-bubble--glow" style={{ top: "16%", right: "14%", animationDelay: "-6s" }} />
          <span className="ambient-bubble ambient-bubble--sm" style={{ top: "54%", right: "22%", animationDelay: "-11s" }} />
          <span className="ambient-bubble ambient-bubble--lg" style={{ top: "80%", right: "8%", animationDelay: "-16s" }} />
          <span className="ambient-bubble ambient-bubble--sm ambient-bubble--vivid" style={{ top: "34%", right: "4%", animationDelay: "-20s" }} />
          <span className="ambient-bubble ambient-bubble--md ambient-bubble--soft" style={{ top: "68%", right: "2%", animationDelay: "-25s" }} />
        </div>
        <div className="relative z-10">
        <h2 className="section-title">כל מה שצריך לדעת, במקום אחד</h2>
        <p className="section-subtitle">
          בחרו לשונית וקבלו מידע ברור על השירותים, המחירים, המיקומים ודרכי יצירת הקשר.
        </p>

        <div
          className="mx-auto mt-5 grid max-w-xl grid-cols-2 gap-2 sm:max-w-2xl sm:gap-3 lg:mx-0 lg:max-w-none lg:grid-cols-5 lg:gap-3 xl:gap-4"
          role="tablist"
          aria-label="לשוניות מידע"
          onKeyDown={handleTabListKeyDown}
        >
          {tabs.map((tab) => (
            <a
              key={tab.id}
              href={`/?tab=${tab.id}#tabs`}
              onClick={(event) => {
                event.preventDefault();
                setActiveTab(tab.id);
                if (typeof window !== "undefined") {
                  const url = new URL(window.location.href);
                  url.searchParams.set("tab", tab.id);
                  url.hash = "tabs";
                  const qs = url.searchParams.toString();
                  window.history.replaceState(
                    null,
                    "",
                    qs ? `${url.pathname}?${qs}#tabs` : `${url.pathname}#tabs`
                  );
                }
              }}
              role="tab"
              id={`tab-${tab.id}`}
              aria-controls={`panel-${tab.id}`}
              aria-selected={activeTab === tab.id}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full px-3 py-2 text-[13px] font-bold no-underline transition-transform duration-150 hover:-translate-y-[1px] sm:min-h-12 sm:px-4 sm:text-sm md:min-h-11"
              style={
                activeTab === tab.id
                  ? {
                      minHeight: "36px",
                      color: "#111827",
                      WebkitTextFillColor: "#111827",
                      textDecoration: "none",
                      background: "linear-gradient(180deg, #fde68a 0%, #fcd34d 100%)",
                      border: "1px solid #fcd34d",
                      boxShadow: "0 5px 14px rgba(0,0,0,0.24)"
                    }
                  : {
                      minHeight: "36px",
                      color: "#111827",
                      WebkitTextFillColor: "#111827",
                      textDecoration: "none",
                      background: "linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)",
                      border: "1px solid rgba(255,255,255,0.95)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
                    }
              }
            >
              {tab.label}
            </a>
          ))}
        </div>

        <div className="tab-panel mt-6 overflow-visible rounded-2xl bg-transparent p-4 text-[0.96rem] leading-7 md:mt-5 md:p-5 md:text-base md:leading-8">
          {activeTab === "services" ? (
            <div role="tabpanel" id="panel-services" aria-labelledby="tab-services" className="flex flex-col gap-5">
              <article className="overflow-hidden rounded-2xl bg-transparent p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative flex h-20 w-full shrink-0 items-center justify-center sm:h-24 sm:w-36">
                    <Image
                      src="/images/van-mobile-transparent.png"
                      alt="רכב שירות מסלול פלטינום"
                      width={240}
                      height={120}
                      unoptimized
                      sizes="(max-width: 768px) 96px, 128px"
                      className="h-16 w-32 object-contain opacity-100 [filter:drop-shadow(0_0_36px_rgba(56,189,248,0.55))_drop-shadow(0_0_56px_rgba(255,255,255,0.12))_drop-shadow(0_4px_14px_rgba(255,255,255,0.22))] sm:h-[4.5rem] sm:w-36"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2 text-right">
                    <div className="jacuzzi-track-headline-frame space-y-2">
                      <h3 className="text-xl font-extrabold text-cyan-300 md:text-2xl">מסלול פלטינום – עד הבית</h3>
                      <p className="text-neutral-100">
                        נוחות מלאה: אנחנו מגיעים אליכם עם כל הציוד הנדרש לטיפול מקצועי ומלא.
                      </p>
                    </div>
                  </div>
                </div>
              </article>
              <article className="overflow-hidden rounded-2xl bg-transparent p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative flex h-20 w-full shrink-0 items-center justify-center sm:h-24 sm:w-36">
                    <Image
                      src={truckPromoNobgSrc}
                      alt="משאית שירות מסלול פרימיום"
                      width={847}
                      height={318}
                      unoptimized
                      sizes="(max-width: 768px) 96px, 128px"
                      className="h-16 w-32 object-contain opacity-100 [filter:drop-shadow(0_0_36px_rgba(236,72,153,0.5))_drop-shadow(0_0_56px_rgba(255,255,255,0.12))_drop-shadow(0_4px_14px_rgba(255,255,255,0.22))] sm:h-[4.5rem] sm:w-36"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2 text-right">
                    <div className="jacuzzi-track-headline-frame space-y-2">
                      <h3 className="text-xl font-extrabold text-pink-300 md:text-2xl">
                        מסלול פרמיום - הגעה למשאית לפי השכונה שקרובה לך
                      </h3>
                      <p className="text-neutral-100">
                        מחיר משתלם יותר: אתם מגיעים למשאית במיקום הפעילות הקרוב אליכם.
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          ) : null}

          {activeTab === "pricing" ? (
            <div role="tabpanel" id="panel-pricing" aria-labelledby="tab-pricing" className="space-y-4">
              <p
                className="text-sm font-bold !text-[#d4af37]"
                style={{ color: "#d4af37", WebkitTextFillColor: "#d4af37" }}
              >
                מחירון תספורות ודילול
              </p>

              <div className="grid gap-4 lg:grid-cols-2">
                <article className="flex flex-col overflow-hidden rounded-2xl bg-transparent">
                  <div className="grid grid-cols-[auto_1fr] items-center gap-12 px-4 py-3 md:gap-14">
                    <Image
                      src="/images/van-mobile-transparent.png"
                      alt="רכב שירות עד הבית"
                      width={156}
                      height={80}
                      unoptimized
                      sizes="(max-width: 768px) 112px, 128px"
                      className="h-14 w-28 shrink-0 object-contain opacity-100 [filter:drop-shadow(0_0_36px_rgba(56,189,248,0.55))_drop-shadow(0_0_56px_rgba(255,255,255,0.12))_drop-shadow(0_4px_14px_rgba(255,255,255,0.22))] md:h-16 md:w-32"
                    />
                    <div className="ps-6 md:ps-8">
                      <div className="jacuzzi-track-headline-frame space-y-1">
                        <p className="text-sm font-bold text-cyan-200">מסלול פלטינום - עד הבית</p>
                        <p className="text-xs text-cyan-100">רכב שירות נייד לבית הלקוח</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col border-t border-cyan-300/8 pb-3">
                    <div className="grid w-full grid-cols-[minmax(86px,1fr)_minmax(118px,1fr)_minmax(118px,1fr)] gap-x-4 border-b border-cyan-300/6 px-4 py-2.5 text-xs font-semibold">
                      <div className="text-right" style={PRICING_COLUMN_HEADER_STYLE}>
                        משקל
                      </div>
                      <div className="text-right whitespace-nowrap" style={PRICING_COLUMN_HEADER_STYLE}>
                        מחיר לתספורת
                      </div>
                      <div className="text-right whitespace-nowrap" style={PRICING_COLUMN_HEADER_STYLE}>
                        מחיר לדילול
                      </div>
                    </div>
                    {combinedPricingRows.map((row) => (
                      <div
                        key={`platinum-${row.size}`}
                        className="grid w-full grid-cols-[minmax(86px,1fr)_minmax(118px,1fr)_minmax(118px,1fr)] gap-x-4 border-b border-cyan-300/6 px-4 py-2 text-sm last:border-b-0"
                      >
                        <div className="text-right whitespace-nowrap text-white">{row.size}</div>
                        <div className="text-right whitespace-nowrap font-semibold text-cyan-300">{row.haircutPlatinum}</div>
                        <div className="text-right whitespace-nowrap font-semibold text-cyan-200">{row.thinningPlatinum}</div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="flex flex-col overflow-hidden rounded-2xl bg-transparent">
                  <div className="grid grid-cols-[auto_1fr] items-center gap-12 px-4 py-3 md:gap-14">
                    <Image
                      src={truckPromoNobgSrc}
                      alt="משאית שירות פרימיום"
                      width={847}
                      height={318}
                      unoptimized
                      sizes="(max-width: 768px) 112px, 128px"
                      className="h-14 w-28 shrink-0 object-contain opacity-100 [filter:drop-shadow(0_0_36px_rgba(236,72,153,0.5))_drop-shadow(0_0_56px_rgba(255,255,255,0.12))_drop-shadow(0_4px_14px_rgba(255,255,255,0.22))] md:h-16 md:w-32"
                    />
                    <div className="ps-6 md:ps-8">
                      <div className="jacuzzi-track-headline-frame space-y-1">
                        <p className="text-sm font-bold text-pink-200">מסלול פרמיום - הגעה למשאית לפי השכונה שקרובה לך</p>
                        <p className="text-xs text-pink-100">מגיעים למשאית במיקום הפעילות</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col border-t border-pink-300/8 pb-3">
                    <div className="grid w-full grid-cols-[minmax(86px,1fr)_minmax(118px,1fr)_minmax(118px,1fr)] gap-x-4 border-b border-pink-300/6 px-4 py-2.5 text-xs font-semibold">
                      <div className="text-right" style={PRICING_COLUMN_HEADER_STYLE}>
                        משקל
                      </div>
                      <div className="text-right whitespace-nowrap" style={PRICING_COLUMN_HEADER_STYLE}>
                        מחיר לתספורת
                      </div>
                      <div className="text-right whitespace-nowrap" style={PRICING_COLUMN_HEADER_STYLE}>
                        מחיר לדילול
                      </div>
                    </div>
                    {combinedPricingRows.map((row) => (
                      <div
                        key={`premium-${row.size}`}
                        className="grid w-full grid-cols-[minmax(86px,1fr)_minmax(118px,1fr)_minmax(118px,1fr)] gap-x-4 border-b border-pink-300/6 px-4 py-2 text-sm last:border-b-0"
                      >
                        <div className="text-right whitespace-nowrap text-white">{row.size}</div>
                        <div className="text-right whitespace-nowrap font-semibold text-pink-300">{row.haircutPremium}</div>
                        <div className="text-right whitespace-nowrap font-semibold text-pink-200">{row.thinningPremium}</div>
                      </div>
                    ))}
                  </div>
                </article>

                <p className="text-xs text-neutral-300 lg:col-span-2">
                  המחיר הסופי נקבע לפי גודל הכלב, מצב הפרווה, קשרים, התנהגות הכלב וזמן הטיפול.
                </p>
              </div>
            </div>
          ) : null}

          {activeTab === "how" ? (
            <div role="tabpanel" id="panel-how" aria-labelledby="tab-how" className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                {howItWorksSteps.map((step, index) => (
                  <article key={step} className="rounded-2xl bg-transparent p-4">
                    <p className="text-xs font-bold text-cyan-300">שלב {index + 1}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{step}</p>
                  </article>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="!no-underline inline-flex min-h-12 w-fit items-center justify-center rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/12 px-6 py-3 text-center text-sm font-extrabold !text-yellow-100 shadow-[0_8px_22px_rgba(0,0,0,0.28)] transition hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/18 visited:!text-yellow-100 hover:!text-white focus:!text-white active:!text-white"
                  style={{
                    WebkitTapHighlightColor: "transparent",
                    textDecoration: "none"
                  }}
                >
                  שליחת הודעה לוואטסאפ לקביעת תור
                </a>
                <WhatsappConsentNote />
                <p className="text-xs text-neutral-200">ללקויי שמיעה: ניתן לבצע תיאום מלא גם בוואטסאפ, ללא שיחה טלפונית.</p>
              </div>
            </div>
          ) : null}

          {activeTab === "included" ? (
            <div role="tabpanel" id="panel-included" aria-labelledby="tab-included" className="space-y-5">
              <div className="-mt-8 mb-1 flex w-full justify-start ps-1" style={{ direction: "ltr" }}>
                <div className="flex flex-col items-start gap-2">
                  <a
                    href={`tel:${phoneNumbers.main.replace(/-/g, "")}`}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/12 px-4 py-2 text-sm font-extrabold text-[#F1D27A] shadow-[0_8px_18px_rgba(0,0,0,0.28)] transition hover:-translate-y-[1px] hover:bg-[#D4AF37]/20"
                  >
                    חייג מהיר
                  </a>
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/12 px-4 py-2 text-sm font-extrabold text-[#F1D27A] shadow-[0_8px_18px_rgba(0,0,0,0.28)] transition hover:-translate-y-[1px] hover:bg-[#D4AF37]/20"
                  >
                    קביעת תור בוואטסאפ
                  </a>
                  <WhatsappConsentNote tight />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {INCLUDED_TAB_CARDS.map((card) => (
                  <article
                    key={card.title}
                    className="group flex flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/75 via-sky-950/35 to-[#0a1628]/90 p-5 text-right shadow-[0_14px_40px_rgba(0,0,0,0.35)] ring-1 ring-[#D4AF37]/15 backdrop-blur-sm transition duration-200 hover:border-[#D4AF37]/25 hover:shadow-[0_18px_48px_rgba(0,0,0,0.42)]"
                  >
                    <span
                      className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/10 text-sm text-[#E8D48B]"
                      aria-hidden
                    >
                      {card.icon}
                    </span>
                    <h3 className="text-base font-extrabold text-white md:text-lg">{card.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-200/95">{card.description}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "about" ? (
            <div
              role="tabpanel"
              id="panel-about"
              aria-labelledby="tab-about"
              className="mx-auto max-w-4xl space-y-6 text-right text-[0.98rem] leading-8 text-neutral-100 md:space-y-8 md:text-[1.05rem] md:leading-9"
            >
              <p className="text-xl font-extrabold text-cyan-200 md:text-2xl">ברוכים הבאים לרשת JACUZZI</p>
              <p className="text-lg font-bold text-pink-200 md:text-xl">ספא ומספרת כלבים מקצועית ברמה גבוהה</p>

              <section className="space-y-3 border-t border-white/10 pt-5">
                <h3 className="text-base font-extrabold text-yellow-100 md:text-lg">ניסיון מוכח</h3>
                <p>
                  עם למעלה מ־10 שנות ניסיון בתחום וטיפול באלפי כלבים מכל הסוגים, רשת JACUZZI מציבה סטנדרט אחר של טיפולי
                  מספרה לכלבים - שילוב של מקצועיות, ידע, ציוד מתקדם וגישה נכונה לכל כלב.
                </p>
              </section>

              <section className="space-y-3 border-t border-white/10 pt-5">
                <h3 className="text-base font-extrabold text-yellow-100 md:text-lg">צוות מקצועי</h3>
                <p>
                  הצוות שלנו מורכב מספרים וספריות מקצועיים, שעברו הכשרות בארץ ובעולם, וכן הכשרה פנימית קפדנית בתוך
                  החברה, הכוללת מבחנים ברמה גבוהה. המטרה היא להבטיח לכל לקוח ביטחון מלא, ולכל כלב טיפול מותאם, מקצועי
                  ומדויק.
                </p>
              </section>

              <section className="space-y-3 border-t border-white/10 pt-5">
                <h3 className="text-base font-extrabold text-yellow-100 md:text-lg">מומחיות רחבה</h3>
                <p>אנו מתמחים במגוון רחב של טיפולי מספרה לכלבים:</p>
                <ul className="list-disc space-y-1 pe-5 text-neutral-100">
                  <li>תספורות בהתאמה אישית.</li>
                  <li>דילול פרווה.</li>
                  <li>טיפוח מלא ורחצה מקצועית.</li>
                  <li>ניקוי אוזניים, גזיזת ציפורניים וטיפולים משלימים.</li>
                </ul>
              </section>

              <button
                type="button"
                onClick={() => setIsAboutExpanded((prev) => !prev)}
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-yellow-300/20 px-4 py-2 text-sm font-extrabold text-yellow-100 transition hover:bg-yellow-300/30"
                aria-expanded={isAboutExpanded}
              >
                {isAboutExpanded ? "קרא פחות" : "קרא עוד"}
              </button>

              {isAboutExpanded ? (
                <div className="space-y-6 pt-6 md:space-y-8 animate-[tab-fade-in_220ms_ease-out]">
                  <section className="space-y-3 border-t border-white/10 pt-5">
                    <h3 className="text-base font-extrabold text-yellow-100 md:text-lg">התאמה אישית</h3>
                    <p>
                      כל טיפול מותאם לפי סוג הכלב, הגזע, מצב הפרווה, הגיל, המשקל, האופי והצרכים האישיים של הכלב - כדי
                      להגיע לתוצאה איכותית, נקייה ומדויקת, תוך שמירה על בריאות הפרווה ונוחות הכלב.
                    </p>
                  </section>

                  <section className="space-y-3 border-t border-white/10 pt-5">
                    <h3 className="text-base font-extrabold text-yellow-100 md:text-lg">רגישות והתנהגות</h3>
                    <p>
                      בנוסף, אנו מתמחים בעבודה עם כלבים בעלי אתגרים התנהגותיים, פחדים או רגישויות. חשוב לנו לדעת מראש
                      על כל רגישות, פחד, קושי או תגובה חריגה, כדי להתאים לכלב את הספר או הספרית המתאימים ביותר ואת שיטת
                      העבודה הנכונה עבורו.
                    </p>
                  </section>

                  <section className="space-y-3 border-t border-white/10 pt-5">
                    <h3 className="text-base font-extrabold text-yellow-100 md:text-lg">שיטת עבודה רגועה</h3>
                    <p>
                      שיטת העבודה שלנו מתחילה בהיכרות רגועה עם הכלב והלקוח, תיאום ציפיות מלא והבנה של מצב הפרווה והטיפול
                      הנדרש. במהלך הטיפול אנו מקפידים על עבודה מקצועית, סבלנית ומבוקרת - עם ליטופים, חטיפים, הרגלה
                      הדרגתית למכונה, למסרקים ולשלבי הטיפול השונים.
                    </p>
                  </section>

                  <section className="space-y-3 border-t border-white/10 pt-5">
                    <h3 className="text-base font-extrabold text-yellow-100 md:text-lg">בטיחות מעל הכול</h3>
                    <p>
                      במקרים המתאימים, הטיפול מתבצע כשהכלב משוחרר וללא קשירה, כדי להפחית תחושת לחץ ולאפשר חוויית טיפול
                      חיובית ובטוחה יותר. במקרים חריגים בלבד, כאשר הדבר נדרש לשמירה על בטיחות הכלב והצוות, ייתכן שימוש
                      בקשירה או במחסום - תמיד בשקיפות מלאה ובתיאום מול הלקוח.
                    </p>
                  </section>

                  <section className="space-y-4 border-t border-white/10 pt-5">
                    <h3 className="text-base font-extrabold text-cyan-200 md:text-lg">מסלולי שירות</h3>
                    <p>לנוחות הלקוחות, רשת JACUZZI מציעה שני מסלולי שירות:</p>

                    <div className="space-y-3 rounded-2xl bg-white/5 p-4 md:p-5">
                      <div className="flex items-start gap-4">
                        <Image
                          src="/images/van-mobile-transparent.png"
                          alt="רכב שירות מסלול פלטינום"
                          width={160}
                          height={80}
                          unoptimized
                          sizes="(max-width: 768px) 64px, 80px"
                          className="h-10 w-16 shrink-0 object-contain md:h-12 md:w-20"
                        />
                        <div className="jacuzzi-track-headline-frame min-w-0 flex-1">
                          <p className="text-base font-extrabold text-cyan-200 md:text-lg">
                            מסלול פלטינום - שירות נייד עד הבית
                          </p>
                        </div>
                      </div>
                      <p>
                        רכב טיפוח מקצועי ומאובזר מגיע עד פתח הבית, וכל תהליך הטיפול מתבצע בתוך הרכב מתחילתו ועד סופו.
                        הרכב כולל עמדת עבודה מקצועית, אזור רחצה, ציוד ייבוש, מכשור מתקדם וחומרי טיפוח איכותיים, ומאפשר
                        לכלב לקבל טיפול מלא בסביבה נקייה, ייעודית ומבוקרת - בלי צורך לצאת מהסביבה המוכרת לו.
                      </p>
                    </div>

                    <div className="space-y-3 rounded-2xl bg-white/5 p-4 md:p-5">
                      <div className="flex items-start gap-4">
                        <Image
                          src={truckPromoNobgSrc}
                          alt="משאית שירות מסלול פרימיום"
                          width={847}
                          height={318}
                          unoptimized
                          sizes="(max-width: 768px) 64px, 80px"
                          className="h-10 w-16 shrink-0 object-contain md:h-12 md:w-20"
                        />
                        <div className="jacuzzi-track-headline-frame min-w-0 flex-1">
                          <p className="text-base font-extrabold text-pink-200 md:text-lg">
                            מסלול פרמיום - הגעה למשאית לפי השכונה שקרובה לך
                          </p>
                        </div>
                      </div>
                      <p>
                        המשאית שלנו פועלת במיקומים משתנים ברחבי ירושלים והסביבה, בהתאם לביקוש ולאזורים נגישים עם חניה
                        נוחה. השירות במשאית מאפשר ליהנות מאותה רמת מקצועיות, ציוד איכותי וטיפול מותאם - במחיר משתלם
                        יותר ובקרבת מקום.
                      </p>
                    </div>
                  </section>

                  <section className="space-y-3 border-t border-white/10 pt-5">
                    <h3 className="text-base font-extrabold text-yellow-100 md:text-lg">ציוד וחומרים מקצועיים</h3>
                    <p>
                      במהלך כל טיפול אנו משתמשים בציוד מקצועי, פן ייעודי לכלבים או תא ייבוש בהתאם לצורך, ובחומרים איכותיים
                      המותאמים לסוג הפרווה ולמצב הכלב.
                    </p>
                  </section>

                  <section className="space-y-3 border-t border-white/10 pt-5">
                    <h3 className="text-base font-extrabold text-yellow-100 md:text-lg">שלבי המקלחת</h3>
                    <p>
                      במקלחת מתבצע טיפול יסודי עם שמפואים וחומרי טיפוח איכותיים, שטיפה מקצועית וייבוש מלא, בהתאם למה
                      שמתאים לכלב ולסוג הפרווה שלו.
                    </p>
                  </section>

                  <section className="space-y-3 border-t border-white/10 pt-5">
                    <h3 className="text-base font-extrabold text-yellow-100 md:text-lg">תיאום ציפיות</h3>
                    <p>הטיפול מתחיל תמיד בתיאום ציפיות מול הלקוח.</p>
                    <p>
                      יש מקרים שבהם מצב הפרווה, קשרים, ראסטות או אופי הכלב לא מאפשרים לבצע בדיוק את מה שהלקוח דמיין -
                      ולכן אנחנו מסבירים מראש מה אפשרי, מה נכון לכלב ומה ייתן את התוצאה הטובה ביותר.
                    </p>
                    <p>
                      המטרה שלנו היא לא רק שהכלב ייראה טוב, אלא שהטיפול יתבצע נכון. בסיום הטיפול אנחנו שואפים שכל כלב
                      יצא נקי, מטופח, רגוע וללא חוויה שלילית - ושכל לקוח יקבל ביטחון מלא שהוא בחר במקום הנכון.
                    </p>
                  </section>
                </div>
              ) : null}

              <div className="mt-6 flex w-full justify-start" style={{ direction: "ltr" }}>
                <div className="flex flex-col items-start gap-3">
                  <a
                    href={`tel:${phoneNumbers.main.replace(/-/g, "")}`}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/12 px-4 py-2 text-sm font-extrabold text-[#F1D27A] shadow-[0_8px_18px_rgba(0,0,0,0.28)] transition hover:-translate-y-[1px] hover:bg-[#D4AF37]/20"
                  >
                    חייג מהיר
                  </a>
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/12 px-4 py-2 text-sm font-extrabold text-[#F1D27A] shadow-[0_8px_18px_rgba(0,0,0,0.28)] transition hover:-translate-y-[1px] hover:bg-[#D4AF37]/20"
                  >
                    קביעת תור בוואטסאפ
                  </a>
                  <WhatsappConsentNote tight />
                </div>
              </div>

            </div>
          ) : null}

          {activeTab === "testimonials" ? (
            <div role="tabpanel" id="panel-testimonials" aria-labelledby="tab-testimonials" className="space-y-4">
              <p className="text-sm font-bold text-yellow-100">לקוחות משתפים על החוויה עם JACUZZI</p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRatingFilter("all")}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    ratingFilter === "all" ? "bg-yellow-300 text-brand-black" : "bg-yellow-300/15 text-yellow-100"
                  }`}
                >
                  הכל
                </button>
                <button
                  type="button"
                  onClick={() => setRatingFilter(5)}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    ratingFilter === 5 ? "bg-yellow-300 text-brand-black" : "bg-yellow-300/15 text-yellow-100"
                  }`}
                >
                  5 כוכבים
                </button>
                <button
                  type="button"
                  onClick={() => setRatingFilter(4)}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    ratingFilter === 4 ? "bg-yellow-300 text-brand-black" : "bg-yellow-300/15 text-yellow-100"
                  }`}
                >
                  4 כוכבים
                </button>
                <button
                  type="button"
                  onClick={() => setRatingFilter(3)}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    ratingFilter === 3 ? "bg-yellow-300 text-brand-black" : "bg-yellow-300/15 text-yellow-100"
                  }`}
                >
                  3 כוכבים
                </button>
              </div>
              <div className="grid gap-2 md:grid-cols-4">
                {pagedTestimonials.map((item, index) => {
                  const absoluteIndex = (testimonialsPage - 1) * TESTIMONIALS_PER_PAGE + index;
                  const reviewKey = `${item.name}-${item.area}-${absoluteIndex}`;
                  const isExpanded = expandedReviews[reviewKey] ?? false;
                  const shouldTruncate = item.review.length > REVIEW_PREVIEW_LENGTH;
                  const reviewText =
                    shouldTruncate && !isExpanded
                      ? `${item.review.slice(0, REVIEW_PREVIEW_LENGTH).trimEnd()}...`
                      : item.review;

                  return (
                    <article key={reviewKey} className="rounded-xl bg-white/5 p-3">
                      <p className="text-xs font-extrabold text-yellow-200">
                        {item.name} <span className="text-xs font-bold text-cyan-200">| {item.area}</span>
                      </p>
                      <p className="mt-1 text-sm text-yellow-200">{"★".repeat(item.rating)}</p>
                      <p className="mt-1 text-xs leading-6 text-neutral-100">{reviewText}</p>
                      {shouldTruncate ? (
                        <button
                          type="button"
                          onClick={() => toggleReview(reviewKey)}
                          className="mt-1 text-[11px] font-bold text-yellow-200 hover:text-yellow-100"
                        >
                          {isExpanded ? "הצג פחות" : "קרא עוד"}
                        </button>
                      ) : null}
                    </article>
                  );
                })}
              </div>

              {filteredTestimonials.length > TESTIMONIALS_PER_PAGE ? (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setTestimonialsPage((prev) => Math.max(1, prev - 1))}
                    disabled={testimonialsPage === 1}
                    className="rounded-lg bg-yellow-300/20 px-3 py-1 text-xs font-bold text-yellow-100 disabled:opacity-40"
                  >
                    הקודם
                  </button>
                  <span className="text-xs text-neutral-200">
                    עמוד {testimonialsPage} מתוך {totalTestimonialsPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTestimonialsPage((prev) => Math.min(totalTestimonialsPages, prev + 1))}
                    disabled={testimonialsPage === totalTestimonialsPages}
                    className="rounded-lg bg-yellow-300/20 px-3 py-1 text-xs font-bold text-yellow-100 disabled:opacity-40"
                  >
                    להמלצות נוספות
                  </button>
                </div>
              ) : null}

              <form onSubmit={handleReviewSubmit} className="rounded-2xl bg-white/5 p-4" noValidate>
                <p className="text-sm font-bold text-yellow-100">רוצים לשתף ביקורת? שלחו לנו והיא תעלה לאחר אישור.</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label htmlFor="review-author-name" className="text-xs font-bold text-cyan-100">
                      שם מלא <span className="text-yellow-200">(חובה)</span>
                    </label>
                    <input
                      id="review-author-name"
                      type="text"
                      name="reviewName"
                      autoComplete="name"
                      placeholder="שם מלא"
                      value={reviewName}
                      onChange={(event) => setReviewName(event.target.value)}
                      className="w-full rounded-xl bg-transparent px-3 py-2 text-sm text-white outline-none ring-1 ring-white/25 placeholder:text-neutral-300 focus:ring-yellow-300/60"
                      aria-required="true"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="review-author-area" className="text-xs font-bold text-cyan-100">
                      אזור מגורים <span className="text-yellow-200">(חובה)</span>
                    </label>
                    <input
                      id="review-author-area"
                      type="text"
                      name="reviewArea"
                      placeholder="אזור מגורים"
                      value={reviewArea}
                      onChange={(event) => setReviewArea(event.target.value)}
                      className="w-full rounded-xl bg-transparent px-3 py-2 text-sm text-white outline-none ring-1 ring-white/25 placeholder:text-neutral-300 focus:ring-yellow-300/60"
                      aria-required="true"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label htmlFor="review-rating-select" className="text-xs font-bold text-cyan-100">
                      דירוג
                    </label>
                    <select
                      id="review-rating-select"
                      name="reviewRating"
                      value={reviewRating}
                      onChange={(event) => setReviewRating(Number(event.target.value))}
                      className="w-full rounded-xl bg-transparent px-3 py-2 text-sm text-white outline-none ring-1 ring-white/25 focus:ring-yellow-300/60 md:max-w-xs"
                    >
                      <option value={5}>5 כוכבים</option>
                      <option value={4}>4 כוכבים</option>
                      <option value={3}>3 כוכבים</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <label htmlFor="review-body" className="text-xs font-bold text-cyan-100">
                    חוות דעת <span className="text-yellow-200">(חובה)</span>
                  </label>
                  <textarea
                    id="review-body"
                    name="reviewText"
                    placeholder="כתבו חוות דעת קצרה"
                    value={reviewText}
                    onChange={(event) => setReviewText(event.target.value)}
                    className="min-h-24 w-full rounded-xl bg-transparent px-3 py-2 text-sm text-white outline-none ring-1 ring-white/25 placeholder:text-neutral-300 focus:ring-yellow-300/60"
                    aria-required="true"
                  />
                </div>
                <div className="mt-3 flex items-start gap-2 text-xs text-neutral-200">
                  <input
                    id="review-privacy-approve"
                    type="checkbox"
                    checked={reviewPrivacyApproved}
                    onChange={(event) => setReviewPrivacyApproved(event.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30 bg-transparent accent-yellow-300"
                    aria-required="true"
                  />
                  <label htmlFor="review-privacy-approve" className="cursor-pointer">
                    קראתי ואני מאשר/ת את{" "}
                    <a
                      href="/privacy-policy"
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-cyan-200 underline underline-offset-2 hover:text-cyan-100"
                    >
                      מדיניות הפרטיות
                    </a>
                    ,{" "}
                    <a
                      href="/terms-of-use"
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-cyan-200 underline underline-offset-2 hover:text-cyan-100"
                    >
                      תנאי השימוש
                    </a>{" "}
                    ו{" "}
                    <a
                      href="/cancellation-policy"
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-cyan-200 underline underline-offset-2 hover:text-cyan-100"
                    >
                      מדיניות הביטולים
                    </a>
                    .
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="rounded-xl bg-yellow-300 px-5 py-2 text-sm font-extrabold text-brand-black disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmittingReview ? "שולח..." : "שליחת ביקורת לאישור"}
                  </button>
                  {reviewSubmitMessage ? (
                    <p
                      role={
                        /נכשל|נא למלא|יש לאשר/.test(reviewSubmitMessage) ? "alert" : "status"
                      }
                      aria-live={/נכשל|נא למלא|יש לאשר/.test(reviewSubmitMessage) ? "assertive" : "polite"}
                      className={`max-w-md text-xs font-bold ${
                        /נכשל|נא למלא|יש לאשר/.test(reviewSubmitMessage)
                          ? "border-s-4 border-red-400 ps-2 text-red-200"
                          : "text-yellow-100"
                      }`}
                    >
                      {reviewSubmitMessage}
                    </p>
                  ) : null}
                </div>
              </form>

              <div className="rounded-2xl bg-transparent p-4">
                <p className="text-sm font-bold text-yellow-100">ניהול המלצות (מנהל בלבד)</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    type="password"
                    placeholder="קוד מנהל"
                    value={adminCode}
                    onChange={(event) => setAdminCode(event.target.value)}
                    className="rounded-xl bg-transparent px-3 py-2 text-sm text-white outline-none ring-1 ring-white/25 placeholder:text-neutral-300 focus:ring-yellow-300/60"
                    aria-label="קוד מנהל לצפייה בביקורות ממתינות"
                  />
                  <button
                    type="button"
                    onClick={loadPendingReviews}
                    disabled={isModerationBusy}
                    className="rounded-xl bg-yellow-300 px-4 py-2 text-xs font-extrabold text-brand-black disabled:opacity-60"
                  >
                    {isModerationBusy ? "טוען..." : "הצג ביקורות ממתינות"}
                  </button>
                </div>
                {adminMessage ? (
                  <p className="mt-2 text-xs text-yellow-100">{adminMessage}</p>
                ) : null}
                {pendingReviews.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {pendingReviews.map((item) => (
                      <div key={item.id} className="rounded-xl bg-black/20 p-3">
                        <p className="text-xs font-extrabold text-yellow-200">
                          {item.name} <span className="text-cyan-200">| {item.area}</span>
                        </p>
                        <p className="mt-1 text-xs text-yellow-200">{"★".repeat(item.rating)}</p>
                        <p className="mt-1 text-xs leading-6 text-neutral-100">{item.review}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => moderateReview(item.id, "approve")}
                            className="rounded-lg bg-green-500/80 px-3 py-1 text-xs font-bold text-white"
                          >
                            אשר
                          </button>
                          <button
                            type="button"
                            onClick={() => moderateReview(item.id, "reject")}
                            className="rounded-lg bg-red-500/80 px-3 py-1 text-xs font-bold text-white"
                          >
                            דחה
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {activeTab === "gallery" ? (
            <div role="tabpanel" id="panel-gallery" aria-labelledby="tab-gallery" className="space-y-4">
              <div className="space-y-3 rounded-2xl border border-[#D4AF37]/22 bg-gradient-to-br from-white/[0.07] to-transparent p-4 shadow-[0_10px_30px_rgba(0,0,0,0.22)] md:p-5">
                <p className="text-base font-extrabold text-yellow-100 md:text-lg">
                  גלריית תספורות, דילולים וטיפוחים
                </p>
                <p className="text-sm font-semibold text-cyan-100/95">
                  אלפי כלבים מטופלים, מאות לקוחות חוזרים - תוצאות אמיתיות מהשטח.
                </p>
                <p className="text-xs leading-relaxed text-neutral-200 md:text-sm">
                  כאן תוכלו לראות תמונות אמיתיות של תספורות, דילולים וטיפוחים שבוצעו אצלנו - ללא פילטרים וללא קיצורי דרך.
                </p>
              </div>
              <div className="rounded-xl border border-[#d4af37]/22 bg-black/25 px-3 py-3 text-xs text-neutral-200 md:px-4">
                <span>רוצים גם תוצאה כזו? </span>
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessageGallery)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mx-1 inline-flex items-center rounded-lg bg-[#D4AF37]/15 px-2 py-0.5 text-xs font-extrabold text-[#F1D27A] no-underline ring-1 ring-[#D4AF37]/35 transition hover:bg-[#D4AF37]/25 hover:text-white active:scale-[0.98]"
                >
                  שלחו לנו הודעה בוואטסאפ
                </a>
                <span>עם פרטים ותמונה של הכלב, ונחזור אליכם עם התאמה והצעת מחיר.</span>
                <WhatsappConsentNote className="mt-3 border-[#d4af37]/18 bg-black/30" />
              </div>
              <p className="text-xs text-neutral-200">
                רוצים להוסיף תמונת לפני/אחרי? בקשו מהספר או הספרית לצלם לפני תחילת הטיפול ולאחר הסיום.
              </p>

              {!showGalleryGrid ? (
                <p className="min-h-[12rem] rounded-2xl border border-white/10 bg-black/15 px-3 py-10 text-center text-sm text-neutral-200">
                  טוען גלריה...
                </p>
              ) : (
              <div
                className="rounded-2xl border border-white/10 bg-black/15 p-2 shadow-inner md:p-3"
                onContextMenu={preventImageSave}
              >
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {pagedGalleryItems.map((item) => {
                  const currentDisplayIndex = featuredFirstGalleryItems.findIndex((galleryItem) => galleryItem.id === item.id);
                  const isFirstImage = currentDisplayIndex <= 0;
                  const isLastImage = currentDisplayIndex === featuredFirstGalleryItems.length - 1;
                  const priorityThumb = currentDisplayIndex >= 0 && currentDisplayIndex < 8;
                  const thumbReady = Boolean(galleryThumbLoaded[item.id]);
                  return (
                  <div key={item.id} className="space-y-1">
                  <figure className="gallery-tile group relative aspect-square overflow-hidden rounded-xl border-0 outline-none shadow-none">
                    <button
                      type="button"
                      aria-label={`פתיחת תמונה מוגדלת: ${item.treatmentName}`}
                      className="gallery-tile-button relative z-[1] flex h-full w-full appearance-none items-center justify-center border-0 bg-transparent p-0 text-right transition-[transform,box-shadow] duration-200 ease-out active:scale-[0.99]"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        openLightbox(currentDisplayIndex, event.currentTarget);
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter") return;
                        event.preventDefault();
                        event.stopPropagation();
                        openLightbox(currentDisplayIndex, event.currentTarget);
                      }}
                    >
                      {!thumbReady ? (
                        <span
                          className="gallery-tile-image absolute inset-0 z-0 block animate-pulse bg-neutral-800/70"
                          aria-hidden
                        />
                      ) : null}
                      <Image
                        src={item.image}
                        alt={`${item.treatmentName} - ${item.dogType}`}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 50vw, 25vw"
                        priority={priorityThumb}
                        loading={priorityThumb ? "eager" : "lazy"}
                        className={`gallery-tile-image relative z-[1] h-full w-full border-0 bg-transparent object-contain object-center outline-none ring-0 shadow-none transition-opacity duration-300 ease-out ${thumbReady ? "opacity-100" : "opacity-0"}`}
                        onLoadingComplete={() =>
                          setGalleryThumbLoaded((prev) => ({ ...prev, [item.id]: true }))
                        }
                        onContextMenu={preventImageSave}
                        onDragStart={preventImageSave}
                      />
                    </button>
                    {item.caption ? (
                      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] bg-gradient-to-t from-black/70 to-transparent p-2 text-right">
                        <p className="inline-flex rounded-full bg-black/55 px-2 py-0.5 text-[10px] text-yellow-100">
                          {item.caption}
                        </p>
                      </figcaption>
                    ) : null}
                    {canManageGallery ? (
                      <div className="absolute right-1 top-1 z-[35] flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void toggleFeaturedImage(item.id, !Boolean(item.featured));
                          }}
                          disabled={featuredSavingId === item.id}
                          aria-busy={featuredSavingId === item.id}
                          className={`flex h-7 min-w-[42px] items-center justify-center rounded-md px-1 text-[11px] font-extrabold transition ${
                            item.featured
                              ? "bg-yellow-400 text-black hover:bg-yellow-300"
                              : "bg-black/70 text-yellow-100 hover:bg-black"
                          } disabled:opacity-50`}
                          aria-label={item.featured ? "בטל כוכב — התמונה לא תוצג בתחילה" : "סמן כוכב — התמונה תוצג בתחילת הגלריה"}
                          title={item.featured ? "בטל כוכב" : "סמן כוכב (אפשר כמה תמונות)"}
                        >
                          {featuredSavingId === item.id ? (
                            <span className="text-[10px] font-bold" aria-hidden>
                              …
                            </span>
                          ) : (
                            <span aria-hidden>★</span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            reorderImages(item.id, "forward");
                          }}
                          disabled={reorderingGalleryItemId === item.id || isFirstImage}
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-black/70 text-[10px] font-bold text-white hover:bg-black disabled:opacity-50"
                          aria-label="העבר תמונה קדימה"
                          title="העבר קדימה"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            reorderImages(item.id, "backward");
                          }}
                          disabled={reorderingGalleryItemId === item.id || isLastImage}
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-black/70 text-[10px] font-bold text-white hover:bg-black disabled:opacity-50"
                          aria-label="העבר תמונה אחורה"
                          title="העבר אחורה"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteConfirmId(item.id);
                          }}
                          disabled={deletingGalleryItemId === item.id}
                          className="gallery-delete-btn flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white shadow-md ring-1 ring-red-400/60 hover:bg-red-500 disabled:opacity-60"
                          aria-label="מחיקת תמונה מהגלריה"
                          title="מחיקת תמונה"
                        >
                          {deletingGalleryItemId === item.id ? (
                            <span className="text-[10px] font-bold">…</span>
                          ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="h-4 w-4"
                            aria-hidden
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          )}
                        </button>
                      </div>
                    ) : null}
                  </figure>
                  {canManageGallery ? (
                    <button
                      type="button"
                      onClick={() => {
                        const shouldDelete = window.confirm("האם למחוק את התמונה לצמיתות?");
                        if (!shouldDelete) return;
                        void deleteImage(item.id);
                      }}
                      disabled={deletingGalleryItemId === item.id}
                      className="w-full rounded-lg bg-red-600/85 px-2 py-1 text-center text-xs font-extrabold text-white hover:bg-red-500 disabled:opacity-60"
                    >
                      {deletingGalleryItemId === item.id ? "מוחק..." : "מחיקה"}
                    </button>
                  ) : null}
                  {canManageGallery ? (
                    <div
                      className="pointer-events-auto mt-1.5 space-y-0.5 rounded-lg bg-black/45 px-2 py-1.5 ring-1 ring-white/15"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="block text-[10px] font-bold text-neutral-300">כיתוב (אופציונלי)</span>
                      <select
                        value={item.caption || ""}
                        onChange={(e) => {
                          e.stopPropagation();
                          void saveGalleryItemCaption(item.id, e.target.value);
                        }}
                        onBlur={(e) => {
                          e.stopPropagation();
                          void saveGalleryItemCaption(item.id, e.target.value);
                        }}
                        disabled={captionSavingId === item.id}
                        className="w-full cursor-pointer rounded-md border border-white/20 bg-neutral-900 px-1.5 py-1 text-[11px] text-white outline-none focus:ring-1 focus:ring-yellow-300/50 disabled:opacity-60"
                        aria-label={`כיתוב לתמונה ${item.treatmentName}`}
                      >
                        <option value="">ללא כיתוב</option>
                        {GALLERY_ALLOWED_CAPTIONS.map((cap) => (
                          <option key={cap} value={cap}>
                            {cap}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                  </div>
                );
                })}
              </div>
              </div>
              )}

              {showGalleryGrid && featuredFirstGalleryItems.length === 0 ? (
                <p className="rounded-xl bg-white/5 px-3 py-2 text-xs text-neutral-200">
                  אין תמונות בגלריה כרגע
                </p>
              ) : null}

              {showGalleryGrid &&
              !isDesktopGalleryViewport &&
              featuredFirstGalleryItems.length > pagedGalleryItems.length ? (
                <div className="flex items-center justify-center pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setMobileGalleryVisibleCount((prev) =>
                        Math.min(featuredFirstGalleryItems.length, prev + MOBILE_GALLERY_BATCH_SIZE)
                      )
                    }
                    className="rounded-lg bg-white/10 px-3 py-1 text-xs font-bold text-white"
                  >
                    טען עוד
                  </button>
                </div>
              ) : null}

              {showGalleryGrid &&
              isDesktopGalleryViewport &&
              featuredFirstGalleryItems.length > GALLERY_ITEMS_PER_PAGE ? (
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setGalleryPage((prev) => Math.max(1, prev - 1))}
                    disabled={galleryPage === 1}
                    className="rounded-lg bg-white/10 px-3 py-1 text-xs font-bold text-white disabled:opacity-40"
                  >
                    הקודם
                  </button>
                  <span className="text-xs text-neutral-200">
                    עמוד {galleryPage} מתוך {totalGalleryPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGalleryPage((prev) => Math.min(totalGalleryPages, prev + 1))}
                    disabled={galleryPage === totalGalleryPages}
                    className="rounded-lg bg-white/10 px-3 py-1 text-xs font-bold text-white disabled:opacity-40"
                  >
                    הבא
                  </button>
                </div>
              ) : null}

              {activeTab === "gallery" && isClient && isLightboxOpen && currentGalleryItem
                ? createPortal(
                    <div
                      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm sm:p-6 md:p-10"
                      style={{
                        position: "fixed",
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0
                      }}
                      role="dialog"
                      aria-modal="true"
                      aria-label="תמונה מוגדלת מהגלריה"
                      onClick={(event) => {
                        if (event.target === event.currentTarget) {
                          closeLightbox();
                        }
                      }}
                    >
                      <div
                        ref={lightboxContainerRef}
                        className="animate-[tab-fade-in_180ms_ease-out] mx-auto flex w-[min(92vw,560px)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-black shadow-lg shadow-black/40"
                        tabIndex={-1}
                        onClick={(event) => event.stopPropagation()}
                        onTouchStart={onGalleryTouchStart}
                        onTouchEnd={onGalleryTouchEnd}
                        style={{ touchAction: "none" }}
                      >
                        <>
                        <div
                          className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black px-3 py-2.5 sm:px-4"
                          style={{ backgroundColor: "#000" }}
                        >
                          <button
                            type="button"
                            onClick={closeLightbox}
                            className="min-h-10 min-w-[84px] rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-extrabold text-white transition hover:bg-white/20"
                            aria-label="סגירת תצוגת תמונה"
                          >
                            סגור
                          </button>
                          <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-1">
                            <p className="line-clamp-1 rounded-md bg-black px-2 py-0.5 text-center text-xs font-extrabold text-yellow-100 sm:text-sm">
                              {currentGalleryItem.treatmentName}
                            </p>
                            <p className="mt-0.5 rounded-md bg-black px-2 py-0.5 text-[10px] font-semibold text-neutral-300">
                              תמונה {selectedImageIndex !== null ? selectedImageIndex + 1 : 1} מתוך {featuredFirstGalleryItems.length}
                            </p>
                            {canManageGallery ? (
                              <button
                                type="button"
                                onClick={() => void toggleFeaturedImage(currentGalleryItem.id, !Boolean(currentGalleryItem.featured))}
                                disabled={featuredSavingId === currentGalleryItem.id}
                                aria-busy={featuredSavingId === currentGalleryItem.id}
                                className={`mt-1 rounded-md border px-2 py-0.5 text-[10px] font-extrabold transition ${
                                  currentGalleryItem.featured
                                    ? "border-yellow-300/80 bg-yellow-400/90 text-black hover:bg-yellow-300"
                                    : "border-white/30 bg-white/10 text-yellow-100 hover:bg-white/20"
                                } disabled:opacity-50`}
                                title={
                                  currentGalleryItem.featured
                                    ? "בטל כוכב — לא בתחילת הגלריה"
                                    : "סמן כוכב — בתחילת הגלריה (אפשר כמה)"
                                }
                                aria-label={
                                  currentGalleryItem.featured
                                    ? "בטל כוכב לתמונה זו"
                                    : "סמן כוכב לתמונה זו"
                                }
                              >
                                {featuredSavingId === currentGalleryItem.id
                                  ? "…"
                                  : currentGalleryItem.featured
                                    ? "★"
                                    : "☆"}
                              </button>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={closeLightbox}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D4AF37]/45 bg-[#D4AF37]/12 text-lg font-bold text-[#F5E6A8] transition hover:bg-[#D4AF37]/22"
                            aria-label="סגירה במקש X"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="relative min-h-0">
                          <div className="relative flex w-full items-center justify-center overflow-hidden bg-black px-2 py-2 sm:px-3 sm:py-3">
                            {isLightboxImageLoading ? (
                              <p className="absolute z-[1] rounded-full border border-white/20 bg-slate-900/80 px-3 py-1 text-xs font-bold text-cyan-100">
                                טוען תמונה...
                              </p>
                            ) : null}
                            <div
                              className="relative flex h-[64vh] w-full max-w-full shrink-0 items-center justify-center rounded-2xl bg-black sm:h-[68vh]"
                              style={{ backgroundColor: "#000" }}
                            >
                              <img
                                key={currentGalleryItem.id}
                                src={currentGalleryItem.image}
                                alt={`${currentGalleryItem.treatmentName} - ${currentGalleryItem.dogType}`}
                                className={`relative z-0 block h-full w-full rounded-2xl bg-black object-contain transition-transform duration-200 ${lightboxAnimationClass}`}
                                loading="eager"
                                draggable={false}
                                onContextMenu={preventImageSave}
                                onDragStart={preventImageSave}
                                style={{
                                  backgroundColor: "#000",
                                  transform: `scale(${galleryZoom})`,
                                  transformOrigin: "center center",
                                  transition: "transform 120ms ease",
                                  objectPosition: "center center",
                                  userSelect: "none",
                                  WebkitUserSelect: "none",
                                  WebkitTouchCallout: "none"
                                }}
                                onLoad={() => setIsLightboxImageLoading(false)}
                                onError={() => {
                                  setIsLightboxImageLoading(false);
                                  closeLightbox();
                                }}
                              />
                              {currentGalleryItem.caption ? (
                                <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-neutral-100">
                                  {currentGalleryItem.caption}
                                </span>
                              ) : null}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  previousImage();
                                }}
                                className="absolute z-[95] inline-flex h-11 min-w-[74px] items-center justify-center rounded-xl border-2 border-[#D4AF37] bg-[#111]/95 px-3 text-xs font-extrabold text-[#F5D97B] shadow-[0_10px_24px_rgba(0,0,0,0.6)] transition hover:bg-black active:scale-95"
                                style={{ right: "10px", top: "50%", transform: "translateY(-50%)" }}
                                aria-label="תמונה קודמת"
                                title="תמונה קודמת"
                              >
                                <span aria-hidden className="leading-none">‹ הקודם</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  nextImage();
                                }}
                                className="absolute z-[95] inline-flex h-11 min-w-[62px] items-center justify-center rounded-xl border-2 border-[#D4AF37] bg-[#111]/95 px-3 text-xs font-extrabold text-[#F5D97B] shadow-[0_10px_24px_rgba(0,0,0,0.6)] transition hover:bg-black active:scale-95"
                                style={{ left: "10px", top: "50%", transform: "translateY(-50%)" }}
                                aria-label="תמונה הבאה"
                                title="תמונה הבאה"
                              >
                                <span aria-hidden className="leading-none">הבא ›</span>
                              </button>
                            </div>
                          </div>
                        </div>
                        <div
                          className="flex flex-wrap items-center justify-center gap-2 border-t border-white/10 bg-black px-3 pb-3 pt-2 sm:px-4"
                          style={{ backgroundColor: "#000" }}
                        >
                          {canManageGallery ? (
                            <div
                              className="mb-1 flex w-full max-w-sm flex-col gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="text-center text-[10px] font-bold text-neutral-300">
                                כיתוב לתמונה הזו (נשמר מיד)
                              </span>
                              <select
                                value={currentGalleryItem.caption || ""}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  void saveGalleryItemCaption(currentGalleryItem.id, e.target.value);
                                }}
                                onBlur={(e) => {
                                  e.stopPropagation();
                                  void saveGalleryItemCaption(currentGalleryItem.id, e.target.value);
                                }}
                                disabled={captionSavingId === currentGalleryItem.id}
                                className="w-full rounded-md border border-white/25 bg-neutral-900 px-2 py-1.5 text-[11px] text-white outline-none focus:ring-1 focus:ring-yellow-300/50 disabled:opacity-60"
                                aria-label="בחירת כיתוב לתמונה בגלריה"
                              >
                                <option value="">ללא כיתוב</option>
                                {GALLERY_ALLOWED_CAPTIONS.map((cap) => (
                                  <option key={cap} value={cap}>
                                    {cap}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : null}
                          <span className="w-full rounded-md bg-black px-2 py-0.5 text-center text-[11px] text-neutral-200 sm:w-auto">
                            אפשר להחליק במובייל ימינה/שמאלה
                          </span>
                          <button
                            type="button"
                            onClick={zoomOutGallery}
                            disabled={galleryZoom <= 1}
                            aria-label="הקטנת תצוגת התמונה בגלריה"
                            className="rounded-xl border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white transition hover:bg-white/20 disabled:opacity-40"
                          >
                            זום -
                          </button>
                          <button
                            type="button"
                            onClick={zoomInGallery}
                            disabled={galleryZoom >= 3}
                            aria-label="הגדלת תצוגת התמונה בגלריה"
                            className="rounded-xl border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white transition hover:bg-white/20 disabled:opacity-40"
                          >
                            זום +
                          </button>
                          <button
                            type="button"
                            onClick={resetGalleryZoom}
                            disabled={galleryZoom === 1}
                            aria-label="איפוס זום בתצוגת הגלריה"
                            className="rounded-xl border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white transition hover:bg-white/20 disabled:opacity-40"
                          >
                            איפוס זום
                          </button>
                          <a
                            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessageGallery)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl border border-[#D4AF37]/60 bg-[#D4AF37]/15 px-3 py-1 text-xs font-bold text-[#D4AF37] transition hover:bg-[#D4AF37]/25"
                          >
                            רוצה תוצאה כזו? דברו איתנו
                          </a>
                        </div>
                        </>
                      </div>
                    </div>,
                    document.body
                  )
                : null}

              <div className="rounded-xl bg-white/[0.035] p-2.5 md:p-3">
                <p className="text-xs font-semibold text-yellow-100/85">ניהול גלריה (מנהל בלבד)</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <input
                    type="password"
                    placeholder="קוד מנהל"
                    value={galleryAdminCode}
                    onChange={(event) => {
                      setGalleryAdminCode(event.target.value);
                    }}
                    className="h-8 rounded-lg bg-white px-2.5 py-1 text-xs text-neutral-900 outline-none ring-1 ring-white/20 placeholder:text-neutral-500 focus:ring-yellow-300/50"
                    aria-label="קוד מנהל להעלאת תמונות לגלריה"
                  />
                  <button
                    type="button"
                    onClick={verifyGalleryAdminCode}
                    disabled={isVerifyingGalleryAdminCode}
                    className="h-8 rounded-lg bg-yellow-300 px-2.5 py-1 text-[11px] font-bold text-brand-black disabled:opacity-60"
                  >
                    {isVerifyingGalleryAdminCode ? "מאמת..." : "אמת קוד מנהל"}
                  </button>
                  {canManageGallery ? (
                    <span className="rounded-md bg-green-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-green-200">
                      מצב מנהל פעיל
                    </span>
                  ) : null}
                  {canManageGallery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsGalleryAdminAuthorized(false);
                        lastVerifiedGalleryCodeRef.current = null;
                        setDeleteConfirmId(null);
                        try {
                          sessionStorage.removeItem(GALLERY_ADMIN_SESSION_KEY);
                        } catch {
                          // ignore
                        }
                      }}
                      className="rounded-md bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-red-200 hover:bg-red-500/30"
                    >
                      יציאה ממצב מנהל
                    </button>
                  ) : null}
                </div>

                {canManageGallery ? (
                  <div className="mt-4 border-t border-white/10 pt-3">
                    <p className="mb-1 text-[11px] text-neutral-300">
                      ★ בתחילת הגלריה — אפשר לסמן כמה תמונות; השאר אחרי כל המסומנות.
                    </p>
                    <p className="mb-2 text-xs font-bold text-cyan-100">העלאת תמונות לגלריה</p>
                    <label className="block cursor-pointer rounded-xl bg-cyan-400/15 px-3 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-400/25">
                      {isUploadingGalleryImages
                        ? `מכווץ ומעלה… דחיסה ${galleryCompressProgress}% · העלאה ${galleryUploadProgress}%`
                        : "בחר תמונות להעלאה"}
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                        multiple
                        disabled={isUploadingGalleryImages}
                        onChange={uploadImages}
                        className="sr-only"
                      />
                    </label>
                    <label className="mt-2 block text-xs text-neutral-200">
                      כיתוב ברירת מחדל (לכל התמונות בבחירה הנוכחית; אחרי ההעלאה אפשר לכוון כל תמונה בנפרד)
                      <select
                        value={uploadCaption}
                        onChange={(event) => setUploadCaption(event.target.value)}
                        className="mt-1 w-full rounded-lg bg-white px-2 py-2 text-xs text-neutral-900 outline-none ring-1 ring-white/25"
                      >
                        <option value="">ללא כיתוב</option>
                        {GALLERY_ALLOWED_CAPTIONS.map((cap) => (
                          <option key={cap} value={cap}>
                            {cap}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : null}

                {galleryAdminMessage ? (
                  <p className="mt-2 text-xs text-yellow-100">{galleryAdminMessage}</p>
                ) : null}
              </div>

              {activeTab === "gallery" && isClient && canManageGallery && deleteConfirmId
                ? createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                  <div className="w-full max-w-sm rounded-2xl bg-[#0f172a] p-4 shadow-2xl ring-1 ring-white/15">
                    <p className="text-sm font-bold text-white">האם למחוק את התמונה לצמיתות?</p>
                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        className="rounded-lg bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20"
                      >
                        ביטול
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteImage(deleteConfirmId)}
                        disabled={deletingGalleryItemId === deleteConfirmId}
                        className="rounded-lg bg-red-500/85 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-60"
                      >
                        מחיקה
                      </button>
                    </div>
                  </div>
                </div>
                  ,
                  document.body
                )
                : null}
            </div>
          ) : null}

          {activeTab === "location" ? (
            <div role="tabpanel" id="panel-location" aria-labelledby="tab-location" className="space-y-4">
              <div className="rounded-2xl bg-yellow-300/10 px-4 py-3 text-right">
                <p className="text-sm font-bold text-yellow-100">
                  נשמח לקבל אתכם במשאית בשעות הפעילות. לתיאום תספורת יש לקבוע תור מראש דרך המוקד או מול הספר/ית.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {monthlyLocations.map((location, index) => (
                  <article
                    key={`${location.date}-${location.area}-${index}-card`}
                    className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-b from-white/[0.06] to-transparent p-4 text-right shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
                  >
                    <p className="text-xs font-bold text-cyan-200">{location.date || "-"}</p>
                    <p className="mt-1.5 text-sm font-extrabold text-white">{location.area || "-"}</p>
                    <p className="mt-2 text-xs leading-relaxed text-neutral-200">{location.address || "-"}</p>
                    <p className="mt-2 text-xs font-semibold text-pink-100">{location.hours || "-"}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {location.address ? (
                        <>
                          <a
                            href={`https://www.waze.com/ul?q=${encodeURIComponent(location.address)}&navigate=yes`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-9 min-w-[92px] flex-1 items-center justify-center rounded-lg bg-[#D4AF37]/22 px-2 py-1.5 text-center text-[11px] font-bold text-[#F5E6A8] hover:bg-[#D4AF37]/35"
                          >
                            נווט בווייז
                          </a>
                          <button
                            type="button"
                            onClick={() => copyAddress(location.address || "")}
                            className="inline-flex min-h-9 min-w-[92px] flex-1 items-center justify-center rounded-lg bg-cyan-400/18 px-2 py-1.5 text-center text-[11px] font-bold text-cyan-100 hover:bg-cyan-400/28"
                          >
                            העתק כתובת
                          </button>
                        </>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-sm font-bold text-yellow-100">מיקום המשאית מתעדכן אחת לחודש עבור החודש הבא. מוזמנים להתעדכן כאן באתר או לשלוח לנו הודעה בוואטסאפ.</p>
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessageTruckLocation)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl bg-[#D4AF37]/85 px-4 py-2 text-xs font-extrabold text-brand-black no-underline hover:bg-[#D4AF37]"
                >
                  שליחת הודעה בוואטסאפ
                </a>
                <WhatsappConsentNote className="mt-2" />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    type="password"
                    placeholder="קוד מנהל"
                    value={locationAdminCode}
                    onChange={(event) => {
                      setLocationAdminCode(event.target.value);
                      setIsLocationAdminAuthorized(false);
                    }}
                    className="rounded-xl bg-white px-3 py-2 text-sm text-neutral-900 outline-none ring-1 ring-white/25 placeholder:text-neutral-500 focus:ring-yellow-300/60"
                    aria-label="קוד מנהל לעדכון מיקום משאית"
                  />
                  <button
                    type="button"
                    onClick={verifyLocationAdminCode}
                    disabled={isVerifyingLocationAdminCode}
                    className="rounded-xl bg-yellow-300 px-4 py-2 text-xs font-extrabold text-brand-black disabled:opacity-60"
                  >
                    {isVerifyingLocationAdminCode ? "מאמת..." : "אמת קוד מנהל"}
                  </button>
                </div>

                {isLocationAdminAuthorized ? (
                  <>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={addEditableLocationRow}
                        className="rounded-xl bg-cyan-400/20 px-3 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-400/30"
                      >
                        הוסף שורה
                      </button>
                      <button
                        type="button"
                        onClick={restoreLastTruckLocations}
                        disabled={isRestoringLocations}
                        className="rounded-xl bg-white/10 px-4 py-2 text-xs font-extrabold text-white disabled:opacity-60"
                      >
                        {isRestoringLocations ? "משחזר..." : "שחזר גרסה אחרונה"}
                      </button>
                      <button
                        type="button"
                        onClick={saveTruckLocations}
                        disabled={isSavingLocations}
                        className="rounded-xl bg-yellow-300 px-4 py-2 text-xs font-extrabold text-brand-black disabled:opacity-60"
                      >
                        {isSavingLocations ? "שומר..." : "שמור מיקומים"}
                      </button>
                    </div>

                    <div className="mt-3 space-y-2">
                      {editableLocations.map((row, index) => (
                        <div key={`admin-location-${index}`} className="grid gap-2 rounded-xl bg-black/20 p-3 md:grid-cols-5">
                          <input
                            type="text"
                            placeholder="תאריך/טווח תאריכים"
                            value={row.date}
                            onChange={(event) => updateEditableLocation(index, "date", event.target.value)}
                            className="rounded-lg bg-white px-3 py-2 text-xs text-neutral-900 outline-none ring-1 ring-white/20 placeholder:text-neutral-500 focus:ring-yellow-300/50"
                          />
                          <input
                            type="text"
                            placeholder="אזור"
                            value={row.area}
                            onChange={(event) => updateEditableLocation(index, "area", event.target.value)}
                            className="rounded-lg bg-white px-3 py-2 text-xs text-neutral-900 outline-none ring-1 ring-white/20 placeholder:text-neutral-500 focus:ring-yellow-300/50"
                          />
                          <input
                            type="text"
                            placeholder="כתובת"
                            value={row.address}
                            onChange={(event) => updateEditableLocation(index, "address", event.target.value)}
                            className="rounded-lg bg-white px-3 py-2 text-xs text-neutral-900 outline-none ring-1 ring-white/20 placeholder:text-neutral-500 focus:ring-yellow-300/50"
                          />
                          <input
                            type="text"
                            placeholder="שעות פעילות"
                            value={row.hours}
                            onChange={(event) => updateEditableLocation(index, "hours", event.target.value)}
                            className="rounded-lg bg-white px-3 py-2 text-xs text-neutral-900 outline-none ring-1 ring-white/20 placeholder:text-neutral-500 focus:ring-yellow-300/50"
                          />
                          <button
                            type="button"
                            onClick={() => removeEditableLocationRow(index)}
                            className="rounded-lg bg-red-500/70 px-3 py-2 text-xs font-bold text-white hover:bg-red-500/85"
                          >
                            מחק
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}

                {locationAdminMessage ? (
                  <p className="mt-2 text-xs text-yellow-100">{locationAdminMessage}</p>
                ) : null}
              </div>

            </div>
          ) : null}

          {activeTab === "faq" ? (
            <div role="tabpanel" id="panel-faq" aria-labelledby="tab-faq" className="space-y-4">
              <div className="rounded-2xl border border-[#D4AF37]/22 bg-gradient-to-br from-white/[0.06] to-transparent p-4 shadow-[0_10px_28px_rgba(0,0,0,0.22)] md:flex md:flex-row-reverse md:items-center md:justify-between md:gap-6 md:p-5">
                <p className="text-sm leading-relaxed text-neutral-100 md:max-w-xl md:flex-1">
                  ריכזנו כאן את כל מה שחשוב לדעת לפני טיפול - אם יש שאלה נוספת, תמיד אפשר לפנות אלינו בוואטסאפ.
                </p>
                <div className="mt-4 flex w-full flex-col gap-2 md:mt-0 md:w-auto md:min-w-[200px]" style={{ direction: "ltr" }}>
                  <a
                    href={`tel:${phoneNumbers.main.replace(/-/g, "")}`}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#D4AF37]/45 bg-[#D4AF37]/14 px-4 py-2 text-sm font-extrabold text-[#F1D27A] shadow-[0_8px_18px_rgba(0,0,0,0.28)] transition hover:bg-[#D4AF37]/22"
                  >
                    חייג מהיר
                  </a>
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#D4AF37]/45 bg-[#D4AF37]/14 px-4 py-2 text-sm font-extrabold text-[#F1D27A] shadow-[0_8px_18px_rgba(0,0,0,0.28)] transition hover:bg-[#D4AF37]/22"
                  >
                    קביעת תור בוואטסאפ
                  </a>
                  <WhatsappConsentNote tight />
                </div>
              </div>
              <div className="space-y-2">
                {faqItems.map((item) => (
                  <details
                    key={item.question}
                    className="group rounded-2xl border border-white/12 bg-white/[0.04] p-1 shadow-[0_6px_20px_rgba(0,0,0,0.15)] open:border-[#D4AF37]/35 open:bg-white/[0.06]"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3.5 font-bold text-yellow-100 outline-none transition hover:bg-yellow-300/[0.07] focus-visible:ring-2 focus-visible:ring-yellow-300/70 focus-visible:ring-offset-0 md:py-4">
                      <span className="text-right text-[0.95rem] leading-snug">{item.question}</span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-yellow-300/25 bg-black/25 text-lg font-light text-yellow-200 transition group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="border-t border-white/10 px-4 pb-4 pt-3 text-sm leading-relaxed text-neutral-200">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "contact" ? (
            <div role="tabpanel" id="panel-contact" aria-labelledby="tab-contact" className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#D4AF37]/22 bg-gradient-to-br from-white/[0.07] to-transparent p-5 shadow-[0_12px_32px_rgba(0,0,0,0.24)]">
                <p className="text-lg font-bold text-cyan-200">טלפונים</p>
                <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
                  <p className="text-lg font-semibold tracking-wide text-white">{phoneNumbers.main}</p>
                  <p className="text-lg font-semibold tracking-wide text-white">{phoneNumbers.mobileVan}</p>
                  <p className="text-lg font-semibold tracking-wide text-white">{phoneNumbers.truck}</p>
                </div>
                <p className="mt-4 rounded-xl bg-black/20 px-3 py-2 text-xs leading-relaxed text-neutral-200">
                  ללקויי שמיעה: ניתן לבצע תיאום מלא בוואטסאפ ללא צורך בשיחה.
                </p>
              </div>
              <div className="flex min-h-[10rem] flex-col gap-3">
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="!no-underline flex min-h-[10rem] flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-[#D4AF37]/40 bg-gradient-to-br from-[#D4AF37]/22 via-[#0a1628]/50 to-black/55 px-5 py-6 text-center shadow-[0_14px_36px_rgba(0,0,0,0.38)] ring-1 ring-[#d4af37]/15 transition hover:border-[#D4AF37]/55 hover:from-[#D4AF37]/28 hover:shadow-[0_18px_44px_rgba(0,0,0,0.45)]"
                  style={{ color: "#fde68a", WebkitTextFillColor: "#fde68a", textDecoration: "none" }}
                >
                  <span className="rounded-full border border-[#d4af37]/35 bg-black/35 px-4 py-1 text-[11px] font-bold text-[#fde68a]">
                    צ׳אט מהיר
                  </span>
                  <span className="text-lg font-bold text-yellow-50">וואטסאפ — הכי מהיר</span>
                  <span className="max-w-[17rem] text-sm font-semibold leading-relaxed text-yellow-100/95">
                    שלחו פרטים ותמונה של הכלב לקביעת תור
                  </span>
                </a>
                <WhatsappConsentNote tight className="w-full shrink-0" />
              </div>
            </div>
          ) : null}
        </div>
        </div>
      </div>
    </section>
  );
}
