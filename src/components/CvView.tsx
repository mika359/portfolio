"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { cv, CV_PUBLIC, type CvBlock, type CvLang } from "@/data/cv";
import BrandName from "./BrandName";

function Block({ block }: { block: CvBlock }) {
  return (
    <section className="card p-5 !transform-none sm:p-6" aria-labelledby={`cv-${block.title}`}>
      <h2 id={`cv-${block.title}`} className="font-mono text-sm font-semibold text-accent">
        <span className="text-muted">./</span>
        {block.title}
      </h2>

      {block.kind === "paragraphs" && (
        <div className="mt-4 space-y-3 leading-relaxed text-fg">
          {block.items.map((p, i) => (
            <p key={i} className={i ? "text-muted" : undefined}>
              {p}
            </p>
          ))}
        </div>
      )}

      {block.kind === "facts" && (
        <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-[10rem_1fr]">
          {block.items.map((f) => (
            <div key={f.label} className="contents">
              <dt className="font-mono text-sm text-muted">{f.label}</dt>
              <dd className="min-w-0 text-fg">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {block.kind === "entries" && (
        <ul className="mt-4 space-y-5">
          {block.items.map((e) => (
            <li key={e.heading}>
              <p className="text-lg font-semibold">{e.heading}</p>
              <p className="font-mono text-sm text-muted">
                {[e.place, e.meta].filter(Boolean).join(" · ")}
              </p>
              {e.text && <p className="mt-2 leading-relaxed text-muted">{e.text}</p>}
            </li>
          ))}
        </ul>
      )}

      {block.kind === "bullets" && (
        <ul className="mt-4 space-y-3">
          {block.items.map((b, i) => (
            <li key={i} className="flex gap-3 leading-relaxed">
              <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <p className="min-w-0 text-muted">
                {b.label && <span className="font-semibold text-fg">{b.label}. </span>}
                {b.text}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function CvView() {
  const { t, lang } = useI18n();
  // The site has three languages but there are only two CVs: Ukrainian falls back to English.
  const version: CvLang = lang === "pt" ? "pt" : "en";
  const data = cv[version];
  const fileName = data.file.split("/").pop();

  return (
    <section className="section">
      <div className="container-x px-5">
        <header className="flex items-center gap-5">
          <div className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-xl border border-line sm:w-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/me.jpg" alt="" width={960} height={1200} className="h-full w-full object-cover object-top" />
          </div>
          <div className="min-w-0">
            <p className="eyebrow">{t("cv.eyebrow")}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
              <BrandName />
            </h1>
            <p className="mt-1 text-muted">{t("cv.headline")}</p>
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_19rem] lg:items-start">
          <aside className="card order-first p-5 !transform-none lg:sticky lg:top-24 lg:order-last">
            <p className="inline-flex rounded-md border border-accent/60 bg-accent/10 px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-widest text-accent">
              {version}
            </p>
            <p className="mt-2 font-semibold">{t("cv.version")}</p>
            {lang === "uk" && <p className="mt-1 text-sm text-muted">{t("cv.ukNote")}</p>}

            <a href={data.file} download={fileName} className="btn btn-primary mt-4 w-full justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />
              </svg>
              {t("cv.download")}
            </a>
            <p className="mt-2 text-xs text-muted">{t("cv.downloadHint")}</p>

            <div className="mt-5 border-t border-line pt-4">
              <p className="font-mono text-xs uppercase tracking-widest text-muted">{t("cv.contact")}</p>
              <ul className="mt-2 space-y-1.5 break-words text-sm">
                <li>
                  <a href={`mailto:${CV_PUBLIC.email}`} className="text-accent hover:underline">
                    {CV_PUBLIC.email}
                  </a>
                </li>
                <li>
                  <a href={CV_PUBLIC.linkedin.href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                    {CV_PUBLIC.linkedin.label} ↗
                  </a>
                </li>
                <li>
                  <a href={CV_PUBLIC.github.href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                    {CV_PUBLIC.github.label} ↗
                  </a>
                </li>
                <li className="text-muted">{CV_PUBLIC.city}</li>
              </ul>
            </div>
          </aside>

          <div className="flex min-w-0 flex-col gap-5">
            {data.blocks.map((b) => (
              <Block key={b.title} block={b} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
