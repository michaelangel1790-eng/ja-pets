"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import "./accessibility-fab.css";

type LineHeightMode = "normal" | "relaxed" | "loose";
type TextAlignMode = "default" | "center" | "justify";

type AccessibilitySettings = {
  fontScale: number;
  /** Page display zoom (main content only). */
  pageZoom: number;
  grayscale: boolean;
  highContrast: boolean;
  invertedColors: boolean;
  sepia: boolean;
  lightBackground: boolean;
  blackYellowContrast: boolean;
  highlightLinks: boolean;
  highlightHeadings: boolean;
  readableFont: boolean;
  /** Lexend / dyslexia-friendly rhythm (common accessibility toolbar option). */
  dyslexiaFriendlyFont: boolean;
  /** Show image alternative text below images (WCAG 1.1). */
  showImageDescriptions: boolean;
  /** Hide images in main content (reading aid). */
  hideImages: boolean;
  /** Letter- and word-spacing boost. */
  textSpacingWide: boolean;
  lineHeightMode: LineHeightMode;
  textAlignMode: TextAlignMode;
  reduceMotion: boolean;
  /** Stronger suppression of motion / flashes (WCAG 2.3). */
  stopFlashing: boolean;
  /** Enhanced visible focus for keyboard users (WCAG 2.4.7). */
  keyboardFocusEnhanced: boolean;
  /** Horizontal reading ruler / mask (cognitive aid). */
  readingMask: boolean;
  cursorBlack: boolean;
  cursorLarge: boolean;
};

type FabPosition = { l: number; b: number };

const STORAGE_KEY = "site_accessibility_settings_v1";
/** נוכחי - ברירת מחדל פינה תחתונה־שמאלית; גרירה נשמרת כאן */
const FAB_POS_KEY = "jacuzzi_a11y_fab_pos_v6";
/** מיגרציה חד־פעמית ממפתח קודם */
const FAB_POS_V5_FALLBACK = "jacuzzi_a11y_fab_pos_v5";
const FAB_POS_PREV_KEY = "jacuzzi_a11y_fab_pos_v4";
const FAB_POS_LEGACY_KEY = "jacuzzi_a11y_fab_pos_v2";

/** גודל לחישוב גבולות גרירה (דסקטופ 48px; במובייל הכפתור 32px עם מרווח בטיחות) */
const FAB_CLAMP_SIZE = 48;
const DRAG_THRESHOLD_PX = 8;
const FAB_DRAG_ENABLED = false;

const MENU_ID = "jacuzzi-accessibility-menu";
const ALT_CAPTION_MARK = "data-jacuzzi-alt-caption";

const PAGE_ZOOM_MIN = 0.85;
const PAGE_ZOOM_MAX = 1.25;
const PAGE_ZOOM_STEP = 0.05;

function removeImageAltCaptions(root: HTMLElement) {
  root.querySelectorAll(`[${ALT_CAPTION_MARK}]`).forEach((el) => el.remove());
}

function applyImageAltCaptions(root: HTMLElement) {
  removeImageAltCaptions(root);
  root.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
    const alt = img.getAttribute("alt");
    if (!alt?.trim()) return;
    const cap = document.createElement("div");
    cap.className = "jacuzzi-a11y-alt-caption";
    cap.setAttribute(ALT_CAPTION_MARK, "1");
    cap.setAttribute("role", "note");
    cap.textContent = alt.trim();
    const galleryTile = img.closest("figure.gallery-tile");
    if (galleryTile) {
      cap.classList.add("jacuzzi-a11y-alt-caption--overlay");
      galleryTile.appendChild(cap);
      return;
    }
    img.insertAdjacentElement("afterend", cap);
  });
}
const READER_RATE_BY_LEVEL: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 0.65,
  2: 0.8,
  3: 1.0,
  4: 1.2,
  5: 1.4
};

function isElementHiddenForReading(el: Element): boolean {
  const node = el as HTMLElement;
  if (node.hidden) return true;
  if (node.getAttribute("aria-hidden") === "true") return true;
  const style = window.getComputedStyle(node);
  return style.display === "none" || style.visibility === "hidden";
}

function getActiveReadableRoot(): HTMLElement | null {
  const tabsRoot = document.getElementById("tabs");
  if (!tabsRoot) return document.getElementById("main-content");
  const panels = Array.from(tabsRoot.querySelectorAll<HTMLElement>("[role='tabpanel']"));
  const activePanel =
    panels.find((panel) => {
      if (isElementHiddenForReading(panel)) return false;
      const parentHidden = panel.closest("[hidden],[aria-hidden='true']");
      if (parentHidden) return false;
      return true;
    }) ?? null;
  if (activePanel) return activePanel;
  return document.getElementById("main-content");
}

function collectReadableText(root: HTMLElement): string {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const parts: string[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!(node instanceof Text)) continue;
    const value = node.nodeValue?.replace(/\s+/g, " ").trim();
    if (!value) continue;
    const parent = node.parentElement;
    if (!parent) continue;
    const tag = parent.tagName.toLowerCase();
    if (tag === "script" || tag === "style" || tag === "noscript") continue;
    if (isElementHiddenForReading(parent)) continue;
    if (parent.closest("[hidden],[aria-hidden='true']")) continue;
    parts.push(value);
  }
  return parts.join(". ");
}

function getViewportLayoutSize(): { vw: number; vh: number } {
  if (typeof window === "undefined") return { vw: 390, vh: 800 };
  const vv = window.visualViewport;
  const iw = window.innerWidth;
  const ih = window.innerHeight;
  let vw = vv && vv.width > 1 ? vv.width : iw;
  let vh = vv && vv.height > 1 ? vv.height : ih;
  if (iw >= 768 && ih > 240 && vh < ih * 0.82) {
    vh = ih;
  }
  return { vw: Math.max(vw, 200), vh: Math.max(vh, 200) };
}

function bottomChromeReservePx(): number {
  if (typeof window === "undefined") return 120;
  return window.matchMedia("(max-width: 767px)").matches ? 128 : 72;
}

/** ברירת מחדל: פינה תחתונה־שמאלית - מרחק מהקצה הפיזי השמאלי של המסך */
function defaultFabInsetLeftPx(_vw: number): number {
  return 2;
}

function migrateStoredFabLeftForDesktop(l: number, _vw: number): number {
  return l;
}

/** ברירת מחדל: תחתית המסך, מעל רזרבת כפתורים צפים (ווטסאפ / זכויות יוצרים) */
function defaultFabBottomPx(_vw: number): number {
  return bottomChromeReservePx() + 10;
}

const defaultSettings: AccessibilitySettings = {
  fontScale: 1,
  pageZoom: 1,
  grayscale: false,
  highContrast: false,
  invertedColors: false,
  sepia: false,
  lightBackground: false,
  blackYellowContrast: false,
  highlightLinks: false,
  highlightHeadings: false,
  readableFont: false,
  dyslexiaFriendlyFont: false,
  showImageDescriptions: false,
  hideImages: false,
  textSpacingWide: false,
  lineHeightMode: "normal",
  textAlignMode: "default",
  reduceMotion: false,
  stopFlashing: false,
  keyboardFocusEnhanced: false,
  readingMask: false,
  cursorBlack: false,
  cursorLarge: false
};

function normalizeAccessibilitySettings(raw: Partial<AccessibilitySettings>): AccessibilitySettings {
  const zoomRaw =
    typeof raw.pageZoom === "number" && Number.isFinite(raw.pageZoom) ? raw.pageZoom : defaultSettings.pageZoom;
  const pageZoom = Math.min(PAGE_ZOOM_MAX, Math.max(PAGE_ZOOM_MIN, Math.round(zoomRaw * 100) / 100));
  const dyslexiaFriendlyFont = raw.dyslexiaFriendlyFont === true;
  const readableFont = raw.readableFont === true && !dyslexiaFriendlyFont;
  const motionOn = raw.reduceMotion === true || raw.stopFlashing === true;
  const normalized: AccessibilitySettings = {
    fontScale:
      typeof raw.fontScale === "number" && Number.isFinite(raw.fontScale)
        ? Math.min(1.55, Math.max(0.88, raw.fontScale))
        : defaultSettings.fontScale,
    pageZoom,
    grayscale: raw.grayscale === true,
    highContrast: raw.highContrast === true,
    invertedColors: raw.invertedColors === true,
    sepia: raw.sepia === true,
    lightBackground: raw.lightBackground === true,
    blackYellowContrast: raw.blackYellowContrast === true,
    highlightLinks: raw.highlightLinks === true,
    highlightHeadings: raw.highlightHeadings === true,
    readableFont,
    showImageDescriptions: raw.showImageDescriptions === true,
    reduceMotion: motionOn,
    stopFlashing: motionOn,
    keyboardFocusEnhanced: raw.keyboardFocusEnhanced === true,
    cursorBlack: raw.cursorBlack === true,
    cursorLarge: raw.cursorLarge === true,
    dyslexiaFriendlyFont,
    hideImages: raw.hideImages === true,
    textSpacingWide: raw.textSpacingWide === true,
    readingMask: raw.readingMask === true,
    lineHeightMode:
      raw.lineHeightMode === "relaxed" || raw.lineHeightMode === "loose" ? raw.lineHeightMode : "normal",
    textAlignMode:
      raw.textAlignMode === "center" || raw.textAlignMode === "justify" ? raw.textAlignMode : "default"
  };
  return normalized;
}

function fontAssistLabel(readableFont: boolean, dyslexia: boolean): string {
  if (dyslexia) return "דיסלקציה (Lexend)";
  if (readableFont) return "קריא (Verdana)";
  return "ברירת מחדל";
}

const menuItemBase =
  "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-right text-sm text-neutral-900 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-500";

function MenuIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center text-neutral-700" aria-hidden>
      {children}
    </span>
  );
}

function MenuSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 border-t border-neutral-100 px-2 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wide text-neutral-500 first:mt-0 first:border-t-0 first:pt-2">
      {children}
    </p>
  );
}

function ReadingMaskOverlay() {
  const [y, setY] = useState(() =>
    typeof window !== "undefined" ? Math.floor(window.innerHeight / 2) : 400
  );
  useEffect(() => {
    const onMove = (e: MouseEvent) => setY(e.clientY);
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  const band =
    typeof window !== "undefined" ? Math.min(168, Math.max(96, window.innerHeight * 0.22)) : 140;
  const topH = Math.max(0, y - band / 2);
  const bottomTop = topH + band;
  return (
    <div className="pointer-events-none fixed inset-0 z-[2147482800]" aria-hidden>
      <div className="absolute inset-x-0 top-0 bg-black/85" style={{ height: topH }} />
      <div className="absolute inset-x-0 bg-transparent" style={{ top: topH, height: band }} />
      <div className="absolute inset-x-0 bg-black/85" style={{ top: bottomTop, bottom: 0 }} />
    </div>
  );
}

/** מונע גלילת דף אוטומטית בעת פוקוס (בעיקר במובייל) */
function focusWithoutScroll(el: HTMLElement | null | undefined) {
  if (!el) return;
  try {
    el.focus({ preventScroll: true });
  } catch {
    el.focus();
  }
}

function PageStructureDialog({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [entries, setEntries] = useState<{ id: string; level: number; text: string }[]>([]);

  useLayoutEffect(() => {
    if (!open) return;
    const main = document.getElementById("main-content");
    if (!main) {
      setEntries([]);
      return;
    }
    const headings = Array.from(main.querySelectorAll("h1,h2,h3,h4,h5,h6")) as HTMLElement[];
    const mapped = headings.map((el, i) => {
      if (!el.id) el.id = `jacuzzi-a11y-outline-${i}`;
      return {
        id: el.id,
        level: Number(el.tagName.slice(1)),
        text: el.textContent?.trim() || "(כותרת ללא טקסט)"
      };
    });
    setEntries(mapped);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[2147482900] flex items-end justify-center p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="jacuzzi-structure-title"
        className="relative z-10 max-h-[70vh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-row-reverse items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3">
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100"
            onClick={onClose}
          >
            סגירה
          </button>
          <h2 id="jacuzzi-structure-title" className="text-base font-bold text-neutral-900">
            רשימת כותרות בעמוד
          </h2>
        </div>
        <ul className="max-h-[55vh] overflow-y-auto p-2 text-right" lang="he">
          {entries.length === 0 ? (
            <li className="px-3 py-4 text-sm text-neutral-500">לא נמצאו כותרות בעמוד זה.</li>
          ) : (
            entries.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  className="w-full rounded-lg px-3 py-2.5 text-right text-sm text-neutral-900 hover:bg-amber-50"
                  style={{ paddingInlineEnd: 12 + (e.level - 1) * 10 }}
                  onClick={() => {
                    document.getElementById(e.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
                    onClose();
                  }}
                >
                  <span className="text-neutral-400">H{e.level}</span> {e.text}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

function clampFabToViewport(l: number, b: number): FabPosition {
  const m = 2;
  const minB = bottomChromeReservePx();
  if (typeof window === "undefined") {
    return {
      l: Math.max(m, l),
      b: Math.max(minB, b)
    };
  }
  const { vw, vh } = getViewportLayoutSize();
  const maxL = Math.max(m, vw - FAB_CLAMP_SIZE - m);
  const maxB = Math.max(minB, vh - FAB_CLAMP_SIZE - m);
  return {
    l: Math.min(maxL, Math.max(m, l)),
    b: Math.min(maxB, Math.max(minB, b))
  };
}

function loadFabPosition(): FabPosition {
  if (typeof window === "undefined") {
    return { l: 2, b: bottomChromeReservePx() + 10 };
  }
  try {
    const rawV6 = localStorage.getItem(FAB_POS_KEY);
    const raw = rawV6 ?? localStorage.getItem(FAB_POS_V5_FALLBACK);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FabPosition>;
      if (
        typeof parsed.l === "number" &&
        typeof parsed.b === "number" &&
        Number.isFinite(parsed.l) &&
        Number.isFinite(parsed.b)
      ) {
        const { vw } = getViewportLayoutSize();
        const migratedL = migrateStoredFabLeftForDesktop(parsed.l, vw);
        const next = clampFabToViewport(migratedL, parsed.b);
        try {
          if (!rawV6) {
            localStorage.setItem(FAB_POS_KEY, JSON.stringify(next));
          } else if (migratedL !== parsed.l) {
            localStorage.setItem(FAB_POS_KEY, JSON.stringify(next));
          }
        } catch {
          // ignore
        }
        return next;
      }
    }
    const prev = localStorage.getItem(FAB_POS_PREV_KEY);
    if (prev) {
      const parsed = JSON.parse(prev) as Partial<FabPosition>;
      if (
        typeof parsed.l === "number" &&
        typeof parsed.b === "number" &&
        Number.isFinite(parsed.l) &&
        Number.isFinite(parsed.b)
      ) {
        const { vw } = getViewportLayoutSize();
        const migratedL = migrateStoredFabLeftForDesktop(parsed.l, vw);
        const next = clampFabToViewport(migratedL, parsed.b);
        try {
          localStorage.setItem(FAB_POS_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      }
    }
    const legacy = localStorage.getItem(FAB_POS_LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as Partial<FabPosition>;
      if (
        typeof parsed.l === "number" &&
        typeof parsed.b === "number" &&
        Number.isFinite(parsed.l) &&
        Number.isFinite(parsed.b)
      ) {
        const { vw } = getViewportLayoutSize();
        const migratedL = migrateStoredFabLeftForDesktop(parsed.l, vw);
        const next = clampFabToViewport(migratedL, parsed.b);
        try {
          localStorage.setItem(FAB_POS_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      }
    }
  } catch {
    // fall through
  }
  const { vw } = getViewportLayoutSize();
  return clampFabToViewport(defaultFabInsetLeftPx(vw), defaultFabBottomPx(vw));
}

function ensurePortalHost(): HTMLElement {
  let host = document.getElementById("jacuzzi-a11y-root");
  if (!host) {
    host = document.createElement("div");
    host.id = "jacuzzi-a11y-root";
    document.body.appendChild(host);
  }
  return host;
}

export function AccessibilityWidget() {
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [fabPos, setFabPos] = useState<FabPosition>({ l: 8, b: 100 });
  const fabPosRef = useRef<FabPosition>({ l: 8, b: 100 });
  const fabTriggerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPlacement, setMenuPlacement] = useState({ openToPhysicalLeft: false, openAbove: false });
  const dragState = useRef<{
    active: boolean;
    moved: boolean;
    startX: number;
    startY: number;
    startL: number;
    startB: number;
  } | null>(null);
  const ignoreNextClickRef = useRef(false);
  const [isWideViewport, setIsWideViewport] = useState(false);
  const [readerSpeedLevel, setReaderSpeedLevel] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [isReading, setIsReading] = useState(false);
  const [structureDialogOpen, setStructureDialogOpen] = useState(false);
  const currentReadRootKeyRef = useRef<string>("");
  const speechCancelledByUserRef = useRef(false);

  useLayoutEffect(() => {
    const next = loadFabPosition();
    fabPosRef.current = next;
    setFabPos(next);
    setPortalHost(ensurePortalHost());
  }, []);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setIsWideViewport(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const fontPercent = useMemo(() => `${Math.round(settings.fontScale * 100)}%`, [settings.fontScale]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<AccessibilitySettings>;
      setSettings(normalizeAccessibilitySettings(parsed));
    } catch {
      // Keep defaults if storage parse fails.
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = fontPercent;
    root.style.setProperty("--jacuzzi-page-zoom", String(settings.pageZoom));

    const filterParts: string[] = [];
    if (settings.sepia) filterParts.push("sepia(100%)");
    if (settings.grayscale) filterParts.push("grayscale(100%)");
    if (settings.invertedColors) filterParts.push("invert(100%) hue-rotate(180deg)");
    if (settings.highContrast) filterParts.push("contrast(1.25) saturate(1.1)");
    root.style.setProperty("--jacuzzi-a11y-filter", filterParts.length > 0 ? filterParts.join(" ") : "none");

    root.classList.toggle("a11y-highlight-links", settings.highlightLinks);
    root.classList.toggle("a11y-reduce-motion", settings.reduceMotion);
    root.classList.toggle("a11y-light-bg", settings.lightBackground);
    root.classList.toggle("a11y-readable-font", settings.readableFont);
    root.classList.toggle("a11y-highlight-headings", settings.highlightHeadings);
    root.classList.toggle("a11y-black-yellow", settings.blackYellowContrast);
    root.classList.toggle("a11y-stop-flash", settings.stopFlashing);
    root.classList.toggle("a11y-focus-enhanced", settings.keyboardFocusEnhanced);
    root.classList.toggle("a11y-cursor-black", settings.cursorBlack && !settings.cursorLarge);
    root.classList.toggle("a11y-cursor-large", settings.cursorLarge);
    root.classList.toggle("a11y-hide-images", settings.hideImages);
    root.classList.toggle("a11y-dyslexia-font", settings.dyslexiaFriendlyFont);
    root.classList.toggle("a11y-text-spacing", settings.textSpacingWide);
    root.classList.toggle("a11y-line-relaxed", settings.lineHeightMode === "relaxed");
    root.classList.toggle("a11y-line-loose", settings.lineHeightMode === "loose");
    root.classList.toggle("a11y-text-align-center", settings.textAlignMode === "center");
    root.classList.toggle("a11y-text-align-justify", settings.textAlignMode === "justify");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [fontPercent, settings]);

  /** Lexend loads only when dyslexia-friendly font is on - avoids changing root layout/fonts site-wide. */
  useEffect(() => {
    const id = "jacuzzi-a11y-lexend-font";
    if (settings.dyslexiaFriendlyFont) {
      if (!document.getElementById(id)) {
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = "https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700&display=swap";
        document.head.appendChild(link);
      }
    } else {
      document.getElementById(id)?.remove();
    }
  }, [settings.dyslexiaFriendlyFont]);

  useEffect(() => {
    const main = document.getElementById("main-content");
    if (!main) return;
    if (!settings.showImageDescriptions) {
      removeImageAltCaptions(main);
      return;
    }
    let debounceId: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(debounceId);
      debounceId = setTimeout(() => applyImageAltCaptions(main), 80);
    };
    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(main, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["src", "alt"]
    });
    return () => {
      observer.disconnect();
      clearTimeout(debounceId);
      removeImageAltCaptions(main);
    };
  }, [settings.showImageDescriptions]);

  useEffect(() => {
    fabPosRef.current = fabPos;
  }, [fabPos]);

  useEffect(() => {
    const onResize = () => {
      setFabPos((prev) => {
        const next = clampFabToViewport(prev.l, prev.b);
        fabPosRef.current = next;
        try {
          localStorage.setItem(FAB_POS_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    };
    window.addEventListener("resize", onResize);
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    vv?.addEventListener("resize", onResize);
    vv?.addEventListener("scroll", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      vv?.removeEventListener("resize", onResize);
      vv?.removeEventListener("scroll", onResize);
    };
  }, []);

  const updateMenuPlacement = useCallback(() => {
    const btn = fabTriggerRef.current;
    if (!btn) return;
    const br = btn.getBoundingClientRect();
    const cx = br.left + br.width / 2;
    const cy = br.top + br.height / 2;
    const { vw, vh } = getViewportLayoutSize();
    setMenuPlacement({
      openToPhysicalLeft: cx > vw / 2,
      openAbove: cy > vh * 0.42
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updateMenuPlacement();
    window.addEventListener("scroll", updateMenuPlacement, true);
    window.addEventListener("resize", updateMenuPlacement);
    return () => {
      window.removeEventListener("scroll", updateMenuPlacement, true);
      window.removeEventListener("resize", updateMenuPlacement);
    };
  }, [isOpen, fabPos, updateMenuPlacement]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        requestAnimationFrame(() => {
          focusWithoutScroll(fabTriggerRef.current ?? undefined);
        });
      }
    };
    const targetInsideWidget = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      return Boolean(
        el.closest(`#${MENU_ID}`) ||
          el.closest(`[aria-controls='${MENU_ID}']`) ||
          el.closest("[data-jacuzzi-a11y-fab='trigger']")
      );
    };
    const onClickOutside = (event: MouseEvent) => {
      if (targetInsideWidget(event.target)) return;
      setIsOpen(false);
    };
    const onPointerDownOutside = (event: PointerEvent) => {
      if (targetInsideWidget(event.target)) return;
      setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onClickOutside);
    window.addEventListener("pointerdown", onPointerDownOutside, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("pointerdown", onPointerDownOutside, true);
    };
  }, [isOpen]);

  const stopReading = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    speechCancelledByUserRef.current = true;
    window.speechSynthesis.cancel();
    setIsReading(false);
  }, []);

  const getReadableRootKey = useCallback((root: HTMLElement | null): string => {
    if (!root) return "";
    const byId = root.id ? `#${root.id}` : "";
    const byLabelledBy = root.getAttribute("aria-labelledby");
    return byId || byLabelledBy || root.tagName;
  }, []);

  const startReading = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const root = getActiveReadableRoot();
    if (!root) return;
    const text = collectReadableText(root);
    if (!text) return;
    speechCancelledByUserRef.current = false;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "he-IL";
    utterance.rate = READER_RATE_BY_LEVEL[readerSpeedLevel];
    utterance.onstart = () => setIsReading(true);
    utterance.onend = () => {
      if (speechCancelledByUserRef.current) return;
      setIsReading(false);
    };
    utterance.onerror = () => setIsReading(false);
    currentReadRootKeyRef.current = getReadableRootKey(root);
    synth.speak(utterance);
  }, [getReadableRootKey, readerSpeedLevel]);

  useEffect(() => {
    const root = getActiveReadableRoot();
    if (!root) return;
    root.setAttribute("aria-live", "polite");
    return () => {
      root.removeAttribute("aria-live");
    };
  });

  useEffect(() => {
    const tabsRoot = document.getElementById("tabs");
    if (!tabsRoot) return;
    const onTabContentChange = () => {
      const nextRoot = getActiveReadableRoot();
      const nextKey = getReadableRootKey(nextRoot);
      if (!nextKey || nextKey === currentReadRootKeyRef.current) return;
      currentReadRootKeyRef.current = nextKey;
      if (isReading) {
        stopReading();
      }
    };
    const observer = new MutationObserver(onTabContentChange);
    observer.observe(tabsRoot, { subtree: true, childList: true, attributes: true });
    window.addEventListener("open-info-tab", onTabContentChange as EventListener);
    return () => {
      observer.disconnect();
      window.removeEventListener("open-info-tab", onTabContentChange as EventListener);
    };
  }, [getReadableRootKey, isReading, stopReading]);

  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => {
      const first = menuRef.current?.querySelector<HTMLElement>("button, a[href]");
      focusWithoutScroll(first ?? undefined);
    });
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  useEffect(() => {
    const menu = menuRef.current;
    if (!isOpen || !menu) return;
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget as Node | null;
      if (next && menu.contains(next)) return;
      requestAnimationFrame(() => {
        const ae = document.activeElement;
        if (ae && menu.contains(ae)) return;
        setIsOpen(false);
      });
    };
    menu.addEventListener("focusout", onFocusOut);
    return () => menu.removeEventListener("focusout", onFocusOut);
  }, [isOpen]);

  const persistFabPos = useCallback((next: FabPosition) => {
    fabPosRef.current = next;
    try {
      localStorage.setItem(FAB_POS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const resetFabPosition = useCallback(() => {
    const { vw } = getViewportLayoutSize();
    const next = clampFabToViewport(defaultFabInsetLeftPx(vw), defaultFabBottomPx(vw));
    setFabPos(next);
    persistFabPos(next);
  }, [persistFabPos]);

  const handleFabPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!FAB_DRAG_ENABLED) return;
    dragState.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
      startL: fabPos.l,
      startB: fabPos.b
    };
    if (event.pointerType === "mouse" || event.pointerType === "pen") {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const handleFabPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!FAB_DRAG_ENABLED) return;
    const state = dragState.current;
    if (!state?.active) return;
    const dx = event.clientX - state.startX;
    const dy = state.startY - event.clientY;
    if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
      state.moved = true;
    }
    const next = clampFabToViewport(state.startL + dx, state.startB + dy);
    if (next.l === fabPosRef.current.l && next.b === fabPosRef.current.b) return;
    fabPosRef.current = next;
    setFabPos(next);
  };

  const handleFabPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!FAB_DRAG_ENABLED) return;
    const state = dragState.current;
    dragState.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore if already released
    }
    if (state?.moved) {
      persistFabPos(fabPosRef.current);
      ignoreNextClickRef.current = true;
      event.preventDefault();
      return;
    }
    if (!state?.active) return;
    const isPrimaryMouse = event.pointerType === "mouse" && event.button === 0;
    const isTouch = event.pointerType === "touch";
    const isPenTap = event.pointerType === "pen" && event.button === 0;
    if (isPrimaryMouse || isTouch || isPenTap) {
      ignoreNextClickRef.current = true;
      setIsOpen((prev) => !prev);
    }
  };

  const handleFabClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (ignoreNextClickRef.current) {
      ignoreNextClickRef.current = false;
      event.preventDefault();
      return;
    }
    setIsOpen((prev) => !prev);
  };

  const handleFabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen((prev) => !prev);
    }
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const menu = menuRef.current;
    if (!menu) return;

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setIsOpen(false);
      requestAnimationFrame(() => {
        focusWithoutScroll(fabTriggerRef.current ?? undefined);
      });
      return;
    }

    const focusables = Array.from(menu.querySelectorAll<HTMLElement>("button, a[href]")).filter(
      (el) => !(el as HTMLButtonElement).disabled
    );
    if (focusables.length === 0) return;

    const active = document.activeElement;
    const idx = active ? focusables.indexOf(active as HTMLElement) : -1;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = focusables[(Math.max(0, idx) + 1) % focusables.length];
      focusWithoutScroll(next);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const base = idx <= 0 ? focusables.length : idx;
      focusWithoutScroll(focusables[base - 1]);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      focusWithoutScroll(focusables[0]);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      focusWithoutScroll(focusables[focusables.length - 1]);
    }
  };

  const menuPositionStyle: React.CSSProperties = menuPlacement.openToPhysicalLeft
    ? menuPlacement.openAbove
      ? { right: "100%", bottom: "100%", marginRight: 8, marginBottom: 8 }
      : { right: "100%", top: "100%", marginRight: 8, marginTop: 8 }
    : menuPlacement.openAbove
      ? { left: "100%", bottom: "100%", marginLeft: 8, marginBottom: 8 }
      : { left: "100%", top: "100%", marginLeft: 8, marginTop: 8 };

  if (typeof document === "undefined" || !portalHost) {
    return null;
  }

  const shellPositionStyle: React.CSSProperties = {
    left: "0px",
    right: "auto",
    top: "auto",
    bottom: `calc(${fabPos.b}px + env(safe-area-inset-bottom, 0px))`,
    touchAction: "manipulation"
  };

  const shell = (
    <div data-jacuzzi-a11y-fab="shell" style={shellPositionStyle} dir="ltr">
      <div data-jacuzzi-a11y-fab="inner">
        <div
          ref={fabTriggerRef}
          role="button"
          tabIndex={0}
          className="a11y-fab"
          data-jacuzzi-a11y-fab="trigger"
          aria-label="תפריט נגישות"
          aria-haspopup="menu"
          title="תפריט נגישות - גרירה להזזה; איפוס מיקום מתפריט הנגישות"
          aria-expanded={isOpen}
          aria-controls={MENU_ID}
          onPointerDown={handleFabPointerDown}
          onPointerMove={handleFabPointerMove}
          onPointerUp={handleFabPointerUp}
          onPointerCancel={handleFabPointerUp}
          onClick={handleFabClick}
          onKeyDown={handleFabKeyDown}
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.65"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="5.5" r="2.25" />
            <path d="M6 11h5v5H8.5l-1.5 4M11 11l3.5 5.5M14.5 14h4M17 11v6" />
            <circle cx="8" cy="19" r="1.75" />
            <circle cx="16" cy="19" r="1.75" />
          </svg>
        </div>

        {isOpen ? (
          <div
            ref={menuRef}
            id={MENU_ID}
            role="menu"
            aria-labelledby="jacuzzi-a11y-menu-title"
            aria-orientation="vertical"
            style={menuPositionStyle}
            onKeyDown={handleMenuKeyDown}
            className="absolute w-[min(18rem,calc(100vw-1.5rem))] max-h-[min(70vh,32rem)] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-2 text-right text-neutral-900 shadow-[0_12px_40px_rgba(0,0,0,0.18)] ring-1 ring-black/5"
          >
            <h2
              id="jacuzzi-a11y-menu-title"
              className="m-0 border-b border-neutral-100 px-2 py-2 text-center text-base font-bold text-neutral-900"
            >
              כלי נגישות
            </h2>
            <p className="border-b border-neutral-100 px-2 pb-2 text-center text-[10px] leading-snug text-neutral-500">
              התאמות לפי תקן נגישות ישראלי (ת״י 5568) והנחיות WCAG 2.x ברמת AA, ככל שהן חלות על אתר זה.
            </p>
            <MenuSectionTitle>מיקום כפתור הנגישות</MenuSectionTitle>
            <p className="px-2 pb-1 text-[11px] leading-snug text-neutral-600">
              ניתן לגרור את הכפתור הצף לכל מקום במסך. לאיפוס לברירת המחדל (פינה תחתונה משמאל):
            </p>
            <button
              type="button"
              role="menuitem"
              onClick={resetFabPosition}
              className={menuItemBase}
              title="מחזיר את כפתור הנגישות לפינה התחתונה־השמאלית של המסך"
            >
              <MenuIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-6 w-6">
                  <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="10" r="2.25" />
                </svg>
              </MenuIcon>
              <span className="min-w-0 flex-1">איפוס מיקום כפתור (למטה משמאל)</span>
            </button>
            <MenuSectionTitle>טקסט</MenuSectionTitle>
            <button
              type="button"
              role="menuitem"
              onClick={() => setSettings((prev) => ({ ...prev, fontScale: Math.min(1.55, prev.fontScale + 0.12) }))}
              className={menuItemBase}
              title="מגדיל את גודל הטקסט בלבד - לא זום של כל העמוד"
            >
              <MenuIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-6 w-6">
                  <circle cx="10.5" cy="10.5" r="6.5" />
                  <path d="M16 16l5 5" strokeLinecap="round" />
                  <path d="M10.5 8v5M8 10.5h5" strokeLinecap="round" />
                </svg>
              </MenuIcon>
              <span className="min-w-0 flex-1">הגדל טקסט</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => setSettings((prev) => ({ ...prev, fontScale: Math.max(0.88, prev.fontScale - 0.12) }))}
              className={menuItemBase}
              title="מקטין את גודל הטקסט בלבד - לא זום של כל העמוד"
            >
              <MenuIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-6 w-6">
                  <circle cx="10.5" cy="10.5" r="6.5" />
                  <path d="M16 16l5 5" strokeLinecap="round" />
                  <path d="M8 10.5h5" strokeLinecap="round" />
                </svg>
              </MenuIcon>
              <span className="min-w-0 flex-1">הקטן טקסט</span>
            </button>
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={settings.textSpacingWide}
              onClick={() => setSettings((prev) => ({ ...prev, textSpacingWide: !prev.textSpacingWide }))}
              className={menuItemBase}
              title="ריווח אותיות ומילים מוגבר לקריאה נוחה יותר"
            >
              <MenuIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-6 w-6">
                  <path d="M7 12h3M14 12h3M9 8l-2 8M15 8l2 8" strokeLinecap="round" />
                </svg>
              </MenuIcon>
              <span className="min-w-0 flex-1">ריווח טקסט מוגבר</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  lineHeightMode:
                    prev.lineHeightMode === "normal"
                      ? "relaxed"
                      : prev.lineHeightMode === "relaxed"
                        ? "loose"
                        : "normal"
                }))
              }
              className={menuItemBase}
              title="מחזור גובה שורה: רגיל → מרווח → מרווח מאוד"
            >
              <MenuIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-6 w-6">
                  <path d="M6 8h12M6 12h12M6 16h12" strokeLinecap="round" />
                  <path d="M4 10v4M20 10v4" strokeLinecap="round" />
                </svg>
              </MenuIcon>
              <span className="min-w-0 flex-1">
                גובה שורה:{" "}
                {settings.lineHeightMode === "normal"
                  ? "רגיל"
                  : settings.lineHeightMode === "relaxed"
                    ? "מרווח"
                    : "מרווח מאוד"}
              </span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  textAlignMode:
                    prev.textAlignMode === "default"
                      ? "center"
                      : prev.textAlignMode === "center"
                        ? "justify"
                        : "default"
                }))
              }
              className={menuItemBase}
              title="מחזור יישור פסקאות"
            >
              <MenuIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-6 w-6">
                  <path d="M6 8h12M6 12h8M6 16h10" strokeLinecap="round" />
                </svg>
              </MenuIcon>
              <span className="min-w-0 flex-1">
                יישור טקסט:{" "}
                {settings.textAlignMode === "default"
                  ? "ברירת מחדל"
                  : settings.textAlignMode === "center"
                    ? "מרכוז"
                    : "דו-צדדי"}
              </span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() =>
                setSettings((prev) => {
                  if (!prev.readableFont && !prev.dyslexiaFriendlyFont) {
                    return { ...prev, readableFont: true, dyslexiaFriendlyFont: false };
                  }
                  if (prev.readableFont && !prev.dyslexiaFriendlyFont) {
                    return { ...prev, readableFont: false, dyslexiaFriendlyFont: true };
                  }
                  return { ...prev, readableFont: false, dyslexiaFriendlyFont: false };
                })
              }
              className={menuItemBase}
              title="מחזור בין ברירת מחדל, גופן קריא (Verdana), וגופן מותאם לדיסלקציה (Lexend)"
            >
              <MenuIcon>
                <span className="font-serif text-xl font-bold leading-none text-neutral-800">A</span>
              </MenuIcon>
              <span className="min-w-0 flex-1">
                גופן קריא: {fontAssistLabel(settings.readableFont, settings.dyslexiaFriendlyFont)}
              </span>
            </button>
            <MenuSectionTitle>וויזואלי</MenuSectionTitle>
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={settings.grayscale}
              onClick={() => setSettings((prev) => ({ ...prev, grayscale: !prev.grayscale }))}
              className={menuItemBase}
            >
              <MenuIcon>
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 opacity-80">
                  <rect x="4" y="5" width="3" height="14" rx="1" />
                  <rect x="9" y="7" width="2.5" height="12" rx="0.8" opacity="0.65" />
                  <rect x="13.5" y="6" width="3.5" height="13" rx="1" opacity="0.45" />
                  <rect x="18.5" y="8" width="2" height="11" rx="0.6" opacity="0.75" />
                </svg>
              </MenuIcon>
              <span className="min-w-0 flex-1">גווני אפור</span>
            </button>
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={settings.highContrast}
              onClick={() => setSettings((prev) => ({ ...prev, highContrast: !prev.highContrast }))}
              className={menuItemBase}
            >
              <MenuIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-6 w-6">
                  <circle cx="12" cy="12" r="8" stroke="currentColor" />
                  <path fill="currentColor" stroke="none" d="M12 4 A8 8 0 0 1 12 20 Z" />
                </svg>
              </MenuIcon>
              <span className="min-w-0 flex-1">ניגודיות גבוהה</span>
            </button>
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={settings.invertedColors}
              onClick={() => setSettings((prev) => ({ ...prev, invertedColors: !prev.invertedColors }))}
              className={menuItemBase}
            >
              <MenuIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-6 w-6">
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </MenuIcon>
              <span className="min-w-0 flex-1">ניגודיות הפוכה</span>
            </button>
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={settings.lightBackground}
              onClick={() => setSettings((prev) => ({ ...prev, lightBackground: !prev.lightBackground }))}
              className={menuItemBase}
            >
              <MenuIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-6 w-6">
                  <path d="M9 18h6M10 22h4M12 3v1M12 18v3" strokeLinecap="round" />
                  <path d="M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z" />
                </svg>
              </MenuIcon>
              <span className="min-w-0 flex-1">רקע בהיר</span>
            </button>
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={settings.hideImages}
              onClick={() => setSettings((prev) => ({ ...prev, hideImages: !prev.hideImages }))}
              className={menuItemBase}
              title="מסתיר תמונות וגראפיקה לפי תקן - טקסט חלופי נשאר זמין לטכנולוגיות מסייעות"
            >
              <MenuIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-6 w-6">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M5 19L19 5" strokeLinecap="round" />
                </svg>
              </MenuIcon>
              <span className="min-w-0 flex-1">הסתרת תמונות</span>
            </button>
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={settings.highlightLinks}
              onClick={() => setSettings((prev) => ({ ...prev, highlightLinks: !prev.highlightLinks }))}
              className={menuItemBase}
            >
              <MenuIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-6 w-6">
                  <path d="M10 13a5 5 0 0 1 7.07 0l1.41 1.41a5 5 0 0 1 0 7.07l-1.41 1.41" />
                  <path d="M14 11a5 5 0 0 0-7.07 0L5.52 12.41a5 5 0 0 0 0 7.07l1.41 1.41" />
                </svg>
              </MenuIcon>
              <span className="min-w-0 flex-1">הדגשת קישורים</span>
            </button>
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={settings.highlightHeadings}
              onClick={() => setSettings((prev) => ({ ...prev, highlightHeadings: !prev.highlightHeadings }))}
              className={menuItemBase}
              title="מדגיש כותרות בעמוד לזיהוי מבנה התוכן"
            >
              <MenuIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-6 w-6">
                  <path d="M7 20h10M12 4v12" strokeLinecap="round" />
                  <path d="M9 8h6" strokeLinecap="round" />
                </svg>
              </MenuIcon>
              <span className="min-w-0 flex-1">הדגשת כותרות</span>
            </button>
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={settings.showImageDescriptions}
              onClick={() =>
                setSettings((prev) => ({ ...prev, showImageDescriptions: !prev.showImageDescriptions }))
              }
              className={menuItemBase}
              title="מציג מתחת לתמונה את הטקסט החלופי שסופק לפי תקן WCAG 1.1"
            >
              <MenuIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-6 w-6">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <circle cx="8.5" cy="10" r="1.5" fill="currentColor" stroke="none" />
                  <path d="M3 17l5-5 4 4 5-6 5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </MenuIcon>
              <span className="min-w-0 flex-1">הצגת תיאורי תמונות (טקסט חלופי)</span>
            </button>
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={settings.sepia}
              onClick={() => setSettings((prev) => ({ ...prev, sepia: !prev.sepia }))}
              className={menuItemBase}
              title="מצב צבע ספיה לנוחות צפייה"
            >
              <MenuIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-6 w-6">
                  <circle cx="12" cy="12" r="8" />
                  <path d="M12 4v16M4 12h16" strokeLinecap="round" opacity="0.35" />
                </svg>
              </MenuIcon>
              <span className="min-w-0 flex-1">מצב ספיה</span>
            </button>
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={settings.blackYellowContrast}
              onClick={() =>
                setSettings((prev) => ({ ...prev, blackYellowContrast: !prev.blackYellowContrast }))
              }
              className={menuItemBase}
              title="ניגודיות גבוהה: טקסט צהוב על רקע שחור"
            >
              <MenuIcon>
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                  <path d="M4 4h16v16H4z" fill="#000" />
                  <path d="M4 20L20 4v16H4z" fill="#ffef00" />
                </svg>
              </MenuIcon>
              <span className="min-w-0 flex-1">ניגודיות שחור-צהוב</span>
            </button>
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={settings.reduceMotion || settings.stopFlashing}
              onClick={() =>
                setSettings((prev) => {
                  const next = !(prev.reduceMotion && prev.stopFlashing);
                  return { ...prev, reduceMotion: next, stopFlashing: next };
                })
              }
              className={menuItemBase}
              title="מפחית אנימציות ומעצר הבהובים - WCAG 2.3"
            >
              <MenuIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-6 w-6">
                  <path d="M5 9h14M5 15h14" strokeLinecap="round" opacity="0.35" />
                  <path d="M5 12h14" strokeLinecap="round" strokeWidth="2" />
                  <circle cx="12" cy="12" r="8" opacity="0.35" />
                  <path d="M6 6l12 12" strokeLinecap="round" opacity="0.5" />
                </svg>
              </MenuIcon>
              <span className="min-w-0 flex-1">צמצום תנועה והבהובים</span>
            </button>
            <MenuSectionTitle>אוריינטציה וניווט</MenuSectionTitle>
            <a
              href="/site-map"
              role="menuitem"
              className={`${menuItemBase} no-underline`}
              title="רשימת דפים באתר לפי הנחיות נגישות"
              onClick={() => setIsOpen(false)}
            >
              <MenuIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-6 w-6">
                  <circle cx="12" cy="5" r="2" />
                  <path d="M6 11h4v10H6zM14 11h4v6h-4z" strokeLinejoin="round" />
                </svg>
              </MenuIcon>
              <span className="min-w-0 flex-1">מפת אתר</span>
            </a>
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={settings.keyboardFocusEnhanced}
              onClick={() =>
                setSettings((prev) => ({ ...prev, keyboardFocusEnhanced: !prev.keyboardFocusEnhanced }))
              }
              className={menuItemBase}
              title="מסגרת מיקוד בולטת לכל האלמנטים בעת ניווט במקלדת"
            >
              <MenuIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-6 w-6">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <path d="M6 14h4M14 14h4" strokeLinecap="round" />
                  <path d="M18 10l2 2-2 2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </MenuIcon>
              <span className="min-w-0 flex-1">מיקוד ברור לניווט מקלדת</span>
            </button>
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={settings.readingMask}
              onClick={() => setSettings((prev) => ({ ...prev, readingMask: !prev.readingMask }))}
              className={menuItemBase}
              title="פס קריאה אופקי שעוקב אחר המיקום כדי להקל על ריכוז בקריאה"
            >
              <MenuIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-6 w-6">
                  <path d="M3 10h18M3 14h18" strokeLinecap="round" />
                  <path d="M4 8v8M20 8v8" strokeLinecap="round" opacity="0.4" />
                </svg>
              </MenuIcon>
              <span className="min-w-0 flex-1">מסכת קריאה</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setStructureDialogOpen(true);
                setIsOpen(false);
              }}
              className={menuItemBase}
              title="רשימת כותרות בעמוד לזיהוי מבנה התוכן"
            >
              <MenuIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-6 w-6">
                  <rect x="4" y="5" width="6" height="5" rx="1" />
                  <rect x="14" y="5" width="6" height="5" rx="1" />
                  <rect x="4" y="13" width="6" height="6" rx="1" />
                  <rect x="14" y="13" width="6" height="6" rx="1" />
                </svg>
              </MenuIcon>
              <span className="min-w-0 flex-1">רשימת כותרות בעמוד</span>
            </button>
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={settings.cursorBlack && !settings.cursorLarge}
              onClick={() =>
                setSettings((prev) => {
                  if (prev.cursorLarge) {
                    return { ...prev, cursorBlack: true, cursorLarge: false };
                  }
                  return { ...prev, cursorBlack: !prev.cursorBlack, cursorLarge: false };
                })
              }
              className={menuItemBase}
              title="סמן עכבר שחור עם מתאר בהיר"
            >
              <MenuIcon>
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                  <path d="M4 2l10 18 2-8 8-2L4 2z" />
                </svg>
              </MenuIcon>
              <span className="min-w-0 flex-1">סמן עכבר שחור</span>
            </button>
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={settings.cursorLarge}
              onClick={() =>
                setSettings((prev) => {
                  if (prev.cursorBlack && !prev.cursorLarge) {
                    return { ...prev, cursorLarge: true, cursorBlack: false };
                  }
                  return { ...prev, cursorLarge: !prev.cursorLarge, cursorBlack: false };
                })
              }
              className={menuItemBase}
              title="סמן עכבר גדול יותר"
            >
              <MenuIcon>
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                  <g transform="translate(12 12) scale(1.45) translate(-12 -12)">
                    <path d="M4 2l10 18 2-8 8-2L4 2z" />
                  </g>
                </svg>
              </MenuIcon>
              <span className="min-w-0 flex-1">סמן עכבר מוגדל</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  pageZoom: Math.min(PAGE_ZOOM_MAX, Math.round((prev.pageZoom + PAGE_ZOOM_STEP) * 100) / 100)
                }))
              }
              className={menuItemBase}
              title="זום של אזור התוכן - שונה מהגדלת טקסט למעלה"
            >
              <MenuIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-6 w-6">
                  <rect x="3" y="4" width="18" height="14" rx="2" />
                  <path d="M8 10h8M12 6v8" strokeLinecap="round" />
                  <path d="M19 19l2 2M7 7L5 5" strokeLinecap="round" />
                </svg>
              </MenuIcon>
              <span className="min-w-0 flex-1">הגדל זום עמוד</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  pageZoom: Math.max(PAGE_ZOOM_MIN, Math.round((prev.pageZoom - PAGE_ZOOM_STEP) * 100) / 100)
                }))
              }
              className={menuItemBase}
              title="הקטנת זום אזור התוכן - שונה מהקטנת טקסט למעלה"
            >
              <MenuIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-6 w-6">
                  <rect x="3" y="4" width="18" height="14" rx="2" />
                  <path d="M8 12h8" strokeLinecap="round" />
                  <path d="M17 7l3-3M7 17l-3 3" strokeLinecap="round" />
                </svg>
              </MenuIcon>
              <span className="min-w-0 flex-1">הקטן זום עמוד</span>
            </button>
            <p className="px-2 pt-1 text-[11px] leading-snug text-neutral-500">
              זום תוכן: {Math.round(settings.pageZoom * 100)}%
            </p>
            <button
              type="button"
              role="menuitem"
              onClick={() => setSettings(defaultSettings)}
              className={`${menuItemBase} mt-1 border border-neutral-200`}
            >
              <MenuIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-6 w-6">
                  <path d="M4 12a8 8 0 1 1 3 6.3" strokeLinecap="round" />
                  <path d="M4 16v-4h4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </MenuIcon>
              <span className="min-w-0 flex-1 font-medium">איפוס כל ההתאמות</span>
            </button>
            <hr className="my-2 border-neutral-200" role="separator" />
            <a
              href="/accessibility-statement"
              role="menuitem"
              className={`${menuItemBase} no-underline`}
              onClick={() => setIsOpen(false)}
            >
              <MenuIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-6 w-6">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6M12 18h4M12 14h7" strokeLinecap="round" />
                </svg>
              </MenuIcon>
              <span className="min-w-0 flex-1">מעבר להצהרת נגישות</span>
            </a>
            <div className="mt-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2">
              <p className="mb-2 text-xs font-medium text-neutral-700">קריאת טקסט (לשונית פעילה בלבד)</p>
              <div className="mb-2 grid grid-cols-5 gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={`reader-speed-${level}`}
                    type="button"
                    role="menuitemradio"
                    aria-checked={readerSpeedLevel === level}
                    onClick={() => setReaderSpeedLevel(level as 1 | 2 | 3 | 4 | 5)}
                    className={`min-h-9 rounded-md px-2 py-1 text-xs ${readerSpeedLevel === level ? "bg-amber-100 font-semibold text-amber-900" : "bg-white text-neutral-800 hover:bg-neutral-100"}`}
                    title={`מהירות ${level}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  role="menuitem"
                  onClick={startReading}
                  className="min-h-10 rounded-lg bg-cyan-100 px-3 py-2 text-xs font-bold text-cyan-900 hover:bg-cyan-200"
                >
                  הפעל קריין
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={stopReading}
                  className="min-h-10 rounded-lg bg-rose-100 px-3 py-2 text-xs font-bold text-rose-900 hover:bg-rose-200"
                >
                  עצור קריין
                </button>
              </div>
              <p className="mt-2 text-[11px] text-neutral-600">
                מצב: {isReading ? "מקריא..." : "ממתין"}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      {createPortal(shell, portalHost)}
      {typeof document !== "undefined" && settings.readingMask
        ? createPortal(<ReadingMaskOverlay />, document.body)
        : null}
      {typeof document !== "undefined"
        ? createPortal(
            <PageStructureDialog open={structureDialogOpen} onClose={() => setStructureDialogOpen(false)} />,
            document.body
          )
        : null}
    </>
  );
}
