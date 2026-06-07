import { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../../store/appStore';
import { Message } from '../../types';
import styles from './ChatPanel.module.css';

interface Props {
  visible: boolean;
  position: 'left' | 'right' | 'bottom';
}

export function ChatPanel({ visible, position }: Props) {
  const { state, dispatch } = useAppStore();
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [visible]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  async function handleSend() {
    const text = inputValue.trim();
    if (!text || isSending) return;

    const apiKey = state.config.api_key;
    if (!apiKey) {
      dispatch({
        type: 'ADD_FLOATING_CARD',
        payload: {
          id: crypto.randomUUID(),
          content: 'Please set your Anthropic API key in settings.',
          type: 'error',
          timestamp: Date.now(),
        },
      });
      return;
    }

    setInputValue('');
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
        userMessage: text,
      });

      dispatch({ type: 'SET_ANALYSIS', payload: response as any });

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

      // Show annotation overlay if needed
      if (response.annotation.type !== 'none') {
        await invoke('show_overlay');
        await invoke('update_annotation', { annotation: response.annotation });
        // Auto-clear annotation after 8 seconds
        setTimeout(() => {
          invoke('clear_annotation');
          invoke('hide_overlay');
        }, 8000);
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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const panelClass = `${styles.panel} ${styles[`pos-${position}`]} ${visible ? styles.visible : ''}`;

  return (
    <div className={panelClass}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.statusDot} />
          <span>Buddy</span>
        </div>
        <div className={styles.headerRight}>
          {state.isAnalyzing && (
            <span className={styles.analyzing}>analyzing...</span>
          )}
        </div>
      </div>

      <div className={styles.messages}>
        {state.messages.length === 0 && (
          <div className={styles.empty}>
            <p>Ask me anything about your screen.</p>
            <p className={styles.hint}>I can see what you're working on and help guide you.</p>
          </div>
        )}
        {[...state.messages].reverse().map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
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

      {!state.config.api_key && (
        <div className={styles.apiKeyBanner}>
          <span>⚠️ Set API key in settings to enable AI</span>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.assistantBubble}`}>
      {!isUser && (
        <div className={styles.stateIndicator} data-state={message.avatar_state} />
      )}
      <div className={styles.bubbleText}>{message.content}</div>
      <div className={styles.bubbleTime}>
        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}
