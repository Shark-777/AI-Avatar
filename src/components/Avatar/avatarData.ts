import { AvatarId } from '../../types';

export interface AvatarInfo {
  id: AvatarId;
  name: string;
  description: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  hairColor: string;
  skinColor: string;
  riveFile?: string; // path to .riv asset (optional, falls back to SVG)
}

export const AVATARS: Record<AvatarId, AvatarInfo> = {
  einstein: {
    id: 'einstein',
    name: 'Einstein',
    description: 'Albert Einstein',
    tagline: 'Imagination is more important than knowledge',
    primaryColor: '#5b4a3f',
    accentColor: '#c8a96e',
    hairColor: '#e8e8e8',
    skinColor: '#f5c5a3',
  },
  tesla: {
    id: 'tesla',
    name: 'Tesla',
    description: 'Nikola Tesla',
    tagline: 'The present is theirs; the future is mine',
    primaryColor: '#1a2744',
    accentColor: '#4fc3f7',
    hairColor: '#1a1a1a',
    skinColor: '#f0d0b8',
  },
  mendeleev: {
    id: 'mendeleev',
    name: 'Mendeleev',
    description: 'Dmitri Mendeleev',
    tagline: 'There is no science that does not arise from needs',
    primaryColor: '#2d4a1e',
    accentColor: '#81c784',
    hairColor: '#888888',
    skinColor: '#f0c8a0',
  },
  musk: {
    id: 'musk',
    name: 'Elon',
    description: 'Elon Musk',
    tagline: 'Failure is an option here. If things are not failing...',
    primaryColor: '#1a1a2e',
    accentColor: '#e94560',
    hairColor: '#3d2b1f',
    skinColor: '#f5d5b8',
  },
};

export const AVATAR_LIST = Object.values(AVATARS);
