"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import en from "./en.json";
import pt from "./pt.json";
import uk from "./uk.json";

export type Lang = "en" | "pt" | "uk";

export const LANGS: { code: Lang; short: string; label: string }[] = [
  { code: "en", short: "EN", label: "English" },
  { code: "pt", short: "PT", label: "Português" },
  { code: "uk", short: "UK", label: "Українська" },
];

const dicts: Record<Lang, unknown> = { en, pt, uk };
const STORAGE_KEY = "portfolio-lang";
const listeners = new Set<() => void>();

const isLang = (v: unknown): v is Lang => v === "en" || v === "pt" || v === "uk";

/** Saved choice -> browser language -> English. */
function detect(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    /* storage unavailable */
  }
  const prefs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const raw of prefs) {
    const code = (raw ?? "").toLowerCase();
    if (code.startsWith("pt")) return "pt";
    if (code.startsWith("uk")) return "uk";
    if (code.startsWith("en")) return "en";
  }
  return "en";
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  window.addEventListener("languagechange", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
    window.removeEventListener("languagechange", cb);
  };
}

function lookup(dict: unknown, key: string): unknown {
  return key
    .split(".")
    .reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], dict);
}

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Translated string for a dotted key. */
  t: (key: string) => string;
  /** Translated array (or any structured value) for a dotted key. */
  list: <T = string>(key: string) => T[];
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // Server and first client render use "en"; React then swaps in the detected language.
  const lang = useSyncExternalStore(subscribe, detect, () => "en" as Lang);

  useEffect(() => {
    document.documentElement.lang = lang === "uk" ? "uk" : lang === "pt" ? "pt-PT" : "en";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
    listeners.forEach((cb) => cb());
  }, []);

  const value = useMemo<I18nValue>(() => {
    const read = (key: string): unknown => lookup(dicts[lang], key) ?? lookup(dicts.en, key);
    return {
      lang,
      setLang,
      t: (key) => {
        const v = read(key);
        return typeof v === "string" ? v : key;
      },
      list: <T,>(key: string) => {
        const v = read(key);
        return Array.isArray(v) ? (v as T[]) : [];
      },
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
