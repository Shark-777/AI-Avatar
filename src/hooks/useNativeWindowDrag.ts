import { invoke } from '@tauri-apps/api/core';
import type { PointerEvent as ReactPointerEvent } from 'react';

export function useNativeWindowDrag() {
  return {
    onPointerDown(event: ReactPointerEvent<HTMLElement>) {
      if (event.button !== 0) return;
      void invoke('start_main_window_drag').catch(() => {
        /* Browser smoke tests and non-Tauri previews cannot drag the native window. */
      });
    },
  };
}
