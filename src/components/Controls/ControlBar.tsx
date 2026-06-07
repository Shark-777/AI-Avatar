import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../../store/appStore';
import { AppConfig } from '../../types';
import styles from './ControlBar.module.css';

interface ToggleDef {
  key: keyof AppConfig;
  icon: string;
  label: string;
}

const TOGGLES: ToggleDef[] = [
  { key: 'monitor_desktop', icon: '🖥', label: 'Watch desktop' },
  { key: 'monitor_browser', icon: '🌐', label: 'Watch browser' },
  { key: 'auto_suggest', icon: '💡', label: 'Auto-suggest' },
  { key: 'private_mode', icon: '🔒', label: 'Private mode' },
  { key: 'voice_enabled', icon: '🎙', label: 'Voice' },
];

export function ControlBar() {
  const { state, dispatch } = useAppStore();

  async function toggleSetting(key: keyof AppConfig) {
    const current = state.config[key] as boolean;
    const newConfig: AppConfig = { ...state.config, [key]: !current };
    dispatch({ type: 'SET_CONFIG', payload: newConfig });
    try {
      await invoke('save_config', { newConfig });
    } catch (e) {
      console.error('Failed to save config:', e);
    }
  }

  async function triggerCapture() {
    if (state.config.private_mode) return;
    if (!state.config.api_key) {
      dispatch({
        type: 'ADD_FLOATING_CARD',
        payload: {
          id: crypto.randomUUID(),
          content: 'Set your API key first.',
          type: 'error',
          timestamp: Date.now(),
        },
      });
      return;
    }
    dispatch({ type: 'SET_ANALYZING', payload: true });
    try {
      const imageBase64 = await invoke<string>('capture_screen');
      const response = await invoke<any>('analyze_screen', {
        imageBase64,
        apiKey: state.config.api_key,
        userMessage: null,
      });
      dispatch({ type: 'SET_ANALYSIS', payload: response });

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
      }
    } catch (err) {
      dispatch({ type: 'SET_AVATAR_STATE', payload: 'idle' });
      dispatch({ type: 'SET_ERROR', payload: String(err) });
    }
  }

  return (
    <div className={styles.bar}>
      {/* Capture button */}
      <button
        className={`${styles.btn} ${styles.captureBtn}`}
        onClick={triggerCapture}
        title="Analyze screen now"
        disabled={state.isAnalyzing || state.config.private_mode}
      >
        {state.isAnalyzing ? (
          <span className={styles.spinner}>⋯</span>
        ) : '👁'}
      </button>

      {/* Toggle group */}
      <div className={styles.toggleGroup}>
        {TOGGLES.map(toggle => {
          const isOn = state.config[toggle.key] as boolean;
          return (
            <button
              key={toggle.key}
              className={`${styles.toggle} ${isOn ? styles.toggleOn : ''}`}
              onClick={() => toggleSetting(toggle.key)}
              title={`${toggle.label}: ${isOn ? 'on' : 'off'}`}
            >
              {toggle.icon}
            </button>
          );
        })}
      </div>
    </div>
  );
}
