import { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  AvatarId, AvatarState, Message, FloatingCard,
  AppConfig, ClaudeResponse, Annotation, DEFAULT_CONFIG,
} from '../types';

interface AppState {
  avatar: AvatarId;
  avatarState: AvatarState;
  isPanelVisible: boolean;
  messages: Message[];
  floatingCards: FloatingCard[];
  config: AppConfig;
  isAnalyzing: boolean;
  lastAnalysis: ClaudeResponse | null;
  currentAnnotation: Annotation | null;
  isLoading: boolean;
  error: string | null;
}

type Action =
  | { type: 'SET_AVATAR'; payload: AvatarId }
  | { type: 'SET_AVATAR_STATE'; payload: AvatarState }
  | { type: 'TOGGLE_PANEL' }
  | { type: 'SET_PANEL_VISIBLE'; payload: boolean }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_FLOATING_CARD'; payload: FloatingCard }
  | { type: 'REMOVE_FLOATING_CARD'; payload: string }
  | { type: 'CLEAR_FLOATING_CARDS' }
  | { type: 'SET_CONFIG'; payload: AppConfig }
  | { type: 'UPDATE_CONFIG'; payload: Partial<AppConfig> }
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'SET_ANALYSIS'; payload: ClaudeResponse }
  | { type: 'SET_ANNOTATION'; payload: Annotation | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: AppState = {
  avatar: 'einstein',
  avatarState: 'idle',
  isPanelVisible: false,
  messages: [],
  floatingCards: [],
  config: DEFAULT_CONFIG,
  isAnalyzing: false,
  lastAnalysis: null,
  currentAnnotation: null,
  isLoading: false,
  error: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_AVATAR':
      return { ...state, avatar: action.payload };
    case 'SET_AVATAR_STATE':
      return { ...state, avatarState: action.payload };
    case 'TOGGLE_PANEL':
      return { ...state, isPanelVisible: !state.isPanelVisible };
    case 'SET_PANEL_VISIBLE':
      return { ...state, isPanelVisible: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [action.payload, ...state.messages] };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'ADD_FLOATING_CARD':
      return {
        ...state,
        floatingCards: [action.payload, ...state.floatingCards].slice(0, 4),
      };
    case 'REMOVE_FLOATING_CARD':
      return {
        ...state,
        floatingCards: state.floatingCards.filter(c => c.id !== action.payload),
      };
    case 'CLEAR_FLOATING_CARDS':
      return { ...state, floatingCards: [] };
    case 'SET_CONFIG':
      return { ...state, config: action.payload, avatar: action.payload.avatar };
    case 'UPDATE_CONFIG': {
      const updated = { ...state.config, ...action.payload };
      return { ...state, config: updated, avatar: updated.avatar };
    }
    case 'SET_ANALYZING':
      return { ...state, isAnalyzing: action.payload, avatarState: action.payload ? 'thinking' : state.avatarState };
    case 'SET_ANALYSIS':
      return {
        ...state,
        lastAnalysis: action.payload,
        isAnalyzing: false,
        avatarState: (action.payload.avatar_state as AvatarState) ?? 'idle',
        currentAnnotation: action.payload.annotation.type !== 'none'
          ? action.payload.annotation
          : null,
      };
    case 'SET_ANNOTATION':
      return { ...state, currentAnnotation: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
}
