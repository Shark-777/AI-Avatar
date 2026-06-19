export interface SavedWindowPosition {
  x: number;
  y: number;
}

const BUDDY_WINDOW_POSITION_KEY = 'buddy:avatar-window-position';
const AVATAR_WINDOW_WIDTH = 480;
const AVATAR_WINDOW_HEIGHT = 392;

function clampPosition(position: SavedWindowPosition): SavedWindowPosition {
  const screenW = typeof window !== 'undefined' ? window.screen.availWidth || window.screen.width : AVATAR_WINDOW_WIDTH;
  const screenH = typeof window !== 'undefined' ? window.screen.availHeight || window.screen.height : AVATAR_WINDOW_HEIGHT;
  return {
    x: Math.round(Math.min(Math.max(0, position.x), Math.max(0, screenW - AVATAR_WINDOW_WIDTH))),
    y: Math.round(Math.min(Math.max(0, position.y), Math.max(0, screenH - AVATAR_WINDOW_HEIGHT))),
  };
}

export function loadBuddyWindowPosition(): SavedWindowPosition | null {
  try {
    const raw = window.localStorage.getItem(BUDDY_WINDOW_POSITION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedWindowPosition>;
    if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number') return null;
    return clampPosition({ x: parsed.x, y: parsed.y });
  } catch {
    return null;
  }
}

export function saveBuddyWindowPosition(position: SavedWindowPosition) {
  try {
    window.localStorage.setItem(BUDDY_WINDOW_POSITION_KEY, JSON.stringify(clampPosition(position)));
  } catch {
    /* ignore localStorage failures */
  }
}
