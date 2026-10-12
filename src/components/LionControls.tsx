"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { setLionMode, useLionMode } from "@/lib/lionMode";

/** Toggle for the hero lion: make it walk, or let it rest again. */
export default function LionControls() {
  const { t } = useI18n();
  const walking = useLionMode() === "walk";

  return (
    <div className="lion-controls flex flex-wrap gap-2" role="group" aria-label={t("hero.lionControls")}>
      <button
        type="button"
        aria-pressed={walking}
        onClick={() => setLionMode(walking ? "sit" : "walk")}
        className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 font-mono text-xs transition hover:border-accent hover:text-accent ${
          walking ? "border-accent bg-accent/15 text-accent" : "border-line text-muted"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          {walking ? <path d="M6 4h4v16H6zM14 4h4v16h-4z" /> : <path d="M7 4v16l13-8z" />}
        </svg>
        {t("hero.walk")}
      </button>
    </div>
  );
}
