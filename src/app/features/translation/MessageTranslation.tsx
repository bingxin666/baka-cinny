import React, { useEffect } from 'react';
import { Box, color, Icon, Icons, Spinner, Text, config } from 'folds';
import { MatrixEvent } from 'matrix-js-sdk';
import { useTranslation } from 'react-i18next';
import { useAtom, useAtomValue } from 'jotai';
import { AsyncStatus } from '../../hooks/useAsyncCallback';
import {
  activeTranslationsAtom,
  translationAtom,
  TranslateResult,
} from '../../state/translation';
import { useMessageTranslate } from './useTranslate';
import * as css from './styles.css';

export const getMessagePlainText = (mEvent: MatrixEvent): string | undefined => {
  const content = mEvent.getContent();
  const body = content?.body;
  if (typeof body === 'string' && body.trim()) return body;
  return undefined;
};

type MessageTranslationProps = {
  mEvent: MatrixEvent;
};

export function MessageTranslation({ mEvent }: MessageTranslationProps) {
  const { t } = useTranslation();
  const settings = useAtomValue(translationAtom);
  const [activeMap, setActiveMap] = useAtom(activeTranslationsAtom);
  const { result, status, error, translate } = useMessageTranslate();
  const body = getMessagePlainText(mEvent);
  const eventId = mEvent.getId();

  useEffect(() => {
    if (!settings.translationEnabled || !settings.translationAuto || !eventId || !body) return;
    if (activeMap[eventId]) return;
    setActiveMap((prev) => (prev[eventId] ? prev : { ...prev, [eventId]: true }));
  }, [settings.translationEnabled, settings.translationAuto, eventId, body, activeMap, setActiveMap]);

  const active = eventId ? !!activeMap[eventId] : false;

  useEffect(() => {
    if (active && body) {
      translate(body);
    }
  }, [active, body, translate]);

  if (!settings.translationEnabled) return null;
  if (!body || !eventId) return null;
  if (!active) return null;

  return (
    <Box
      className={css.TranslationBox}
      direction="Column"
      gap="100"
      style={{
        marginTop: config.space.S200,
        padding: config.space.S200,
        borderRadius: config.radii.R300,
      }}
    >
      <Box alignItems="Center" gap="100">
        <Icon size="100" src={Icons.Globe} />
        <Text size="T200" priority="300">
          {t('translation.translated_label')}
          {result?.detectedSourceLang ? ` · ${result.detectedSourceLang}` : ''}
        </Text>
        {status === AsyncStatus.Loading && <Spinner size="100" />}
      </Box>
      {status === AsyncStatus.Error && (
        <Text size="T300" style={{ color: color.Critical.Main }}>
          {error ?? t('translation.failed')}
        </Text>
      )}
      {result && (
        <Text size="T300" className={css.TranslationText}>
          {result.text}
        </Text>
      )}
    </Box>
  );
}

export type { TranslateResult };
