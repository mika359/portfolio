"use client";

import { useI18n } from "@/i18n/I18nProvider";

/**
 * Full name with the pieces that spell the "mlev" domain highlighted:
 * the first letter of the first name (M) and the first three letters of the surname (Lev).
 */
export default function BrandName({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  const first = t("hero.name");
  const last = t("hero.surname");

  return (
    <span translate="no" className={className}>
      <span className="text-accent">{first.slice(0, 1)}</span>
      {first.slice(1)}{" "}
      <span className="text-accent">{last.slice(0, 3)}</span>
      {last.slice(3)}
    </span>
  );
}
