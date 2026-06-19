import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { AppProvider, useAppStore } from './store/appStore';
import { AvatarRenderer } from './components/Avatar/AvatarRenderer';
import { ChatPanel } from './components/Chat/ChatPanel';
import { FloatingCards } from './components/Chat/FloatingCard';
import { ControlBar } from './components/Controls/ControlBar';
import { SettingsPanel } from './components/Controls/SettingsPanel';
import { AnnotationCanvas } from './components/Overlay/AnnotationCanvas';
import { AppConfig } from './types';
import { useAutoCapture } from './hooks/useCapture';
import { useWindowResize } from './hooks/useWindowResize';
import styles from './App.module.css';

const BUDDY_BUBBLE_VISIBLE_MS = 12000;

function BuddyBubble({ chatVisible, onClick }: { chatVisible: boolean; onClick: () => void }) {
  const { state } = useAppStore();
  const latestAssistant = state.messages.find(message => message.role === 'assistant');
  const [showRecentReply, setShowRecentReply] = useState(false);

  useEffect(() => {
    if (!latestAssistant) {
      setShowRecentReply(false);
      return;
    }

    const createdAt = Date.parse(latestAssistant.created_at);
    const age = Number.isFinite(createdAt) ? Date.now() - createdAt : BUDDY_BUBBLE_VISIBLE_MS;
    const remaining = BUDDY_BUBBLE_VISIBLE_MS - age;
    if (remaining <= 0) {
      setShowRecentReply(false);
      return;
    }

    setShowRecentReply(true);
    const timer = window.setTimeout(() => setShowRecentReply(false), remaining);
    return () => window.clearTimeout(timer);
  }, [latestAssistant?.id, latestAssistant?.created_at]);

  const shouldShow = !chatVisible && (state.isAnalyzing || Boolean(state.error) || showRecentReply);
  if (!shouldShow) return null;

  const title = 'Buddy';
  const line = state.isAnalyzing
    ? 'Looking at your screen...'
    : state.error
      ? state.error
      : latestAssistant?.content || '';

  return (
    <button
      type="button"
      className={`${styles.buddyBubble} ${state.error ? styles.buddyBubbleError : ''}`}
      role="status"
      onClick={onClick}
      title="Open Buddy chat"
      aria-label="Open Buddy chat"
    >
      <div className={styles.buddyBubbleName}>{title}</div>
      <div className={styles.buddyBubbleLine}>{line}</div>
    </button>
  );
}

function MainView() {
  const { state, dispatch } = useAppStore();
  const [showSettings, setShowSettings] = useState(false);
  const { collapseWindow, expandWindow, hideWindow } = useWindowResize();

  useAutoCapture();

  // Load config and message history on mount
  useEffect(() => {
    invoke<AppConfig>('load_config')
      .then(config => dispatch({ type: 'SET_CONFIG', payload: config }))
      .catch(console.error);

    invoke<any[]>('get_messages', { limit: 50 })
      .then(messages => dispatch({ type: 'SET_MESSAGES', payload: messages }))
      .catch(console.error);

    invoke('clear_annotation').catch(() => {});
    invoke('hide_overlay').catch(() => {});
  }, [dispatch]);

  // Resize main window when panel visibility changes
  useEffect(() => {
    if (!state.config.pet_enabled && !showSettings) {
      hideWindow();
    } else if (showSettings) {
      expandWindow('settings');
    } else if (state.isPanelVisible) {
      expandWindow('chat');
    } else {
      collapseWindow();
    }
  }, [state.config.pet_enabled, state.isPanelVisible, showSettings, expandWindow, collapseWindow, hideWindow]);

  function toggleChatPanel() {
    dispatch({ type: 'TOGGLE_PANEL' });
  }

  function openChatPanel() {
    dispatch({ type: 'SET_PANEL_VISIBLE', payload: true });
  }

  async function wakeBuddy() {
    const newConfig: AppConfig = { ...state.config, pet_enabled: true };
    try {
      await invoke('save_config', { newConfig });
      dispatch({ type: 'SET_CONFIG', payload: newConfig });
    } catch (error) {
      console.error('Failed to wake Buddy:', error);
    }
  }

  const chatVisible = state.isPanelVisible && !showSettings;

  async function disableBuddy() {
    const newConfig: AppConfig = { ...state.config, pet_enabled: false };
    try {
      dispatch({ type: 'SET_PANEL_VISIBLE', payload: false });
      await invoke('save_config', { newConfig });
      dispatch({ type: 'SET_CONFIG', payload: newConfig });
    } catch (error) {
      console.error('Failed to disable Buddy:', error);
    }
  }

  return (
    <div className={`${styles.root} ${showSettings ? styles.rootSettings : ''}`}>
      {!showSettings && (
        state.config.pet_enabled ? (
          <div className={styles.wrapper}>
            {chatVisible && (
              <ChatPanel
                visible
                position={state.config.panel_position}
              />
            )}

            <div className={styles.avatarColumn}>
              <div className={styles.floatingArea}>
                <FloatingCards cards={state.floatingCards} />
              </div>

              <div className={styles.avatarFrame}>
                <BuddyBubble chatVisible={chatVisible} onClick={openChatPanel} />
                <AvatarRenderer
                  avatarId={state.avatar}
                  state={state.avatarState}
                  size={174}
                />
                <ControlBar
                  onOpenSettings={() => setShowSettings(true)}
                  onToggleChat={toggleChatPanel}
                  onDisable={disableBuddy}
                />
              </div>
            </div>
          </div>
        ) : (
          <div
            className={styles.hiddenDock}
            onClick={wakeBuddy}
            title="Wake Buddy"
            aria-label="Wake Buddy"
            role="button"
            tabIndex={0}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                void wakeBuddy();
              }
            }}
          >
            <button
              type="button"
              className={styles.wakeBtn}
              onClick={wakeBuddy}
              title="Show Buddy"
            >
              <span className={styles.wakeDot} />
              <span>Wake Buddy</span>
            </button>
            <button
              type="button"
              className={styles.wakeSettingsBtn}
              onClick={event => {
                event.stopPropagation();
                setShowSettings(true);
              }}
              title="Settings"
            >
              ⚙
            </button>
          </div>
        )
      )}

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function OverlayView() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'transparent', pointerEvents: 'none' }}>
      <AnnotationCanvas />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<MainView />} />
          <Route path="/overlay" element={<OverlayView />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}
