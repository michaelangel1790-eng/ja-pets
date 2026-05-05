import type { AnchorHTMLAttributes, ReactNode } from "react";

import { whatsappNumber } from "@/data/site-data";

export type ExternalLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "target" | "rel"> & {
  children: ReactNode;
  /** ברירת מחדל: noopener noreferrer — WCAG ממליצות על סימון חלון חדש */
  rel?: string;
};

/**
 * קישור חיצוני שנפתח בטאב/חלון חדש + טקסט מוסתר לקוראי מסך (WCAG 3.2.5).
 */
export function ExternalLink({ children, rel = "noopener noreferrer", ...rest }: ExternalLinkProps) {
  return (
    <a target="_blank" rel={rel} {...rest}>
      {children}
      <span className="visually-hidden"> — נפתח בחלון חדש</span>
    </a>
  );
}

/** קישור וואטסאפ עם טקסט מוכן מראש — כולל סימון חלון חדש דרך ExternalLink */
export function WhatsAppExternalLink({
  message,
  children,
  ...rest
}: Omit<ExternalLinkProps, "href"> & { message: string }) {
  const href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  return (
    <ExternalLink href={href} {...rest}>
      {children}
    </ExternalLink>
  );
}
