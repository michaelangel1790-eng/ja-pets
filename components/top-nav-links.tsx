"use client";

const links = [
  { href: "/?tab=services#tabs", label: "שירותים", tabId: "services" },
  { href: "/lead-details", label: "השארת פרטים" },
  { href: "/?tab=location#tabs", label: "מיקום המשאית", tabId: "location" },
  { href: "/accessibility-statement", label: "הצהרת נגישות" }
];

export function TopNavLinks() {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {links.map((link) => (
        <a
          key={`${link.href}-${link.label}`}
          href={link.href}
          className="nav-link"
          onClick={(event) => {
            if (!link.tabId) return;
            if (typeof window === "undefined" || window.location.pathname !== "/") return;
            event.preventDefault();
            window.dispatchEvent(
              new CustomEvent("open-info-tab", {
                detail: { tabId: link.tabId }
              })
            );
            const url = new URL(window.location.href);
            url.searchParams.set("tab", link.tabId);
            url.hash = "tabs";
            const qs = url.searchParams.toString();
            window.history.replaceState(
              null,
              "",
              qs ? `${url.pathname}?${qs}#tabs` : `${url.pathname}#tabs`
            );
          }}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
