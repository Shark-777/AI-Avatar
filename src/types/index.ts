export type AvatarId = 'einstein' | 'tesla' | 'mendeleev' | 'musk';
export type AvatarState = 'idle' | 'thinking' | 'speaking' | 'alert' | 'peek';
export type PanelPosition = 'left' | 'right' | 'bottom';
export type AnnotationType = 'none' | 'circle' | 'arrow' | 'rectangle';
export type MessageRole = 'user' | 'assistant' | 'system';
export type AiProviderId =
  | 'anthropic'
  | 'openai'
  | 'gemini'
  | 'xai'
  | 'deepseek'
  | 'groq'
  | 'mistral'
  | 'openrouter'
  | 'perplexity'
  | 'together';

export interface AiProviderInfo {
  id: AiProviderId;
  name: string;
  keyPlaceholder: string;
  visionEnabled: boolean;
}

export const AI_PROVIDERS: AiProviderInfo[] = [
  { id: 'anthropic', name: 'Claude / Anthropic', keyPlaceholder: 'sk-ant-...', visionEnabled: true },
  { id: 'openai', name: 'OpenAI / Codex', keyPlaceholder: 'sk-...', visionEnabled: true },
  { id: 'gemini', name: 'Google Gemini 3 Flash', keyPlaceholder: 'AIza...', visionEnabled: true },
  { id: 'xai', name: 'Grok / xAI', keyPlaceholder: 'xai-...', visionEnabled: false },
  { id: 'deepseek', name: 'DeepSeek', keyPlaceholder: 'sk-...', visionEnabled: false },
  { id: 'groq', name: 'Groq', keyPlaceholder: 'gsk_...', visionEnabled: false },
  { id: 'mistral', name: 'Mistral', keyPlaceholder: '...', visionEnabled: false },
  { id: 'openrouter', name: 'OpenRouter', keyPlaceholder: 'sk-or-...', visionEnabled: false },
  { id: 'perplexity', name: 'Perplexity', keyPlaceholder: 'pplx-...', visionEnabled: false },
  { id: 'together', name: 'Together AI', keyPlaceholder: '...', visionEnabled: false },
];

export const DEFAULT_API_KEYS: Record<AiProviderId, string> = {
  anthropic: '',
  openai: '',
  gemini: '',
  xai: '',
  deepseek: '',
  groq: '',
  mistral: '',
  openrouter: '',
  perplexity: '',
  together: '',
};

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
  active_ai_provider: AiProviderId;
  api_keys: Record<AiProviderId, string>;
  /** Legacy Anthropic key kept for config.toml migration compatibility. */
  api_key: string;
  pet_enabled: boolean;
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
  active_ai_provider: 'gemini',
  api_keys: DEFAULT_API_KEYS,
  api_key: '',
  pet_enabled: true,
  monitor_desktop: true,
  monitor_browser: true,
  auto_suggest: true,
  private_mode: false,
  voice_enabled: false,
  capture_interval_secs: 30,
};
