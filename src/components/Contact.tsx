"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";

const EMAIL = "mailto:mykhaylo359@gmail.com";
const LINKS = [
  { label: "GitHub", href: "https://github.com/mika359" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/mykhaylo359" },
];

export default function Contact() {
  const { t } = useI18n();

  return (
    <section id="contact" className="section">
      <div className="container-x">
        <div className="card relative overflow-hidden p-8 text-center sm:p-12 !transform-none">
          <p className="eyebrow">{t("contact.eyebrow")}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{t("contact.title")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">{t("contact.text")}</p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={EMAIL} className="btn btn-primary">
              {t("contact.email")}
            </a>
            <Link href="/cv" className="btn btn-ghost">
              {t("contact.cv")}
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 font-mono text-sm">
            {LINKS.map((l) => (
              <li key={l.label}>
                <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-muted transition hover:text-accent">
                  {l.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
