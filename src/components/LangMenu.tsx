"use client";

import { useEffect, useRef, useState } from "react";
import { LANGS, useI18n } from "@/i18n/I18nProvider";

export default function LangMenu() {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="lang-menu"
        aria-label={t("nav.language")}
        className="flex h-11 items-center gap-2 rounded-lg border border-line px-3 font-mono text-sm font-semibold text-accent transition hover:border-accent hover:shadow-[0_0_20px_-4px_var(--glow)]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
        </svg>
        {current.short}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          id="lang-menu"
          aria-label={t("nav.language")}
          className="absolute right-0 z-50 mt-2 min-w-44 overflow-hidden rounded-xl border border-line bg-bg-soft p-1 shadow-[0_12px_40px_-8px_var(--glow)]"
        >
          {LANGS.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                lang={l.code}
                aria-current={l.code === lang ? "true" : undefined}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                  button.current?.focus();
                }}
                className={`flex min-h-11 w-full items-center justify-between gap-4 rounded-lg px-3 text-left text-sm transition hover:bg-accent/10 ${
                  l.code === lang ? "text-accent" : "text-fg"
                }`}
              >
                <span>{l.label}</span>
                <span className="font-mono text-xs text-muted">{l.short}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
