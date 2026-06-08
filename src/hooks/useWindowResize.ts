import { useCallback } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { LogicalSize, LogicalPosition } from '@tauri-apps/api/dpi';

const AVATAR_W = 200;
const PANEL_W = 320;
const WIN_H_COLLAPSED = 260;
const WIN_H_EXPANDED = 500;
const MARGIN = 20;

export function useWindowResize() {
  const collapseWindow = useCallback(async () => {
    try {
      const win = getCurrentWindow();
      const screenW = window.screen.width;
      const screenH = window.screen.height;
      await win.setSize(new LogicalSize(AVATAR_W, WIN_H_COLLAPSED));
      await win.setPosition(new LogicalPosition(
        screenW - AVATAR_W - MARGIN,
        screenH - WIN_H_COLLAPSED - MARGIN,
      ));
    } catch (e) {
      console.error('Window collapse failed:', e);
    }
  }, []);

  const expandWindow = useCallback(async () => {
    try {
      const win = getCurrentWindow();
      const screenW = window.screen.width;
      const screenH = window.screen.height;
      const totalW = AVATAR_W + PANEL_W;
      await win.setSize(new LogicalSize(totalW, WIN_H_EXPANDED));
      await win.setPosition(new LogicalPosition(
        screenW - totalW - MARGIN,
        screenH - WIN_H_EXPANDED - MARGIN,
      ));
    } catch (e) {
      console.error('Window expand failed:', e);
    }
  }, []);

  return { collapseWindow, expandWindow };
}
