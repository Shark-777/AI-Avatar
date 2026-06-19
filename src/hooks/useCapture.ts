import { useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../store/appStore';
import { resolveVisionProvider } from '../utils/aiProviders';

export function useAutoCapture() {
  const { state, dispatch } = useAppStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runCapture = useCallback(async () => {
    const vision = resolveVisionProvider(state.config);
    const provider = vision.provider;
    const apiKey = vision.apiKey;
    if (state.config.private_mode || !apiKey || state.isAnalyzing) return;
    if (!state.config.monitor_desktop) return;

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
      console.error('Auto-capture failed:', err);
      dispatch({ type: 'SET_AVATAR_STATE', payload: 'idle' });
      invoke('clear_annotation').catch(console.error);
      invoke('hide_overlay').catch(console.error);
    } finally {
      dispatch({ type: 'SET_ANALYZING', payload: false });
    }
  }, [state.config, state.isAnalyzing, dispatch]);

  useEffect(() => {
    if (!state.config.auto_suggest || !state.config.monitor_desktop) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = state.config.capture_interval_secs * 1000;
    timerRef.current = setInterval(runCapture, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.config.auto_suggest, state.config.monitor_desktop, state.config.capture_interval_secs, runCapture]);

  return { runCapture };
}
