export type AppLanguageCode = 'en' | 'zh-CN' | 'zh-TW' | 'ja' | 'de';

export type AppLanguage = {
  code: AppLanguageCode;
  /** Native name shown in the language picker */
  nativeName: string;
  /** English name */
  englishName: string;
};

export const SUPPORTED_LANGUAGES: AppLanguage[] = [
  { code: 'en', nativeName: 'English', englishName: 'English' },
  { code: 'zh-CN', nativeName: '简体中文', englishName: 'Chinese (Simplified)' },
  { code: 'zh-TW', nativeName: '繁體中文', englishName: 'Chinese (Traditional)' },
  { code: 'ja', nativeName: '日本語', englishName: 'Japanese' },
  { code: 'de', nativeName: 'Deutsch', englishName: 'German' },
];

export const DEFAULT_LANGUAGE: AppLanguageCode = 'en';

/** Map browser language tags onto supported app languages. */
export const normalizeLanguage = (lng?: string | null): AppLanguageCode => {
  if (!lng) return DEFAULT_LANGUAGE;
  const lower = lng.toLowerCase();
  if (lower.startsWith('zh')) {
    if (lower.includes('tw') || lower.includes('hant') || lower.includes('hk')) return 'zh-TW';
    return 'zh-CN';
  }
  if (lower.startsWith('ja')) return 'ja';
  if (lower.startsWith('de')) return 'de';
  if (lower.startsWith('en')) return 'en';
  return DEFAULT_LANGUAGE;
};

export const findLanguage = (code: string): AppLanguage =>
  SUPPORTED_LANGUAGES.find((l) => l.code === code) ??
  SUPPORTED_LANGUAGES.find((l) => l.code === DEFAULT_LANGUAGE)!;
