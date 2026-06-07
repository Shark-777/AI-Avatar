import { useEffect, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { AvatarId, AvatarState } from '../../types';
import { AVATARS } from './avatarData';
import styles from './AvatarRenderer.module.css';

interface Props {
  avatarId: AvatarId;
  state: AvatarState;
  size?: number;
  onClick?: () => void;
  onLongPress?: () => void;
}

function EinsteinFace() {
  return (
    <svg viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      {/* Body */}
      <rect x="38" y="100" width="44" height="30" rx="8" fill="#6b4c3b" />
      <rect x="52" y="100" width="16" height="30" fill="#f5f0e8" />
      <polygon points="60,104 56,128 60,126 64,128" fill="#c0392b" />
      {/* Wild white hair - big fluffy */}
      <ellipse cx="60" cy="42" rx="38" ry="32" fill="#e8e8e8" />
      <ellipse cx="28" cy="52" rx="10" ry="18" fill="#e0e0e0" />
      <ellipse cx="92" cy="52" rx="10" ry="18" fill="#e0e0e0" />
      <ellipse cx="35" cy="30" rx="12" ry="10" fill="#ddd" />
      <ellipse cx="85" cy="30" rx="12" ry="10" fill="#ddd" />
      {/* Head - big chibi round */}
      <ellipse cx="60" cy="72" rx="32" ry="33" fill="#fce4c8" />
      {/* Ears */}
      <ellipse cx="28" cy="72" rx="5" ry="7" fill="#f5c9a0" />
      <ellipse cx="92" cy="72" rx="5" ry="7" fill="#f5c9a0" />
      {/* Glasses */}
      <circle cx="46" cy="68" r="9" fill="rgba(180,210,255,0.25)" stroke="#8a7560" strokeWidth="2" />
      <circle cx="74" cy="68" r="9" fill="rgba(180,210,255,0.25)" stroke="#8a7560" strokeWidth="2" />
      <line x1="55" y1="68" x2="65" y2="68" stroke="#8a7560" strokeWidth="2" />
      <line x1="20" y1="66" x2="37" y2="67" stroke="#8a7560" strokeWidth="2" />
      <line x1="83" y1="67" x2="100" y2="66" stroke="#8a7560" strokeWidth="2" />
      {/* Big chibi eyes */}
      <ellipse cx="46" cy="68" rx="6.5" ry="7" fill="white" />
      <ellipse cx="74" cy="68" rx="6.5" ry="7" fill="white" />
      <ellipse cx="46" cy="69" rx="4" ry="4.5" fill="#4a3520" />
      <ellipse cx="74" cy="69" rx="4" ry="4.5" fill="#4a3520" />
      <circle cx="44" cy="67" r="1.5" fill="white" />
      <circle cx="72" cy="67" r="1.5" fill="white" />
      {/* Eyebrows */}
      <path d="M37 59 Q46 55 55 59" stroke="#bbb" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M65 59 Q74 55 83 59" stroke="#bbb" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Nose */}
      <ellipse cx="60" cy="78" rx="3" ry="2" fill="#f0b090" />
      {/* Big white mustache */}
      <path d="M43 87 Q52 82 60 85 Q68 82 77 87 Q68 92 60 90 Q52 92 43 87Z" fill="#e0e0e0" />
      {/* Smile under mustache */}
      <path d="M50 93 Q60 99 70 93" stroke="#d4896a" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* E=mc² badge */}
      <rect x="82" y="4" width="34" height="16" rx="4" fill="#c8a96e" opacity="0.9" />
      <text x="99" y="15" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="serif">E=mc²</text>
    </svg>
  );
}

function TeslaFace() {
  return (
    <svg viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      {/* Body - dark formal */}
      <rect x="38" y="100" width="44" height="30" rx="8" fill="#0d1b2a" />
      <rect x="52" y="100" width="16" height="30" fill="#f8f8f8" />
      <polygon points="60,104 56,128 60,126 64,128" fill="#1a4a8a" />
      {/* Dark slicked hair */}
      <ellipse cx="60" cy="40" rx="32" ry="24" fill="#111" />
      <path d="M30 50 Q28 38 32 28" fill="#0a0a0a" />
      <path d="M90 50 Q92 38 88 28" fill="#0a0a0a" />
      {/* Head */}
      <ellipse cx="60" cy="72" rx="30" ry="33" fill="#f0d5b8" />
      {/* Ears */}
      <ellipse cx="30" cy="72" rx="5" ry="7" fill="#e5c0a0" />
      <ellipse cx="90" cy="72" rx="5" ry="7" fill="#e5c0a0" />
      {/* Big intense eyes */}
      <ellipse cx="46" cy="68" rx="7.5" ry="8" fill="white" />
      <ellipse cx="74" cy="68" rx="7.5" ry="8" fill="white" />
      <ellipse cx="46" cy="69" rx="5" ry="5.5" fill="#1a3a7a" />
      <ellipse cx="74" cy="69" rx="5" ry="5.5" fill="#1a3a7a" />
      <circle cx="44" cy="66" r="2" fill="white" />
      <circle cx="72" cy="66" r="2" fill="white" />
      {/* Sharp eyebrows */}
      <path d="M37 58 Q46 53 55 58" stroke="#111" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M65 58 Q74 53 83 58" stroke="#111" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Defined nose */}
      <path d="M56 76 Q60 82 64 76" stroke="#c8a070" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Thin mustache */}
      <path d="M47 87 Q60 84 73 87" stroke="#111" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Serious mouth */}
      <path d="M50 93 Q60 95 70 93" stroke="#c07050" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Lightning bolts - animated feel */}
      <path d="M96 6 L91 20 L97 20 L90 38 L95 38 L88 54 L95 28 L89 28 L95 6Z" fill="#4fc3f7" opacity="0.95" />
      <path d="M16 16 L13 26 L17 26 L12 38 L16 38 L11 50 L17 30 L13 30 L17 16Z" fill="#4fc3f7" opacity="0.6" />
    </svg>
  );
}

function MendeleevFace() {
  return (
    <svg viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      {/* Academic robe */}
      <rect x="34" y="100" width="52" height="30" rx="8" fill="#2d4a1e" />
      <rect x="52" y="100" width="16" height="30" fill="#f8f4e8" />
      {/* Long flowing gray hair sides */}
      <ellipse cx="22" cy="65" rx="12" ry="28" fill="#888" />
      <ellipse cx="98" cy="65" rx="12" ry="28" fill="#888" />
      {/* Top of hair */}
      <ellipse cx="60" cy="38" rx="34" ry="22" fill="#999" />
      {/* Head */}
      <ellipse cx="60" cy="72" rx="30" ry="33" fill="#f0c8a0" />
      {/* Ears */}
      <ellipse cx="30" cy="72" rx="5" ry="7" fill="#e8b888" />
      <ellipse cx="90" cy="72" rx="5" ry="7" fill="#e8b888" />
      {/* Round glasses */}
      <circle cx="46" cy="67" r="9.5" fill="rgba(160,200,180,0.2)" stroke="#4a4a4a" strokeWidth="2.5" />
      <circle cx="74" cy="67" r="9.5" fill="rgba(160,200,180,0.2)" stroke="#4a4a4a" strokeWidth="2.5" />
      <line x1="55.5" y1="67" x2="64.5" y2="67" stroke="#4a4a4a" strokeWidth="2.5" />
      <line x1="18" y1="65" x2="36.5" y2="66" stroke="#4a4a4a" strokeWidth="2.5" />
      <line x1="83.5" y1="66" x2="102" y2="65" stroke="#4a4a4a" strokeWidth="2.5" />
      {/* Eyes */}
      <ellipse cx="46" cy="67" rx="6" ry="6.5" fill="white" />
      <ellipse cx="74" cy="67" rx="6" ry="6.5" fill="white" />
      <ellipse cx="46" cy="68" rx="3.5" ry="4" fill="#3d2a10" />
      <ellipse cx="74" cy="68" rx="3.5" ry="4" fill="#3d2a10" />
      <circle cx="44.5" cy="66" r="1.2" fill="white" />
      <circle cx="72.5" cy="66" r="1.2" fill="white" />
      {/* Bushy eyebrows */}
      <path d="M36 57 Q46 52 56 57" stroke="#777" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M64 57 Q74 52 84 57" stroke="#777" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {/* Nose */}
      <ellipse cx="60" cy="77" rx="3.5" ry="2.5" fill="#d8a878" />
      {/* Big flowing beard */}
      <path d="M35 85 Q28 98 32 115 Q45 124 60 124 Q75 124 88 115 Q92 98 85 85 Q75 90 60 90 Q45 90 35 85Z" fill="#888" />
      <path d="M42 88 Q40 102 42 116" stroke="#777" strokeWidth="1.5" fill="none" />
      <path d="M60 90 Q60 106 60 120" stroke="#777" strokeWidth="1.5" fill="none" />
      <path d="M78 88 Q80 102 78 116" stroke="#777" strokeWidth="1.5" fill="none" />
      {/* Periodic table badge */}
      <rect x="4" y="4" width="28" height="28" rx="4" fill="#2d4a1e" stroke="#81c784" strokeWidth="2" />
      <text x="18" y="19" textAnchor="middle" fill="#81c784" fontSize="12" fontWeight="bold" fontFamily="monospace">Md</text>
      <text x="18" y="27" textAnchor="middle" fill="#81c784" fontSize="7" fontFamily="monospace">101</text>
    </svg>
  );
}

function MuskFace() {
  return (
    <svg viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      {/* Body - modern tech CEO */}
      <rect x="38" y="100" width="44" height="30" rx="8" fill="#0a0a1a" />
      <rect x="50" y="100" width="20" height="30" fill="#111" />
      {/* Short neat dark hair */}
      <ellipse cx="60" cy="42" rx="30" ry="20" fill="#1e1008" />
      <path d="M32 52 Q30 40 34 30" fill="#160a04" />
      <path d="M88 52 Q90 40 86 30" fill="#160a04" />
      {/* Head - strong jaw, modern */}
      <path d="M30 60 Q28 78 32 92 Q44 104 60 104 Q76 104 88 92 Q92 78 90 60 Q84 42 60 40 Q36 42 30 60Z" fill="#f5d5b5" />
      {/* Ears */}
      <ellipse cx="29" cy="72" rx="5" ry="7" fill="#e8c0a0" />
      <ellipse cx="91" cy="72" rx="5" ry="7" fill="#e8c0a0" />
      {/* Confident direct eyes */}
      <ellipse cx="46" cy="66" rx="7.5" ry="7.5" fill="white" />
      <ellipse cx="74" cy="66" rx="7.5" ry="7.5" fill="white" />
      <ellipse cx="46" cy="67" rx="4.5" ry="5" fill="#2d1a0a" />
      <ellipse cx="74" cy="67" rx="4.5" ry="5" fill="#2d1a0a" />
      <circle cx="44" cy="64" r="2" fill="white" />
      <circle cx="72" cy="64" r="2" fill="white" />
      {/* Clean eyebrows */}
      <path d="M37 56 Q46 52 55 56" stroke="#1e1008" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M65 56 Q74 52 83 56" stroke="#1e1008" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Nose */}
      <path d="M56 74 Q60 80 64 74" stroke="#c8986a" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Confident smirk */}
      <path d="M49 88 Q58 93 70 88" stroke="#b07050" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Rocket badge */}
      <g transform="translate(2, 2)">
        <ellipse cx="14" cy="20" rx="7" ry="13" fill="#e94560" />
        <path d="M8 30 Q10 36 14 34 Q18 36 20 30 L14 27Z" fill="#ff6b35" />
        <ellipse cx="14" cy="10" rx="4" ry="7" fill="#ff8080" />
        <rect x="10" y="28" width="8" height="8" fill="#c73050" />
        <circle cx="14" cy="20" r="3" fill="#ff4080" opacity="0.6" />
      </g>
      {/* X logo subtle */}
      <text x="100" y="20" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="sans-serif" opacity="0.8">𝕏</text>
    </svg>
  );
}

const FACE_COMPONENTS: Record<AvatarId, () => JSX.Element> = {
  einstein: EinsteinFace,
  tesla: TeslaFace,
  mendeleev: MendeleevFace,
  musk: MuskFace,
};

function ThoughtBubble({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className={styles.thoughtBubble}>
      <span>💭</span>
    </div>
  );
}

export function AvatarRenderer({ avatarId, state, size = 190, onClick, onLongPress }: Props) {
  const info = AVATARS[avatarId];
  const FaceComponent = FACE_COMPONENTS[avatarId];
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const didDrag = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    didDrag.current = false;
    mouseDownPos.current = { x: e.clientX, y: e.clientY };

    // Long press timer for picker
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        if (!didDrag.current) onLongPress();
      }, 700);
    }
  };

  const handleMouseMove = async (e: React.MouseEvent) => {
    if (!mouseDownPos.current) return;
    const dx = Math.abs(e.clientX - mouseDownPos.current.x);
    const dy = Math.abs(e.clientY - mouseDownPos.current.y);
    if ((dx > 4 || dy > 4) && !didDrag.current) {
      didDrag.current = true;
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      // Drag the whole window
      try {
        await getCurrentWindow().startDragging();
      } catch (_) {}
      mouseDownPos.current = null;
    }
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    mouseDownPos.current = null;
  };

  const handleClick = () => {
    if (!didDrag.current && onClick) onClick();
  };

  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  return (
    <div
      className={`${styles.avatarContainer} ${styles[`state-${state}`]}`}
      style={{
        width: size,
        height: size,
        '--accent': info.accentColor,
        '--primary': info.primaryColor,
      } as React.CSSProperties}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      title={`${info.name}`}
    >
      <div className={styles.avatarInner}>
        <FaceComponent />
      </div>
      <ThoughtBubble visible={state === 'thinking'} />
      {state === 'alert' && (
        <div className={styles.alertBadge}>!</div>
      )}
      {state === 'speaking' && (
        <div className={styles.speakBadge}>💬</div>
      )}
    </div>
  );
}
