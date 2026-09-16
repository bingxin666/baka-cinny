import React, { MouseEventHandler, useState } from 'react';
import {
  Box,
  Button,
  config,
  color,
  Icon,
  Icons,
  Input,
  Menu,
  MenuItem,
  PopOut,
  RectCords,
  Scroll,
  Switch,
  Text,
  Dialog,
  Header,
  IconButton,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  toRem,
} from 'folds';
import FocusTrap from 'focus-trap-react';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import { Page, PageContent, PageHeader } from '../../../components/page';
import { SequenceCard } from '../../../components/sequence-card';
import { SettingTile } from '../../../components/setting-tile';
import { SequenceCardStyle } from '../styles.css';
import {
  TranslationApiType,
  TranslationProviderType,
  translationAtom,
  TranslationSettings as TranslationSettingsType,
} from '../../../state/translation';
import { stopPropagation } from '../../../utils/keyboard';
import { SUPPORTED_LANGUAGES } from '../../../i18n-config';

type Option<T extends string> = { value: T; label: string };

function SelectOption<T extends string>({
  options,
  value,
  onSelect,
}: {
  options: Option<T>[];
  value: T;
  onSelect: (v: T) => void;
}) {
  const [cords, setCords] = useState<RectCords>();
  const selected = options.find((o) => o.value === value);

  const handleOpen: MouseEventHandler<HTMLButtonElement> = (evt) => {
    setCords(evt.currentTarget.getBoundingClientRect());
  };

  return (
    <>
      <Button
        size="300"
        variant="Secondary"
        outlined
        fill="Soft"
        radii="300"
        after={<Icon size="300" src={Icons.ChevronBottom} />}
        onClick={handleOpen}
      >
        <Text size="T300">{selected?.label ?? value}</Text>
      </Button>
      <PopOut
        anchor={cords}
        offset={5}
        position="Bottom"
        align="End"
        content={
          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              onDeactivate: () => setCords(undefined),
              clickOutsideDeactivates: true,
              escapeDeactivates: stopPropagation,
            }}
          >
            <Menu>
              <Box direction="Column" gap="100" style={{ padding: config.space.S100 }}>
                {options.map((opt) => (
                  <MenuItem
                    key={opt.value}
                    size="300"
                    variant={opt.value === value ? 'Primary' : 'Surface'}
                    radii="300"
                    onClick={() => {
                      onSelect(opt.value);
                      setCords(undefined);
                    }}
                  >
                    <Text size="T300">{opt.label}</Text>
                  </MenuItem>
                ))}
              </Box>
            </Menu>
          </FocusTrap>
        }
      />
    </>
  );
}

function PrivacyAckDialog({
  open,
  onAccept,
  onClose,
}: {
  open: boolean;
  onAccept: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Overlay open={open} backdrop={<OverlayBackdrop />}>
      <OverlayCenter>
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            onDeactivate: onClose,
            clickOutsideDeactivates: true,
            escapeDeactivates: stopPropagation,
          }}
        >
          <Dialog variant="Surface">
            <Header
              style={{
                padding: `0 ${config.space.S200} 0 ${config.space.S400}`,
                borderBottomWidth: config.borderWidth.B300,
              }}
              variant="Surface"
              size="500"
            >
              <Box grow="Yes">
                <Text size="H4">{t('translation.privacy_title')}</Text>
              </Box>
              <IconButton size="300" onClick={onClose} radii="300">
                <Icon src={Icons.Cross} />
              </IconButton>
            </Header>
            <Box
              direction="Column"
              gap="400"
              style={{ padding: config.space.S400, maxWidth: toRem(480) }}
            >
              <Text priority="400">{t('translation.privacy_third_party_body')}</Text>
              <Box gap="200" justifyContent="End">
                <Button size="400" variant="Secondary" radii="300" onClick={onClose}>
                  <Text size="B400">{t('common.cancel')}</Text>
                </Button>
                <Button
                  size="400"
                  variant="Primary"
                  radii="300"
                  onClick={() => {
                    onAccept();
                    onClose();
                  }}
                >
                  <Text size="B400">{t('translation.privacy_ack')}</Text>
                </Button>
              </Box>
            </Box>
          </Dialog>
        </FocusTrap>
      </OverlayCenter>
    </Overlay>
  );
}

export function TranslationSettings({ requestClose }: { requestClose: () => void }) {
  const { t } = useTranslation();
  const [settings, setSettings] = useAtom(translationAtom);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const update = (patch: Partial<TranslationSettingsType>) => {
    setSettings({ ...settings, ...patch });
  };

  const providerOptions: Option<TranslationProviderType>[] = [
    { value: 'builtin', label: t('translation.provider_builtin') },
    { value: 'api', label: t('translation.provider_api') },
  ];

  const apiTypeOptions: Option<TranslationApiType>[] = [
    { value: 'openai', label: t('translation.api_openai') },
    { value: 'deepl', label: t('translation.api_deepl') },
    { value: 'libretranslate', label: t('translation.api_libretranslate') },
    { value: 'custom', label: t('translation.api_custom') },
  ];

  const targetLangOptions: Option<string>[] = [
    { value: '', label: t('translation.follow_ui_language') },
    ...SUPPORTED_LANGUAGES.map((l) => ({ value: l.code, label: l.nativeName })),
  ];

  const usingThirdParty = settings.translationProvider === 'api';

  const handleProviderChange = (provider: TranslationProviderType) => {
    if (provider === 'api' && !settings.translationThirdPartyAck) {
      setPrivacyOpen(true);
    }
    update({ translationProvider: provider });
  };

  return (
    <Page>
      <PageHeader outlined={false}>
        <Box grow="Yes" gap="200">
          <Box grow="Yes" alignItems="Center" gap="200">
            <Text size="H3" truncate>
              {t('settings.translation')}
            </Text>
          </Box>
          <Box shrink="No">
            <IconButton onClick={requestClose} variant="Surface">
              <Icon src={Icons.Cross} />
            </IconButton>
          </Box>
        </Box>
      </PageHeader>
      <Box grow="Yes">
        <Scroll hideTrack visibility="Hover">
          <PageContent>
            <Box direction="Column" gap="700">
              <Box direction="Column" gap="100">
                <Text size="L400">{t('translation.general')}</Text>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                >
                  <SettingTile
                    title={t('translation.enable')}
                    description={t('translation.enable_desc')}
                    after={
                      <Switch
                        variant="Primary"
                        value={settings.translationEnabled}
                        onChange={(v) => update({ translationEnabled: v })}
                      />
                    }
                  />
                </SequenceCard>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                >
                  <SettingTile
                    title={t('translation.auto')}
                    description={t('translation.auto_desc')}
                    after={
                      <Switch
                        variant="Primary"
                        value={settings.translationAuto && settings.translationEnabled}
                        onChange={(v) => update({ translationAuto: v })}
                      />
                    }
                  />
                </SequenceCard>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                >
                  <SettingTile
                    title={t('translation.target_lang')}
                    after={
                      <SelectOption
                        options={targetLangOptions}
                        value={settings.translationTargetLang}
                        onSelect={(v) => update({ translationTargetLang: v })}
                      />
                    }
                  />
                </SequenceCard>
              </Box>

              <Box direction="Column" gap="100">
                <Text size="L400">{t('translation.provider_section')}</Text>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                >
                  <SettingTile
                    title={t('translation.provider')}
                    description={t('translation.provider_desc')}
                    after={
                      <SelectOption
                        options={providerOptions}
                        value={settings.translationProvider}
                        onSelect={handleProviderChange}
                      />
                    }
                  />
                </SequenceCard>

                {settings.translationProvider === 'builtin' && (
                  <SequenceCard
                    className={SequenceCardStyle}
                    variant="SurfaceVariant"
                    direction="Column"
                  >
                    <SettingTile
                      title={t('translation.provider_builtin')}
                      description={t('translation.provider_builtin_desc')}
                    />
                  </SequenceCard>
                )}

                {usingThirdParty && (
                  <>
                    <SequenceCard
                      className={SequenceCardStyle}
                      variant="SurfaceVariant"
                      direction="Column"
                    >
                      <Box
                        style={{
                          padding: config.space.S300,
                          borderRadius: config.radii.R300,
                          backgroundColor: color.Warning.Container,
                        }}
                        direction="Column"
                        gap="200"
                      >
                        <Text size="T300" style={{ color: color.Warning.Main }}>
                          {t('translation.privacy_third_party_warn')}
                        </Text>
                        <Button
                          size="300"
                          variant="Warning"
                          fill="Soft"
                          outlined
                          radii="300"
                          onClick={() => setPrivacyOpen(true)}
                        >
                          <Text size="B300">{t('translation.privacy_title')}</Text>
                        </Button>
                      </Box>
                    </SequenceCard>

                    <SequenceCard
                      className={SequenceCardStyle}
                      variant="SurfaceVariant"
                      direction="Column"
                    >
                      <SettingTile
                        title={t('translation.api_type')}
                        after={
                          <SelectOption
                            options={apiTypeOptions}
                            value={settings.translationApiType}
                            onSelect={(v) => update({ translationApiType: v })}
                          />
                        }
                      />
                    </SequenceCard>

                    <SequenceCard
                      className={SequenceCardStyle}
                      variant="SurfaceVariant"
                      direction="Column"
                    >
                      <SettingTile title={t('translation.api_url')}>
                        <Input
                          variant="Secondary"
                          radii="300"
                          size="300"
                          value={settings.translationApiUrl}
                          onChange={(e) => update({ translationApiUrl: e.currentTarget.value })}
                          placeholder={
                            settings.translationApiType === 'openai'
                              ? 'https://api.openai.com'
                              : settings.translationApiType === 'deepl'
                              ? 'https://api-free.deepl.com/v2/translate'
                              : settings.translationApiType === 'libretranslate'
                              ? 'https://libretranslate.com'
                              : 'https://example.com/translate'
                          }
                        />
                      </SettingTile>
                    </SequenceCard>

                    {settings.translationApiType === 'openai' && (
                      <SequenceCard
                        className={SequenceCardStyle}
                        variant="SurfaceVariant"
                        direction="Column"
                      >
                        <SettingTile title={t('translation.api_model')}>
                          <Input
                            variant="Secondary"
                            radii="300"
                            size="300"
                            value={settings.translationModel}
                            onChange={(e) => update({ translationModel: e.currentTarget.value })}
                            placeholder="gpt-4o-mini"
                          />
                        </SettingTile>
                      </SequenceCard>
                    )}

                    <SequenceCard
                      className={SequenceCardStyle}
                      variant="SurfaceVariant"
                      direction="Column"
                    >
                      <SettingTile
                        title={t('translation.api_key')}
                        description={t('translation.api_key_desc')}
                      >
                        <Input
                          variant="Secondary"
                          radii="300"
                          size="300"
                          type="password"
                          value={settings.translationApiKey}
                          onChange={(e) => update({ translationApiKey: e.currentTarget.value })}
                          placeholder={t('translation.api_key_placeholder')}
                        />
                      </SettingTile>
                    </SequenceCard>

                    {!settings.translationThirdPartyAck && (
                      <SequenceCard
                        className={SequenceCardStyle}
                        variant="SurfaceVariant"
                        direction="Column"
                      >
                        <SettingTile
                          title={t('translation.ack_required')}
                          description={t('translation.ack_required_desc')}
                          after={
                            <Button
                              size="300"
                              variant="Primary"
                              radii="300"
                              onClick={() => setPrivacyOpen(true)}
                            >
                              <Text size="B300">{t('translation.privacy_ack')}</Text>
                            </Button>
                          }
                        />
                      </SequenceCard>
                    )}
                  </>
                )}
              </Box>
            </Box>
          </PageContent>
        </Scroll>
      </Box>
      <PrivacyAckDialog
        open={privacyOpen}
        onAccept={() => update({ translationThirdPartyAck: true })}
        onClose={() => setPrivacyOpen(false)}
      />
    </Page>
  );
}
