import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../../store/appStore';
import { AppConfig, Message } from '../../types';
import { getProviderInfo, resolveVisionProvider } from '../../utils/aiProviders';
import { useNativeWindowDrag } from '../../hooks/useNativeWindowDrag';
import styles from './ControlBar.module.css';

interface ToggleDef {
  key: keyof AppConfig;
  icon: string;
  label: string;
}

const TOGGLES: ToggleDef[] = [
  { key: 'monitor_desktop', icon: '●', label: 'Watch screen' },
  { key: 'private_mode', icon: '🔒', label: 'Private mode' },
  { key: 'voice_enabled', icon: '🔊', label: 'Speak replies' },
];

interface Props {
  onOpenSettings: () => void;
  onToggleChat: () => void;
  onDisable: () => Promise<void>;
}

export function ControlBar({ onOpenSettings, onToggleChat, onDisable }: Props) {
  const { state, dispatch } = useAppStore();
  const dragHandlers = useNativeWindowDrag();
  const analyzeTooltip = state.config.private_mode
    ? 'Private mode is on'
    : state.isAnalyzing
      ? 'Analyzing...'
      : 'Analyze screen';

  async function toggleSetting(key: keyof AppConfig) {
    const current = state.config[key] as boolean;
    const newConfig: AppConfig = { ...state.config, [key]: !current };
    dispatch({ type: 'SET_CONFIG', payload: newConfig });
    const toggle = TOGGLES.find(item => item.key === key);
    dispatch({
      type: 'ADD_FLOATING_CARD',
      payload: {
        id: crypto.randomUUID(),
        content: `${toggle?.label ?? String(key)}: ${!current ? 'on' : 'off'}`,
        type: 'info',
        timestamp: Date.now(),
      },
    });
    try {
      await invoke('save_config', { newConfig });
    } catch (e) {
      console.error('Failed to save config:', e);
    }
  }

  async function triggerCapture() {
    dispatch({ type: 'SET_PANEL_VISIBLE', payload: true });
    if (state.config.private_mode) return;
    const vision = resolveVisionProvider(state.config);
    const provider = vision.provider;
    const providerInfo = getProviderInfo(provider);
    const apiKey = vision.apiKey;
    if (!apiKey) {
      dispatch({
        type: 'ADD_FLOATING_CARD',
        payload: {
          id: crypto.randomUUID(),
          content: 'Set an API key for the active vision provider first.',
          type: 'error',
          timestamp: Date.now(),
        },
      });
      return;
    }
    if (vision.usedFallback) {
      const activeInfo = getProviderInfo(state.config.active_ai_provider);
      dispatch({
        type: 'ADD_FLOATING_CARD',
        payload: {
          id: crypto.randomUUID(),
          content: `${activeInfo?.name ?? state.config.active_ai_provider} stays active; screen vision will use ${providerInfo?.name ?? provider}.`,
          type: 'info',
          timestamp: Date.now(),
        },
      });
    }
    dispatch({ type: 'SET_ANALYZING', payload: true });
    try {
      const imageBase64 = await invoke<string>('capture_screen');
      const response = await invoke<any>('analyze_screen', {
        imageBase64,
        apiKey,
        provider,
        userMessage: null,
      });
      dispatch({ type: 'SET_ANALYSIS', payload: response });

      const assistantContent =
        response.recommendation ||
        `I analyzed your screen with ${providerInfo?.name ?? provider}. ${response.context || 'No immediate issue found.'}`;
      const assistantMsg: Message = {
        id: Date.now(),
        role: 'assistant',
        content: assistantContent,
        avatar_state: response.avatar_state,
        created_at: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_MESSAGE', payload: assistantMsg });
      invoke('save_message', {
        role: 'assistant',
        content: assistantContent,
        avatarState: response.avatar_state,
      }).catch(console.error);

      if (response.recommendation) {
        dispatch({
          type: 'ADD_FLOATING_CARD',
          payload: {
            id: crypto.randomUUID(),
            content: response.recommendation,
            type: response.error_detected ? 'error' : 'suggestion',
            timestamp: Date.now(),
          },
        });
      }
      if (response.annotation?.type !== 'none') {
        await invoke('show_overlay');
        await invoke('update_annotation', { annotation: response.annotation });
        setTimeout(() => {
          invoke('clear_annotation');
          invoke('hide_overlay');
        }, 8000);
      } else {
        invoke('clear_annotation').catch(console.error);
        invoke('hide_overlay').catch(console.error);
      }
    } catch (err) {
      dispatch({ type: 'SET_AVATAR_STATE', payload: 'idle' });
      dispatch({ type: 'SET_ERROR', payload: String(err) });
      invoke('clear_annotation').catch(console.error);
      invoke('hide_overlay').catch(console.error);
    } finally {
      dispatch({ type: 'SET_ANALYZING', payload: false });
    }
  }

  return (
    <div className={styles.bar}>
      <button
        className={`${styles.toggle} ${styles.dragToggle}`}
        title="Move Buddy"
        aria-label="Move Buddy"
        data-tooltip="Move Buddy"
        {...dragHandlers}
      >
        <span className={styles.dragGlyph}>⠿</span>
      </button>

      {/* Capture button */}
      <button
        className={`${styles.btn} ${styles.captureBtn}`}
        onClick={triggerCapture}
        title={analyzeTooltip}
        aria-label={analyzeTooltip}
        data-tooltip={analyzeTooltip}
        disabled={state.isAnalyzing || state.config.private_mode}
      >
        {state.isAnalyzing ? (
          <span className={styles.spinner}>⋯</span>
        ) : (
          <span className={styles.iconGlyph}>👁</span>
        )}
      </button>

      <button
        className={`${styles.toggle} ${state.isPanelVisible ? styles.toggleOn : ''}`}
        onClick={onToggleChat}
        title={state.isPanelVisible ? 'Hide chat' : 'Open chat'}
        aria-label={state.isPanelVisible ? 'Hide chat' : 'Open chat'}
        data-tooltip={state.isPanelVisible ? 'Hide chat' : 'Open chat'}
        aria-pressed={state.isPanelVisible}
      >
        <span className={styles.iconGlyph}>💬</span>
        {state.isPanelVisible && <span className={styles.activeDot} aria-hidden />}
      </button>

      <div className={styles.toggleGroup}>
        {TOGGLES.map(toggle => {
          const isOn = state.config[toggle.key] as boolean;
          const toggleClass =
            toggle.key === 'monitor_desktop'
              ? styles.powerToggle
              : toggle.key === 'private_mode'
                ? styles.privacyToggle
                : '';
          return (
            <button
              key={toggle.key}
              className={`${styles.toggle} ${isOn ? styles.toggleOn : ''} ${toggleClass}`}
              onClick={() => toggleSetting(toggle.key)}
              title={`${toggle.label}: ${isOn ? 'on' : 'off'}`}
              aria-label={`${toggle.label}: ${isOn ? 'on' : 'off'}`}
              data-tooltip={`${toggle.label}: ${isOn ? 'on' : 'off'}`}
              aria-pressed={isOn}
            >
              <span className={styles.iconGlyph}>{toggle.icon}</span>
              {isOn && <span className={styles.activeDot} aria-hidden />}
            </button>
          );
        })}
      </div>

      <button
        className={`${styles.toggle} ${styles.settingsToggle}`}
        onClick={onOpenSettings}
        title="Settings"
        aria-label="Settings"
        data-tooltip="Settings"
      >
        <span className={styles.iconGlyph}>⚙</span>
      </button>

      <button
        className={`${styles.toggle} ${styles.dangerToggle}`}
        onClick={onDisable}
        title="Hide Buddy"
        aria-label="Hide Buddy"
        data-tooltip="Hide Buddy"
      >
        <span className={styles.iconGlyph}>✕</span>
      </button>
    </div>
  );
}
