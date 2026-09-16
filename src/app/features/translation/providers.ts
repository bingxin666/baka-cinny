import { TranslationApiType, TranslationSettings, TranslateResult } from '../../state/translation';

export type TranslateRequest = {
  text: string;
  targetLang: string;
  sourceLang?: string;
};

export type TranslationProviderInfo = {
  id: TranslationApiType | 'builtin';
  label: string;
  needsKey: boolean;
  needsUrl: boolean;
  defaultUrl?: string;
  defaultModel?: string;
};

export const BUILTIN_PROVIDER_ID = 'builtin';

/**
 * Built-in free Google Translate web endpoint (gtx client).
 * Zero configuration, but message text is still sent to Google.
 */
export const translateWithBuiltin = async ({
  text,
  targetLang,
}: TranslateRequest): Promise<TranslateResult> => {
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'auto');
  url.searchParams.set('tl', targetLang);
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', text);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Built-in translator failed (${res.status})`);
  }
  const data = await res.json();
  const segments: string[][] = Array.isArray(data?.[0]) ? data[0] : [];
  const translated = segments.map((s) => (Array.isArray(s) ? s[0] : '')).join('');
  if (!translated) throw new Error('Built-in translator returned empty result');
  return {
    text: translated,
    detectedSourceLang: typeof data?.[2] === 'string' ? data[2] : undefined,
    provider: BUILTIN_PROVIDER_ID,
  };
};

const resolveOpenAiBaseUrl = (apiUrl: string): string => {
  const trimmed = (apiUrl || 'https://api.openai.com').replace(/\/+$/, '');
  if (trimmed.endsWith('/v1')) return trimmed;
  return `${trimmed}/v1`;
};

const translateWithOpenAiCompatible = async (
  settings: TranslationSettings,
  { text, targetLang }: TranslateRequest
): Promise<TranslateResult> => {
  if (!settings.translationApiKey) {
    throw new Error('Missing API key');
  }
  const base = resolveOpenAiBaseUrl(settings.translationApiUrl);
  const model = settings.translationModel || 'gpt-4o-mini';
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.translationApiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `You are a translation engine. Translate the user message into ${targetLang}. Preserve meaning, tone, emoji, code blocks, and formatting. Return only the translation, no explanations.`,
        },
        { role: 'user', content: text },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI-compatible API failed (${res.status})`);
  }
  const data = await res.json();
  const translated = data?.choices?.[0]?.message?.content?.trim();
  if (!translated) throw new Error('API returned empty translation');
  return { text: translated, provider: 'openai' };
};

const translateWithDeepl = async (
  settings: TranslationSettings,
  { text, targetLang }: TranslateRequest
): Promise<TranslateResult> => {
  if (!settings.translationApiKey) {
    throw new Error('Missing DeepL API key');
  }
  const base =
    settings.translationApiUrl?.trim() || 'https://api-free.deepl.com/v2/translate';
  const res = await fetch(base.replace(/\/+$/, ''), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `DeepL-Auth-Key ${settings.translationApiKey}`,
    },
    body: JSON.stringify({
      text: [text],
      target_lang: targetLang.replace('zh-CN', 'ZH').replace('zh-TW', 'ZH').toUpperCase(),
    }),
  });
  if (!res.ok) {
    throw new Error(`DeepL API failed (${res.status})`);
  }
  const data = await res.json();
  const translated = data?.translations?.[0]?.text;
  if (!translated) throw new Error('DeepL returned empty translation');
  return {
    text: translated,
    detectedSourceLang: data?.translations?.[0]?.detected_source_language,
    provider: 'deepl',
  };
};

const translateWithLibreTranslate = async (
  settings: TranslationSettings,
  { text, targetLang, sourceLang }: TranslateRequest
): Promise<TranslateResult> => {
  const base = (settings.translationApiUrl || 'https://libretranslate.com').replace(/\/+$/, '');
  const body: Record<string, unknown> = {
    q: text,
    target: targetLang,
    source: sourceLang || 'auto',
    format: 'text',
  };
  if (settings.translationApiKey) {
    body.api_key = settings.translationApiKey;
  }
  const res = await fetch(`${base}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`LibreTranslate failed (${res.status})`);
  }
  const data = await res.json();
  if (!data?.translatedText) throw new Error('LibreTranslate returned empty translation');
  return {
    text: data.translatedText,
    detectedSourceLang: data.detectedLanguage?.language,
    provider: 'libretranslate',
  };
};

const translateWithCustom = async (
  settings: TranslationSettings,
  req: TranslateRequest
): Promise<TranslateResult> => {
  if (!settings.translationApiUrl) {
    throw new Error('Missing custom API URL');
  }
  const res = await fetch(settings.translationApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(settings.translationApiKey
        ? { Authorization: `Bearer ${settings.translationApiKey}` }
        : {}),
    },
    body: JSON.stringify({
      q: req.text,
      text: req.text,
      source: req.sourceLang || 'auto',
      target: req.targetLang,
      target_lang: req.targetLang,
    }),
  });
  if (!res.ok) {
    throw new Error(`Custom API failed (${res.status})`);
  }
  const data = await res.json();
  const translated =
    data?.translatedText ??
    data?.translation ??
    data?.text ??
    data?.choices?.[0]?.message?.content ??
    data?.data?.translations?.[0]?.translatedText;
  if (!translated || typeof translated !== 'string') {
    throw new Error('Custom API returned unsupported response shape');
  }
  return { text: translated, provider: 'custom' };
};

export const translateText = async (
  settings: TranslationSettings,
  req: TranslateRequest
): Promise<TranslateResult> => {
  if (!settings.translationEnabled) {
    throw new Error('Translation is disabled');
  }
  if (settings.translationProvider === 'builtin') {
    return translateWithBuiltin(req);
  }
  switch (settings.translationApiType) {
    case 'openai':
      return translateWithOpenAiCompatible(settings, req);
    case 'deepl':
      return translateWithDeepl(settings, req);
    case 'libretranslate':
      return translateWithLibreTranslate(settings, req);
    case 'custom':
      return translateWithCustom(settings, req);
    default:
      throw new Error('Unknown translation API type');
  }
};

export const resolveTargetLanguage = (settings: TranslationSettings, uiLanguage: string): string => {
  if (settings.translationTargetLang) return settings.translationTargetLang;
  return uiLanguage || 'en';
};
