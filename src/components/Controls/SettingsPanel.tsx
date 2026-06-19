import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../../store/appStore';
import { AI_PROVIDERS, AiProviderId, AppConfig, DEFAULT_API_KEYS } from '../../types';
import { getProviderInfo, resolveVisionProvider } from '../../utils/aiProviders';
import styles from './SettingsPanel.module.css';

interface Props {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: Props) {
  const { state, dispatch } = useAppStore();
  const [activeProvider, setActiveProvider] = useState<AiProviderId>(
    state.config.active_ai_provider ?? 'anthropic',
  );
  const [apiKeys, setApiKeys] = useState({
    ...DEFAULT_API_KEYS,
    ...state.config.api_keys,
    anthropic: state.config.api_keys?.anthropic || state.config.api_key || '',
  });
  const [captureInterval, setCaptureInterval] = useState(String(state.config.capture_interval_secs));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const previewConfig: AppConfig = {
    ...state.config,
    active_ai_provider: activeProvider,
    api_keys: apiKeys,
    api_key: apiKeys.anthropic,
  };
  const visionProvider = resolveVisionProvider(previewConfig);
  const activeProviderInfo = getProviderInfo(activeProvider);
  const visionProviderInfo = getProviderInfo(visionProvider.provider);
  const activeHasKey = Boolean(apiKeys[activeProvider]?.trim());

  function updateKey(provider: AiProviderId, value: string) {
    setApiKeys(current => ({ ...current, [provider]: value }));
  }

  function selectProvider(provider: AiProviderId) {
    setActiveProvider(provider);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    const parsedInterval = parseInt(captureInterval, 10);
    const trimmedKeys = Object.fromEntries(
      Object.entries(apiKeys).map(([provider, key]) => [provider, key.trim()]),
    ) as Record<AiProviderId, string>;
    const newConfig: AppConfig = {
      ...state.config,
      active_ai_provider: activeProvider,
      api_keys: trimmedKeys,
      api_key: trimmedKeys.anthropic,
      capture_interval_secs: Number.isNaN(parsedInterval) ? 30 : Math.max(5, parsedInterval),
    };
    try {
      await invoke('save_config', { newConfig });
      dispatch({ type: 'SET_CONFIG', payload: newConfig });
      onClose();
    } catch (e) {
      console.error(e);
      setSaveError(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Settings</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.body}>
          <section className={styles.surfaceSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.label}>Buddy on desktop</span>
              <span className={styles.hint}>Hide him when you need a clean workspace.</span>
            </div>

            <button
              type="button"
              className={`${styles.visibilityToggle} ${state.config.pet_enabled ? styles.visibilityToggleOn : ''}`}
              onClick={() => {
                dispatch({
                  type: 'SET_CONFIG',
                  payload: {
                    ...state.config,
                    pet_enabled: !state.config.pet_enabled,
                  },
                });
              }}
            >
              <span>{state.config.pet_enabled ? 'Buddy is visible' : 'Buddy is hidden'}</span>
              <span className={styles.visibilityKnob} />
            </button>
          </section>

          <section className={styles.surfaceSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.label}>Buddy behavior</span>
              <span className={styles.hint}>Desktop helper modes and autonomy.</span>
            </div>

            <div className={styles.behaviorGrid}>
              {[
                { key: 'monitor_desktop', label: 'Watch desktop' },
                { key: 'monitor_browser', label: 'Watch browser' },
                { key: 'auto_suggest', label: 'Auto-suggest' },
                { key: 'private_mode', label: 'Private mode' },
                { key: 'voice_enabled', label: 'Speak out loud' },
              ].map(item => {
                const enabled = state.config[item.key as keyof AppConfig] as boolean;
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`${styles.behaviorToggle} ${enabled ? styles.behaviorToggleOn : ''}`}
                    onClick={() => {
                      dispatch({
                        type: 'SET_CONFIG',
                        payload: {
                          ...state.config,
                          [item.key]: !enabled,
                        } as AppConfig,
                      });
                    }}
                  >
                    <span>{item.label}</span>
                    <strong>{enabled ? 'On' : 'Off'}</strong>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={styles.providerSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.label}>AI providers</span>
              <span className={styles.hint}>
                Keys stay local. Selected API is {activeProviderInfo?.name ?? activeProvider}
                {activeHasKey ? '' : ' after you add its key'}.
              </span>
            </div>

            <div className={styles.providerSummary}>
              <div>
                <span className={styles.summaryLabel}>Selected API</span>
                <strong>{activeProviderInfo?.name ?? activeProvider}</strong>
                <small>{activeHasKey ? 'Key saved' : 'No key yet'}</small>
              </div>
              <div>
                <span className={styles.summaryLabel}>Screen vision</span>
                <strong>{visionProviderInfo?.name ?? visionProvider.provider}</strong>
                <small>
                  {visionProvider.apiKey
                    ? visionProvider.usedFallback
                      ? 'Fallback for screen analysis'
                      : 'Direct screen analysis'
                    : 'Needs Gemini, Claude, or OpenAI key'}
                </small>
              </div>
            </div>

            <div className={styles.providerGrid}>
              {AI_PROVIDERS.map(provider => {
                const isActive = activeProvider === provider.id;
                const hasKey = Boolean(apiKeys[provider.id]?.trim());
                const canAnalyze = provider.visionEnabled;
                const roleText = canAnalyze ? 'Vision + chat' : 'Text/API key';
                const metaText = canAnalyze
                  ? 'Can inspect screenshots'
                  : 'Screen vision will use Gemini, Claude, or OpenAI';
                return (
                  <button
                    type="button"
                    key={provider.id}
                    className={`${styles.providerCard} ${isActive ? styles.providerCardActive : ''} ${!canAnalyze ? styles.providerCardStorageOnly : ''}`}
                    onClick={() => selectProvider(provider.id)}
                    title={canAnalyze ? 'Use for screen analysis' : 'Select as active API provider'}
                    aria-pressed={isActive}
                  >
                    <span className={styles.providerCardTop}>
                      <span className={styles.providerName}>{provider.name}</span>
                      <span className={styles.providerRole}>{roleText}</span>
                    </span>
                    <span className={styles.providerMeta}>
                      {metaText}
                      {hasKey ? ' · Key saved' : ''}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className={styles.keysList}>
              {AI_PROVIDERS.map(provider => (
                <label className={styles.field} key={provider.id}>
                  <span className={styles.label}>{provider.name} API Key</span>
                  <input
                    type="password"
                    className={styles.input}
                    value={apiKeys[provider.id] ?? ''}
                    onChange={e => updateKey(provider.id, e.target.value)}
                    placeholder={provider.keyPlaceholder}
                    autoComplete="off"
                  />
                </label>
              ))}
            </div>
          </section>

          <label className={styles.field}>
            <span className={styles.label}>Auto-capture interval (seconds)</span>
            <input
              type="number"
              className={styles.input}
              value={captureInterval}
              onChange={e => setCaptureInterval(e.target.value)}
              min="5"
              max="300"
            />
          </label>

          {saveError && (
            <div className={styles.saveError} role="alert">
              Settings were not saved: {saveError.slice(0, 180)}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
