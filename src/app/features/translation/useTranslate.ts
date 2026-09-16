import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import { AsyncStatus, useAsyncCallback } from '../../hooks/useAsyncCallback';
import {
  getCachedTranslation,
  setCachedTranslation,
  translationAtom,
  TranslateResult,
} from '../../state/translation';
import { resolveTargetLanguage, translateText } from './providers';

export type UseTranslateResult = {
  result?: TranslateResult;
  status: AsyncStatus;
  error?: string;
  translate: (text: string) => void;
  reset: () => void;
};

export const useMessageTranslate = (): UseTranslateResult => {
  const [settings] = useAtom(translationAtom);
  const { i18n } = useTranslation();
  const [result, setResult] = useState<TranslateResult>();

  const targetLang = useMemo(
    () => resolveTargetLanguage(settings, i18n.resolvedLanguage || 'en'),
    [settings, i18n.resolvedLanguage]
  );

  const [state, runTranslate] = useAsyncCallback(
    useCallback(
      async (text: string) => {
        const providerId =
          settings.translationProvider === 'builtin' ? 'builtin' : settings.translationApiType;
        const cached = getCachedTranslation(providerId, targetLang, text);
        if (cached) {
          setResult(cached);
          return cached;
        }
        const translated = await translateText(settings, {
          text,
          targetLang,
        });
        setCachedTranslation(providerId, targetLang, text, translated);
        setResult(translated);
        return translated;
      },
      [settings, targetLang]
    )
  );

  const translate = useCallback(
    (text: string) => {
      runTranslate(text).catch(() => {
        /* state already captures the error */
      });
    },
    [runTranslate]
  );

  const reset = useCallback(() => setResult(undefined), []);

  const error =
    state.status === AsyncStatus.Error
      ? state.error instanceof Error
        ? state.error.message
        : String(state.error)
      : undefined;

  return {
    result,
    status: state.status,
    error,
    translate,
    reset,
  };
};
