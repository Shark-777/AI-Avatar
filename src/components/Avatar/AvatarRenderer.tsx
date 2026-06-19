import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { AvatarId, AvatarState } from '../../types';
import { AVATARS } from './avatarData';
import dentistSpritesheet from '../../assets/pets/dentist/spritesheet.webp';
import { saveBuddyWindowPosition } from '../../utils/windowPosition';
import { useNativeWindowDrag } from '../../hooks/useNativeWindowDrag';
import styles from './AvatarRenderer.module.css';

interface Props {
  avatarId: AvatarId;
  state: AvatarState;
  size?: number;
}

type AtlasRowId =
  | 'idle'
  | 'running-right'
  | 'running-left'
  | 'waving'
  | 'jumping'
  | 'failed'
  | 'waiting'
  | 'running'
  | 'review';

interface AtlasRow {
  index: number;
  id: AtlasRowId;
  frames: number;
  fps: number;
}

const ATLAS_COLS = 8;
const ATLAS_ROWS = 9;
const CELL_WIDTH = 192;
const CELL_HEIGHT = 208;

const ATLAS_ROWS_DEF: AtlasRow[] = [
  { index: 0, id: 'idle', frames: 6, fps: 6 },
  { index: 1, id: 'running-right', frames: 8, fps: 8 },
  { index: 2, id: 'running-left', frames: 8, fps: 8 },
  { index: 3, id: 'waving', frames: 4, fps: 6 },
  { index: 4, id: 'jumping', frames: 5, fps: 7 },
  { index: 5, id: 'failed', frames: 8, fps: 7 },
  { index: 6, id: 'waiting', frames: 6, fps: 6 },
  { index: 7, id: 'running', frames: 6, fps: 8 },
  { index: 8, id: 'review', frames: 6, fps: 6 },
];

function rowForState(state: AvatarState): AtlasRowId {
  switch (state) {
    case 'thinking':
      return 'review';
    case 'speaking':
      return 'waving';
    case 'alert':
      return 'failed';
    case 'peek':
      return 'jumping';
    case 'idle':
    default:
      return 'idle';
  }
}

function AtlasSprite({ rowId, size, animate }: { rowId: AtlasRowId; size: number; animate: boolean }) {
  const def =
    ATLAS_ROWS_DEF.find(row => row.id === rowId) ??
    ATLAS_ROWS_DEF.find(row => row.id === 'idle') ??
    ATLAS_ROWS_DEF[0];
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    setFrame(0);
    if (!animate || def.frames <= 1) return;

    const intervalMs = Math.max(16, Math.round(1000 / def.fps));
    const id = window.setInterval(() => {
      setFrame(current => (current + 1) % def.frames);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [animate, def.id, def.frames, def.fps]);

  const xPct = ATLAS_COLS > 1 ? (frame / (ATLAS_COLS - 1)) * 100 : 0;
  const yPct = ATLAS_ROWS > 1 ? (def.index / (ATLAS_ROWS - 1)) * 100 : 0;
  const spriteHeight = Math.round(size * (CELL_HEIGHT / CELL_WIDTH));

  return (
    <span
      className={styles.sprite}
      aria-hidden
      style={{
        width: size,
        height: spriteHeight,
        backgroundImage: `url(${dentistSpritesheet})`,
        backgroundSize: `${ATLAS_COLS * 100}% ${ATLAS_ROWS * 100}%`,
        backgroundPosition: `${xPct}% ${yPct}%`,
      }}
    />
  );
}

function ThoughtBubble({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className={styles.thoughtBubble}>
      <span>...</span>
    </div>
  );
}

export function AvatarRenderer({ avatarId, state, size = 150 }: Props) {
  const info = AVATARS[avatarId];
  const shouldAnimate = state !== 'idle';
  const dragHandlers = useNativeWindowDrag();

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    let saveTimer: number | null = null;

    try {
      void getCurrentWindow().onMoved(event => {
        if (saveTimer !== null) {
          window.clearTimeout(saveTimer);
        }
        saveTimer = window.setTimeout(() => {
          const scale = window.devicePixelRatio || 1;
          const avatarOffsetX = Math.max(0, window.innerWidth - 480);
          const avatarOffsetY = Math.max(0, window.innerHeight - 392);
          saveBuddyWindowPosition({
            x: Math.round(event.payload.x / scale + avatarOffsetX),
            y: Math.round(event.payload.y / scale + avatarOffsetY),
          });
        }, 180);
      }).then(fn => {
        unlisten = fn;
      }).catch(() => {
        /* Not running inside Tauri, e.g. browser smoke tests. */
      });
    } catch {
      /* ignore */
    }

    return () => {
      if (saveTimer !== null) {
        window.clearTimeout(saveTimer);
      }
      try {
        unlisten?.();
      } catch {
        /* Already unregistered. */
      }
    };
  }, []);

  return (
    <div
      className={`${styles.avatarContainer} ${styles[`state-${state}`]}`}
      style={{
        '--accent': info.accentColor,
        '--primary': info.primaryColor,
      } as React.CSSProperties}
      {...dragHandlers}
    >
      <AtlasSprite rowId={rowForState(state)} size={size} animate={shouldAnimate} />
      <ThoughtBubble visible={state === 'thinking'} />
      {state === 'alert' && <div className={styles.alertBadge}>!</div>}
      <span className={styles.shadow} aria-hidden />
    </div>
  );
}
