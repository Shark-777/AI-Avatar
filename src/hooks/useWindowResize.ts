import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { loadBuddyWindowPosition } from '../utils/windowPosition';

function savedPositionForMode(mode: 'avatar' | 'chat') {
  const saved = loadBuddyWindowPosition();
  if (!saved) return { savedX: null, savedY: null };

  const avatarW = 480;
  const avatarH = 392;
  const winW = mode === 'chat' ? 840 : avatarW;
  const winH = mode === 'chat' ? 560 : avatarH;
  const xOffset = mode === 'chat' ? Math.max(0, winW - avatarW) : 0;
  const yOffset = Math.max(0, winH - avatarH);
  return {
    savedX: saved.x - xOffset,
    savedY: saved.y - yOffset,
  };
}

export function useWindowResize() {
  const hideWindow = useCallback(async () => {
    try {
      await invoke('set_main_window_mode', { mode: 'hidden' });
    } catch (e) {
      console.error('Window hide mode failed:', e);
    }
  }, []);

  const collapseWindow = useCallback(async () => {
    try {
      await invoke('set_main_window_mode', { mode: 'avatar', ...savedPositionForMode('avatar') });
    } catch (e) {
      console.error('Window collapse failed:', e);
    }
  }, []);

  const expandWindow = useCallback(async (mode: 'chat' | 'settings') => {
    try {
      const savedPosition = mode === 'chat' ? savedPositionForMode('chat') : { savedX: null, savedY: null };
      await invoke('set_main_window_mode', { mode, ...savedPosition });
    } catch (e) {
      console.error('Window expand failed:', e);
    }
  }, []);

  return { collapseWindow, expandWindow, hideWindow };
}
