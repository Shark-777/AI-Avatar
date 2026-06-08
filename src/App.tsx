import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { AppProvider, useAppStore } from './store/appStore';
import { AvatarRenderer } from './components/Avatar/AvatarRenderer';
import { AvatarPicker } from './components/Avatar/AvatarPicker';
import { ChatPanel } from './components/Chat/ChatPanel';
import { FloatingCards } from './components/Chat/FloatingCard';
import { ControlBar } from './components/Controls/ControlBar';
import { SettingsPanel } from './components/Controls/SettingsPanel';
import { AnnotationCanvas } from './components/Overlay/AnnotationCanvas';
import { AppConfig } from './types';
import { useAutoCapture } from './hooks/useCapture';
import { useWindowResize } from './hooks/useWindowResize';
import styles from './App.module.css';

function MainView() {
  const { state, dispatch } = useAppStore();
  const [showPicker, setShowPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { collapseWindow, expandWindow } = useWindowResize();

  useAutoCapture();

  // Load config and message history on mount
  useEffect(() => {
    invoke<AppConfig>('load_config')
      .then(config => dispatch({ type: 'SET_CONFIG', payload: config }))
      .catch(console.error);

    invoke<any[]>('get_messages', { limit: 50 })
      .then(messages => dispatch({ type: 'SET_MESSAGES', payload: messages }))
      .catch(console.error);
  }, [dispatch]);

  // Resize main window when panel visibility changes
  useEffect(() => {
    if (state.isPanelVisible) {
      expandWindow();
    } else {
      collapseWindow();
    }
  }, [state.isPanelVisible, expandWindow, collapseWindow]);

  function handleAvatarClick() {
    dispatch({ type: 'TOGGLE_PANEL' });
  }

  return (
    <div className={styles.root}>
      <div className={styles.wrapper}>
        {/* Chat panel — slides in to the left of the avatar */}
        <ChatPanel
          visible={state.isPanelVisible}
          position={state.config.panel_position}
        />

        {/* Avatar column */}
        <div className={styles.avatarColumn}>
          {/* Floating cards stack above the avatar */}
          <div className={styles.floatingArea}>
            <FloatingCards cards={state.floatingCards} />
          </div>

          {/* Avatar + frame — ControlBar overlays the bottom of the circle */}
          <div className={styles.avatarFrame}>
            <AvatarRenderer
              avatarId={state.avatar}
              state={state.avatarState}
              size={160}
              onClick={handleAvatarClick}
              onLongPress={() => setShowPicker(true)}
            />

            {/* Settings gear — top-right of frame */}
            <button
              className={styles.settingsBtn}
              onClick={() => setShowSettings(true)}
              title="Settings"
            >
              ⚙
            </button>

            {/* Controls overlay — bottom of avatar circle */}
            <ControlBar />
          </div>
        </div>
      </div>

      {showPicker && <AvatarPicker onClose={() => setShowPicker(false)} />}
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
