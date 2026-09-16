import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend, { HttpBackendOptions } from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';
import { trimTrailingSlash } from './utils/common';
import { DEFAULT_LANGUAGE, normalizeLanguage, SUPPORTED_LANGUAGES } from './i18n-config';
import { getSettings } from './state/settings';

const APP_LANG_STORAGE_KEY = 'baka-cinny.language';

const readStoredLanguage = (): string | undefined => {
  const fromSettings = getSettings().language;
  if (fromSettings) return fromSettings;
  return window.localStorage.getItem(APP_LANG_STORAGE_KEY) ?? undefined;
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init<HttpBackendOptions>({
    debug: false,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    nonExplicitSupportedLngs: false,
    load: 'currentOnly',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: APP_LANG_STORAGE_KEY,
      caches: ['localStorage'],
      convertDetectedLanguage: (lng) => normalizeLanguage(lng),
    },
    backend: {
      loadPath: `${trimTrailingSlash(import.meta.env.BASE_URL)}/public/locales/{{lng}}.json`,
    },
  })
  .then(() => {
    const stored = readStoredLanguage();
    if (stored && stored !== i18n.resolvedLanguage) {
      i18n.changeLanguage(normalizeLanguage(stored));
    } else {
      i18n.changeLanguage(normalizeLanguage(i18n.resolvedLanguage ?? DEFAULT_LANGUAGE));
    }
  });

export const changeAppLanguage = async (code: string) => {
  const normalized = normalizeLanguage(code);
  window.localStorage.setItem(APP_LANG_STORAGE_KEY, normalized);
  await i18n.changeLanguage(normalized);
};

export default i18n;
