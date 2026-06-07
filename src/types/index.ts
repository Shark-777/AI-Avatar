export type AvatarId = 'einstein' | 'tesla' | 'mendeleev' | 'musk';
export type AvatarState = 'idle' | 'thinking' | 'speaking' | 'alert' | 'peek';
export type PanelPosition = 'left' | 'right' | 'bottom';
export type AnnotationType = 'none' | 'circle' | 'arrow' | 'rectangle';
export type MessageRole = 'user' | 'assistant' | 'system';

export interface Annotation {
  type: AnnotationType;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

export interface ActionSuggestion {
  tool: string;
  target: string;
}

export interface ClaudeResponse {
  context: string;
  error_detected: boolean;
  recommendation: string;
  annotation: Annotation;
  action_suggestion: ActionSuggestion;
  avatar_state: AvatarState;
  confidence: number;
}

export interface Message {
  id: number;
  role: MessageRole;
  content: string;
  avatar_state: AvatarState;
  created_at: string;
}

export interface FloatingCard {
  id: string;
  content: string;
  type: 'suggestion' | 'error' | 'info';
  timestamp: number;
}

export interface AppConfig {
  avatar: AvatarId;
  panel_position: PanelPosition;
  api_key: string;
  monitor_desktop: boolean;
  monitor_browser: boolean;
  auto_suggest: boolean;
  private_mode: boolean;
  voice_enabled: boolean;
  capture_interval_secs: number;
}

export const DEFAULT_CONFIG: AppConfig = {
  avatar: 'einstein',
  panel_position: 'right',
  api_key: '',
  monitor_desktop: true,
  monitor_browser: true,
  auto_suggest: true,
  private_mode: false,
  voice_enabled: false,
  capture_interval_secs: 30,
};
