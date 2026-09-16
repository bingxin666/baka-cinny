import { atom } from 'jotai';

export type TranslationProviderType = 'builtin' | 'api';
export type TranslationApiType = 'openai' | 'deepl' | 'libretranslate' | 'custom';

export interface TranslationSettings {
  /** Master switch for message translation UI */
  translationEnabled: boolean;
  /** builtin = zero-config free endpoint; api = user-configured third-party */
  translationProvider: TranslationProviderType;
  translationApiType: TranslationApiType;
  translationApiKey: string;
  translationApiUrl: string;
  /** Model name for OpenAI-compatible endpoints */
  translationModel: string;
  /** Empty string means "follow app UI language" */
  translationTargetLang: string;
  /** Auto-translate every incoming message (still requires enabled) */
  translationAuto: boolean;
  /** User acknowledged that third-party APIs send message text off-device */
  translationThirdPartyAck: boolean;
}

export const defaultTranslationSettings: TranslationSettings = {
  translationEnabled: false,
  translationProvider: 'builtin',
  translationApiType: 'openai',
  translationApiKey: '',
  translationApiUrl: '',
  translationModel: 'gpt-4o-mini',
  translationTargetLang: '',
  translationAuto: false,
  translationThirdPartyAck: false,
};

export const TRANSLATION_STORAGE_KEY = 'baka-cinny.translation';

export type TranslateResult = {
  text: string;
  detectedSourceLang?: string;
  provider: string;
};

const cache = new Map<string, TranslateResult>();

const cacheKey = (provider: string, target: string, source: string) =>
  `${provider}::${target}::${source}`;

export const getCachedTranslation = (
  provider: string,
  target: string,
  source: string
): TranslateResult | undefined => cache.get(cacheKey(provider, target, source));

export const setCachedTranslation = (
  provider: string,
  target: string,
  source: string,
  result: TranslateResult
) => {
  // Keep cache bounded to avoid unbounded memory growth in long sessions.
  if (cache.size > 500) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  cache.set(cacheKey(provider, target, source), result);
};

export const clearTranslationCache = () => cache.clear();

/** eventId -> whether inline translation is currently shown */
export const activeTranslationsAtom = atom<Record<string, boolean>>({});

export const loadTranslationSettings = (): TranslationSettings => {
  const raw = localStorage.getItem(TRANSLATION_STORAGE_KEY);
  if (!raw) return defaultTranslationSettings;
  try {
    return {
      ...defaultTranslationSettings,
      ...(JSON.parse(raw) as Partial<TranslationSettings>),
    };
  } catch {
    return defaultTranslationSettings;
  }
};

const baseTranslationAtom = atom<TranslationSettings>(loadTranslationSettings());

export const translationAtom = atom(
  (get) => get(baseTranslationAtom),
  (get, set, update: TranslationSettings) => {
    set(baseTranslationAtom, update);
    localStorage.setItem(TRANSLATION_STORAGE_KEY, JSON.stringify(update));
  }
);
