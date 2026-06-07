import { invoke } from '@tauri-apps/api/core';
import { AvatarId, AppConfig } from '../../types';
import { AVATAR_LIST } from './avatarData';
import { AvatarRenderer } from './AvatarRenderer';
import { useAppStore } from '../../store/appStore';
import styles from './AvatarPicker.module.css';

interface Props {
  onClose: () => void;
}

export function AvatarPicker({ onClose }: Props) {
  const { state, dispatch } = useAppStore();

  async function selectAvatar(id: AvatarId) {
    dispatch({ type: 'SET_AVATAR', payload: id });
    const newConfig: AppConfig = { ...state.config, avatar: id };
    dispatch({ type: 'SET_CONFIG', payload: newConfig });
    try {
      await invoke('save_config', { newConfig });
    } catch (e) {
      console.error('Failed to save config:', e);
    }
    onClose();
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Choose Your Companion</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        <div className={styles.grid}>
          {AVATAR_LIST.map(avatar => (
            <button
              key={avatar.id}
              className={`${styles.card} ${state.avatar === avatar.id ? styles.selected : ''}`}
              onClick={() => selectAvatar(avatar.id)}
            >
              <div className={styles.avatarPreview}>
                <AvatarRenderer
                  avatarId={avatar.id}
                  state="idle"
                  size={100}
                />
              </div>
              <div className={styles.info}>
                <span className={styles.name}>{avatar.name}</span>
                <span className={styles.desc}>{avatar.description}</span>
                <span className={styles.tagline}>"{avatar.tagline.slice(0, 40)}…"</span>
              </div>
              {state.avatar === avatar.id && (
                <div className={styles.checkmark}>✓</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
