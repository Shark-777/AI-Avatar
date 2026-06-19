import { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../../store/appStore';
import { AI_PROVIDERS, Message } from '../../types';
import { getActiveApiKey, getProviderInfo, resolveVisionProvider } from '../../utils/aiProviders';
import { canDictate, getSpeechRecognitionCtor, speakText, stopSpeaking } from '../../utils/voice';
import styles from './ChatPanel.module.css';

interface Props {
  visible: boolean;
  position: 'left' | 'right' | 'bottom';
}

export function ChatPanel({ visible, position }: Props) {
  const { state, dispatch } = useAppStore();
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [visible]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      stopSpeaking();
    };
  }, []);

  async function submitText(rawText: string) {
    const text = rawText.trim();
    if (!text || isSending) return;

    const vision = resolveVisionProvider(state.config);
    const provider = vision.provider;
    const providerInfo = getProviderInfo(provider);
    const apiKey = vision.apiKey;
    if (!apiKey) {
      dispatch({
        type: 'ADD_FLOATING_CARD',
        payload: {
          id: crypto.randomUUID(),
          content: `Please set your ${providerInfo?.name ?? 'AI provider'} API key in settings.`,
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
          content: `${activeInfo?.name ?? state.config.active_ai_provider} stays active; Buddy will inspect the screen with ${providerInfo?.name ?? provider}.`,
          type: 'info',
          timestamp: Date.now(),
        },
      });
    }

    setIsSending(true);
    dispatch({ type: 'SET_AVATAR_STATE', payload: 'thinking' });

    const userMsg: Message = {
      id: Date.now(),
      role: 'user',
      content: text,
      avatar_state: 'idle',
      created_at: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: userMsg });

    try {
      await invoke('save_message', {
        role: 'user',
        content: text,
        avatarState: 'idle',
      });

      // Take screenshot and analyze
      const imageBase64 = await invoke<string>('capture_screen');
      const response = await invoke<{
        context: string;
        error_detected: boolean;
        recommendation: string;
        annotation: { type: string; x: number; y: number; w: number; h: number; label: string };
        action_suggestion: { tool: string; target: string };
        avatar_state: string;
        confidence: number;
      }>('analyze_screen', {
        imageBase64,
        apiKey,
        provider,
        userMessage: text,
      });

      dispatch({ type: 'SET_ANALYSIS', payload: response as any });
      dispatch({ type: 'SET_AVATAR_STATE', payload: (response.avatar_state as any) || 'idle' });

      const assistantContent = response.recommendation || response.context;
      const assistantMsg: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: assistantContent,
        avatar_state: response.avatar_state as any,
        created_at: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_MESSAGE', payload: assistantMsg });
      await invoke('save_message', {
        role: 'assistant',
        content: assistantContent,
        avatarState: response.avatar_state,
      });
      if (state.config.voice_enabled) {
        speakText(assistantContent);
      }

      // Show annotation overlay if needed
      if (response.annotation.type !== 'none') {
        await invoke('show_overlay');
        await invoke('update_annotation', { annotation: response.annotation });
        // Auto-clear annotation after 8 seconds
        setTimeout(() => {
          invoke('clear_annotation');
          invoke('hide_overlay');
        }, 8000);
      } else {
        invoke('clear_annotation').catch(console.error);
        invoke('hide_overlay').catch(console.error);
      }

      // Add floating card for recommendations
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
    } catch (err) {
      const errMsg = String(err);
      dispatch({ type: 'SET_AVATAR_STATE', payload: 'idle' });
      invoke('clear_annotation').catch(console.error);
      invoke('hide_overlay').catch(console.error);
      dispatch({
        type: 'ADD_FLOATING_CARD',
        payload: {
          id: crypto.randomUUID(),
          content: `Error: ${errMsg.slice(0, 100)}`,
          type: 'error',
          timestamp: Date.now(),
        },
      });
    } finally {
      setIsSending(false);
    }
  }

  async function handleSend() {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue('');
    await submitText(text);
  }

  function handleMicClick() {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const RecognitionCtor = getSpeechRecognitionCtor();
    if (!RecognitionCtor) {
      const content = 'Диктовка в этом WebView пока недоступна. Напиши текстом в поле ниже, а голосовые ответы можно включать отдельно.';
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: Date.now(),
          role: 'assistant',
          content,
          avatar_state: 'idle',
          created_at: new Date().toISOString(),
        },
      });
      dispatch({
        type: 'ADD_FLOATING_CARD',
        payload: {
          id: crypto.randomUUID(),
          content,
          type: 'info',
          timestamp: Date.now(),
        },
      });
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.lang = 'ru-RU';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      dispatch({
        type: 'ADD_FLOATING_CARD',
        payload: {
          id: crypto.randomUUID(),
          content: 'Buddy could not hear the диктовку. Try again.',
          type: 'error',
          timestamp: Date.now(),
        },
      });
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() ?? '';
      if (!transcript) return;
      setInputValue('');
      void submitText(transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const panelClass = `${styles.panel} ${styles[`pos-${position}`]} ${visible ? styles.visible : ''}`;
  const providerInfo = AI_PROVIDERS.find(item => item.id === state.config.active_ai_provider);
  const vision = resolveVisionProvider(state.config);
  const visionProviderInfo = getProviderInfo(vision.provider);
  const isBuddyOn = state.config.monitor_desktop && !state.config.private_mode;
  const statusText = state.config.private_mode
    ? 'Private mode'
    : isBuddyOn
      ? 'Watching screen'
      : 'Paused';

  return (
    <div className={panelClass}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={`${styles.statusDot} ${isBuddyOn ? '' : styles.statusDotOff}`} />
          <span>Buddy</span>
        </div>
        <div className={styles.headerRight}>
          <span className={state.isAnalyzing ? styles.analyzing : ''}>
            {state.isAnalyzing ? 'analyzing...' : statusText}
          </span>
        </div>
      </div>

      <div className={styles.messages}>
        <div className={styles.statusCard}>
          <div>
            <span className={styles.statusLabel}>Mode</span>
            <strong>{statusText}</strong>
          </div>
          <div>
            <span className={styles.statusLabel}>Selected API</span>
            <strong>{providerInfo?.name ?? state.config.active_ai_provider}</strong>
          </div>
          <div>
            <span className={styles.statusLabel}>Screen AI</span>
            <strong>
              {visionProviderInfo?.name ?? vision.provider}
              {vision.usedFallback ? ' fallback' : ''}
            </strong>
          </div>
          <div>
            <span className={styles.statusLabel}>Voice</span>
            <strong>{state.config.voice_enabled ? 'Speaking on' : 'Silent'}</strong>
          </div>
          {state.lastAnalysis && (
            <div className={styles.lastSeen}>
              <span className={styles.statusLabel}>Last seen</span>
              <p>{state.lastAnalysis.context || 'Screen analyzed.'}</p>
            </div>
          )}
        </div>

        {state.messages.length === 0 && (
          <div className={styles.empty}>
            <p>Click the eye to analyze the screen now.</p>
            <p className={styles.hint}>Drag Buddy or the move handle to reposition him. Use chat for questions, the mic for dictation, and settings for the rest.</p>
          </div>
        )}
        {[...state.messages].reverse().map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        <button
          className={`${styles.micBtn} ${isListening ? styles.micBtnActive : ''}`}
          onClick={handleMicClick}
          title={canDictate() ? (isListening ? 'Stop dictation' : 'Dictate to Buddy') : 'Dictation status'}
          aria-label={isListening ? 'Stop dictation' : 'Dictate to Buddy'}
        >
          {isListening ? '●' : '🎙'}
        </button>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          placeholder="Ask Buddy..."
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
        />
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={!inputValue.trim() || isSending}
        >
          {isSending ? '⋯' : '↑'}
        </button>
      </div>

      {!getActiveApiKey(state.config) && !vision.apiKey && (
        <div className={styles.apiKeyBanner}>
          <span>Set a Gemini, Claude, or OpenAI key in settings to enable screen help.</span>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.assistantBubble}`}>
      <div className={styles.bubbleText}>{message.content}</div>
      <div className={styles.bubbleTime}>
        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}
