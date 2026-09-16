import React, { useEffect, useMemo } from 'react';
import { Box, color, Icon, Icons, Spinner, Text, config } from 'folds';
import { MatrixEvent } from 'matrix-js-sdk';
import { useTranslation } from 'react-i18next';
import { useAtom, useAtomValue } from 'jotai';
import { AsyncStatus } from '../../hooks/useAsyncCallback';
import { useMatrixClient } from '../../hooks/useMatrixClient';
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

/**
 * Inline translation under a message.
 * - Manual: toggled from the message menu (activeTranslationsAtom true/false)
 * - Auto: when translationAuto is on, every incoming text message from others
 *   is translated unless the user explicitly chose "Show original" (false).
 */
export function MessageTranslation({ mEvent }: MessageTranslationProps) {
  const { t } = useTranslation();
  const mx = useMatrixClient();
  const settings = useAtomValue(translationAtom);
  const activeMap = useAtomValue(activeTranslationsAtom);
  const { result, status, error, translate } = useMessageTranslate();
  const body = getMessagePlainText(mEvent);
  const eventId = mEvent.getId();

  const isOwnMessage = useMemo(() => {
    const sender = mEvent.getSender();
    const me = mx.getUserId();
    return !!sender && !!me && sender === me;
  }, [mEvent, mx]);

  // true = force show, false = force hide, undefined = follow auto
  const manualState = eventId ? activeMap[eventId] : undefined;

  const shouldAutoTranslate =
    settings.translationEnabled &&
    settings.translationAuto &&
    !!body &&
    !!eventId &&
    !isOwnMessage &&
    manualState !== false;

  const shouldShow =
    settings.translationEnabled &&
    !!body &&
    !!eventId &&
    (manualState === true || shouldAutoTranslate);

  useEffect(() => {
    if (shouldShow && body) {
      translate(body);
    }
  }, [shouldShow, body, translate]);

  if (!settings.translationEnabled) return null;
  if (!body || !eventId) return null;
  if (!shouldShow) return null;

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

/** Used by the message menu: decide whether translation is currently shown. */
export const isMessageTranslationShown = (
  eventId: string | undefined,
  activeMap: Record<string, boolean>,
  options: { auto: boolean; isOwnMessage: boolean; enabled: boolean }
): boolean => {
  if (!options.enabled || !eventId) return false;
  const manual = activeMap[eventId];
  if (manual === true) return true;
  if (manual === false) return false;
  return options.auto && !options.isOwnMessage;
};

export type { TranslateResult };
