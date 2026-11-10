import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { startDomTranslation } from './domTranslate';

/**
 * Site language (Thai / English). Texts are written next to each other where they are used:
 *   const { t } = useLang();   t('ซื้อบัตร', 'Buy tickets')
 * The choice is remembered in this browser. Thai stays the default.
 */
export type Lang = 'th' | 'en';
const KEY = 'csr_lang';

const initial = (): Lang => {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'th' || saved === 'en') return saved;
  } catch {
    /* storage can be blocked */
  }
  return 'th';
};

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (th: string, en: string) => string;
}

const LangContext = createContext<Ctx>({ lang: 'th', setLang: () => {}, t: (th) => th });

export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(initial);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // English: Thai text that is not written with t() yet is swapped for the dictionary's English (see domTranslate.ts)
  useEffect(() => {
    if (lang !== 'en') return;
    return startDomTranslation();
  }, [lang]);

  const value = useMemo<Ctx>(() => ({ lang, setLang, t: (th, en) => (lang === 'en' ? en : th) }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
};

export const useLang = () => useContext(LangContext);

/** TH | EN pill. `dark` is for the purple header. */
export const LangSwitch: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { lang, setLang } = useLang();
  return (
    <div role="group" aria-label="Language / ภาษา" className={`inline-flex items-center rounded-full border border-white/45 bg-white/10 p-0.5 ${className}`}>
      {(['th', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`min-w-[44px] min-h-[44px] rounded-full px-3 py-1.5 text-xs font-black tracking-wide cursor-pointer transition-colors ${
            lang === l ? 'bg-[#FFC928] text-[#1F1035]' : 'text-white/85 hover:text-white'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
};
