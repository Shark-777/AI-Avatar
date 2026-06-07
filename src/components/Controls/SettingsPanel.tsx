import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../../store/appStore';
import { AppConfig } from '../../types';
import styles from './SettingsPanel.module.css';

interface Props {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: Props) {
  const { state, dispatch } = useAppStore();
  const [apiKey, setApiKey] = useState(state.config.api_key);
  const [interval, setInterval] = useState(String(state.config.capture_interval_secs));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const newConfig: AppConfig = {
      ...state.config,
      api_key: apiKey.trim(),
      capture_interval_secs: Math.max(5, parseInt(interval) || 30),
    };
    dispatch({ type: 'SET_CONFIG', payload: newConfig });
    try {
      await invoke('save_config', { newConfig });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
      onClose();
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
          <label className={styles.field}>
            <span className={styles.label}>Anthropic API Key</span>
            <input
              type="password"
              className={styles.input}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              autoComplete="off"
            />
            <span className={styles.hint}>Your key is stored locally and never sent anywhere except Anthropic.</span>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Auto-capture interval (seconds)</span>
            <input
              type="number"
              className={styles.input}
              value={interval}
              onChange={e => setInterval(e.target.value)}
              min="5"
              max="300"
            />
          </label>
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
