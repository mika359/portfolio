"use client";

import Logo from "./Logo";
import BrandName from "./BrandName";
import { useI18n } from "@/i18n/I18nProvider";

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="relative z-10 border-t border-line px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-10">
      <div className="container-x flex flex-col items-center gap-3 text-center">
        <Logo />
        <p className="font-mono text-sm text-fg">
          <BrandName />
        </p>
        <p className="font-mono text-xs text-muted">
          © {new Date().getFullYear()} <span translate="no">mlev</span>. {t("footer.rights")}
        </p>
        <p className="font-mono text-xs text-muted">{t("footer.built")}</p>
      </div>
    </footer>
  );
}
