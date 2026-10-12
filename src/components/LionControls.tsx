"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { setLionMode, useLionMode } from "@/lib/lionMode";

const btn =
  "inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 font-mono text-xs transition hover:border-accent hover:text-accent";

/** Two toggles for the hero lion: make it walk, or make it sit and follow the cursor. */
export default function LionControls() {
  const { t } = useI18n();
  const mode = useLionMode();
  const walking = mode === "walk";
  const watching = mode === "watch";

  return (
    <div className="lion-controls flex flex-wrap gap-2" role="group" aria-label={t("hero.lionControls")}>
      <button
        type="button"
        aria-pressed={walking}
        onClick={() => setLionMode(walking ? "sit" : "walk")}
        className={`${btn} ${walking ? "border-accent bg-accent/15 text-accent" : "border-line text-muted"}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          {walking ? <path d="M6 4h4v16H6zM14 4h4v16h-4z" /> : <path d="M7 4v16l13-8z" />}
        </svg>
        {t("hero.walk")}
      </button>
      <button
        type="button"
        aria-pressed={watching}
        onClick={() => setLionMode(watching ? "sit" : "watch")}
        className={`${btn} ${watching ? "border-accent bg-accent/15 text-accent" : "border-line text-muted"}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 3l14 7-6 2-2 6z" />
        </svg>
        {t("hero.follow")}
      </button>
    </div>
  );
}
