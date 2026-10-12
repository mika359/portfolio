"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import Logo from "./Logo";
import BrandName from "./BrandName";
import LangMenu from "./LangMenu";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/#about", label: t("nav.about"), active: false },
    { href: "/projects", label: t("nav.projects"), active: pathname.startsWith("/projects") },
  ];

  const linkClass = (active: boolean) =>
    `rounded-lg px-3 py-2 font-mono text-sm transition hover:text-accent ${
      active ? "text-accent" : "text-fg"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/70 backdrop-blur-xl">
      <nav className="container-x flex h-16 items-center justify-between px-5" aria-label="Main">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex min-w-0 items-center gap-3"
          aria-label="mlev, home"
        >
          <Logo />
          <BrandName className="hidden whitespace-nowrap border-l border-line pl-3 font-mono text-sm font-semibold text-fg min-[480px]:inline" />
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <ul className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={linkClass(l.active)} aria-current={l.active ? "page" : undefined}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <LangMenu />
          <ThemeToggle />
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-lg border border-line text-accent md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t("nav.closeMenu") : t("nav.menu")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <ul id="mobile-menu" className="border-t border-line bg-bg/95 px-5 py-3 md:hidden">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block ${linkClass(l.active)} min-h-11 py-3 text-base`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
