import { useEffect, useRef } from 'react';
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

// SVG face components per character
function EinsteinFace() {
  return (
    <svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      {/* Suit/body */}
      <ellipse cx="50" cy="102" rx="32" ry="16" fill="#4a3728" />
      <rect x="36" y="88" width="28" height="18" fill="#4a3728" />
      {/* White shirt + tie */}
      <rect x="44" y="88" width="12" height="18" fill="#f0f0f0" />
      <polygon points="50,92 47,105 50,103 53,105" fill="#8b2020" />
      {/* Neck */}
      <rect x="43" y="82" width="14" height="10" fill="#f5c5a3" />
      {/* Wild white hair */}
      <path d="M24 68 Q8 38 22 20 Q30 8 50 12 Q70 8 78 20 Q92 38 76 68" fill="#ddd" />
      <path d="M22 68 Q14 48 18 35 Q14 50 22 68" fill="#ccc" />
      <path d="M78 68 Q86 48 82 35 Q86 50 78 68" fill="#ccc" />
      <path d="M24 50 Q16 42 20 30" stroke="#bbb" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M76 50 Q84 42 80 30" stroke="#bbb" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Head */}
      <ellipse cx="50" cy="62" rx="27" ry="28" fill="#f5c5a3" />
      {/* Ears */}
      <ellipse cx="23" cy="62" rx="4" ry="6" fill="#f0b890" />
      <ellipse cx="77" cy="62" rx="4" ry="6" fill="#f0b890" />
      {/* Eyebrows (thick, slightly raised) */}
      <path d="M33 47 Q39 44 45 47" stroke="#aaa" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M55 47 Q61 44 67 47" stroke="#aaa" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Eyes */}
      <ellipse cx="39" cy="54" rx="5" ry="5.5" fill="white" />
      <ellipse cx="61" cy="54" rx="5" ry="5.5" fill="white" />
      <ellipse cx="39" cy="55" rx="3" ry="3" fill="#5c4033" />
      <ellipse cx="61" cy="55" rx="3" ry="3" fill="#5c4033" />
      <circle cx="38" cy="54" r="1" fill="black" />
      <circle cx="60" cy="54" r="1" fill="black" />
      {/* Glasses */}
      <circle cx="39" cy="54" r="6.5" fill="none" stroke="#888" strokeWidth="1.2" />
      <circle cx="61" cy="54" r="6.5" fill="none" stroke="#888" strokeWidth="1.2" />
      <line x1="45.5" y1="54" x2="54.5" y2="54" stroke="#888" strokeWidth="1.2" />
      <line x1="22" y1="52" x2="32.5" y2="53" stroke="#888" strokeWidth="1.2" />
      <line x1="67.5" y1="53" x2="78" y2="52" stroke="#888" strokeWidth="1.2" />
      {/* Nose */}
      <path d="M47 60 Q50 64 53 60" stroke="#e0a88a" strokeWidth="1.5" fill="none" />
      {/* Mustache */}
      <path d="M36 72 Q43 68 50 71 Q57 68 64 72 Q57 76 50 74 Q43 76 36 72Z" fill="#ccc" />
      {/* Smile */}
      <path d="M43 79 Q50 84 57 79" stroke="#c47a5a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Wrinkles */}
      <path d="M30 58 Q28 62 30 66" stroke="#e8a880" strokeWidth="1" fill="none" />
      <path d="M70 58 Q72 62 70 66" stroke="#e8a880" strokeWidth="1" fill="none" />
    </svg>
  );
}

function TeslaFace() {
  return (
    <svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      {/* Dark formal suit */}
      <ellipse cx="50" cy="102" rx="32" ry="16" fill="#0d1b2a" />
      <rect x="36" y="88" width="28" height="18" fill="#0d1b2a" />
      <rect x="44" y="88" width="12" height="18" fill="#f5f5f5" />
      <polygon points="50,90 47,106 50,104 53,106" fill="#1a3a5c" />
      {/* Neck */}
      <rect x="43" y="82" width="14" height="10" fill="#f0d0b8" />
      {/* Dark slicked hair */}
      <path d="M24 55 Q23 30 35 18 Q50 10 65 18 Q77 30 76 55" fill="#1a1a1a" />
      <path d="M24 55 Q20 40 25 28 Q30 18 24 55" fill="#111" />
      {/* Head (angular) */}
      <path d="M24 55 Q22 75 30 86 Q40 92 50 92 Q60 92 70 86 Q78 75 76 55 Q72 35 50 33 Q28 35 24 55Z" fill="#f0d0b8" />
      {/* Ears */}
      <ellipse cx="24" cy="68" rx="4" ry="5.5" fill="#ebb898" />
      <ellipse cx="76" cy="68" rx="4" ry="5.5" fill="#ebb898" />
      {/* Sharp eyebrows */}
      <path d="M31 52 Q38 48 44 52" stroke="#111" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M56 52 Q62 48 69 52" stroke="#111" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Intense eyes */}
      <ellipse cx="37" cy="59" rx="5.5" ry="5.5" fill="white" />
      <ellipse cx="63" cy="59" rx="5.5" ry="5.5" fill="white" />
      <ellipse cx="37" cy="59" rx="3" ry="3" fill="#2c4a8c" />
      <ellipse cx="63" cy="59" rx="3" ry="3" fill="#2c4a8c" />
      <circle cx="36" cy="58" r="1" fill="black" />
      <circle cx="62" cy="58" r="1" fill="black" />
      {/* Cheekbones */}
      <path d="M26 74 Q30 76 28 80" stroke="#e0b898" strokeWidth="1" fill="none" />
      <path d="M74 74 Q70 76 72 80" stroke="#e0b898" strokeWidth="1" fill="none" />
      {/* Nose (defined) */}
      <path d="M46 65 Q50 72 54 65" stroke="#d8a880" strokeWidth="1.5" fill="none" />
      {/* Thin mustache */}
      <path d="M40 76 Q50 74 60 76" stroke="#1a1a1a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Serious set mouth */}
      <path d="M42 81 Q50 82 58 81" stroke="#b87a5a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Lightning bolt accent */}
      <path d="M84 10 L80 22 L85 22 L79 36 L83 36 L77 48 L82 25 L77 25 L82 10Z" fill="#4fc3f7" opacity="0.9" />
    </svg>
  );
}

function MendeleevFace() {
  return (
    <svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      {/* Academic robe */}
      <ellipse cx="50" cy="102" rx="34" ry="16" fill="#2d3d1e" />
      <rect x="34" y="88" width="32" height="18" fill="#2d3d1e" />
      <rect x="43" y="88" width="14" height="18" fill="#f5f0e0" />
      {/* Neck */}
      <rect x="43" y="82" width="14" height="10" fill="#f0c8a0" />
      {/* Long gray hair */}
      <path d="M22 64 Q10 40 20 22 Q30 8 50 12 Q70 8 80 22 Q90 40 78 64" fill="#999" />
      <path d="M22 64 Q14 50 18 35 L22 64" fill="#888" />
      <path d="M78 64 Q86 50 82 35 L78 64" fill="#888" />
      {/* Head (round, older) */}
      <ellipse cx="50" cy="60" rx="27" ry="28" fill="#f0c8a0" />
      {/* Ears */}
      <ellipse cx="23" cy="62" rx="4" ry="5.5" fill="#e8b890" />
      <ellipse cx="77" cy="62" rx="4" ry="5.5" fill="#e8b890" />
      {/* Glasses */}
      <circle cx="38" cy="56" r="7" fill="none" stroke="#555" strokeWidth="1.5" />
      <circle cx="62" cy="56" r="7" fill="none" stroke="#555" strokeWidth="1.5" />
      <line x1="45" y1="56" x2="55" y2="56" stroke="#555" strokeWidth="1.5" />
      <line x1="20" y1="54" x2="31" y2="55" stroke="#555" strokeWidth="1.5" />
      <line x1="69" y1="55" x2="80" y2="54" stroke="#555" strokeWidth="1.5" />
      {/* Eyes behind glasses */}
      <ellipse cx="38" cy="56" rx="4" ry="4" fill="white" />
      <ellipse cx="62" cy="56" rx="4" ry="4" fill="white" />
      <ellipse cx="38" cy="57" rx="2.5" ry="2.5" fill="#4a3520" />
      <ellipse cx="62" cy="57" rx="2.5" ry="2.5" fill="#4a3520" />
      {/* Thick eyebrows */}
      <path d="M31 49 Q38 46 45 49" stroke="#777" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M55 49 Q62 46 69 49" stroke="#777" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Nose */}
      <path d="M46 62 Q50 67 54 62" stroke="#d8a880" strokeWidth="1.5" fill="none" />
      {/* Long beard */}
      <path d="M32 72 Q28 82 30 95 Q40 100 50 100 Q60 100 70 95 Q72 82 68 72 Q60 76 50 76 Q40 76 32 72Z" fill="#999" />
      <path d="M38 72 Q40 80 38 90" stroke="#888" strokeWidth="1" fill="none" />
      <path d="M50 76 Q50 86 50 96" stroke="#888" strokeWidth="1" fill="none" />
      <path d="M62 72 Q60 80 62 90" stroke="#888" strokeWidth="1" fill="none" />
      {/* Periodic table element accent */}
      <rect x="78" y="8" width="20" height="20" rx="3" fill="#2d4a1e" stroke="#81c784" strokeWidth="1.5" />
      <text x="88" y="21" textAnchor="middle" fill="#81c784" fontSize="10" fontWeight="bold" fontFamily="monospace">Md</text>
      <text x="88" y="28" textAnchor="middle" fill="#81c784" fontSize="5" fontFamily="monospace">101</text>
    </svg>
  );
}

function MuskFace() {
  return (
    <svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      {/* Modern jacket */}
      <ellipse cx="50" cy="102" rx="32" ry="16" fill="#111122" />
      <rect x="36" y="88" width="28" height="18" fill="#111122" />
      <rect x="43" y="88" width="14" height="18" fill="#222" />
      {/* Black tee */}
      <rect x="44" y="90" width="12" height="16" fill="#111" />
      {/* Neck */}
      <rect x="43" y="82" width="14" height="10" fill="#f5d5b8" />
      {/* Short dark hair */}
      <path d="M26 55 Q25 35 35 22 Q50 14 65 22 Q75 35 74 55" fill="#2a1a10" />
      <path d="M26 55 Q23 43 27 32 L26 55" fill="#1a0e08" />
      {/* Head (defined, modern) */}
      <path d="M26 55 Q24 72 28 84 Q38 92 50 92 Q62 92 72 84 Q76 72 74 55 Q70 36 50 34 Q30 36 26 55Z" fill="#f5d5b8" />
      {/* Ears */}
      <ellipse cx="25" cy="66" rx="4" ry="5.5" fill="#e8c0a0" />
      <ellipse cx="75" cy="66" rx="4" ry="5.5" fill="#e8c0a0" />
      {/* Clean eyebrows */}
      <path d="M31 50 Q38 47 44 50" stroke="#2a1a10" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M56 50 Q62 47 69 50" stroke="#2a1a10" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Direct eyes */}
      <ellipse cx="37" cy="57" rx="5.5" ry="5.5" fill="white" />
      <ellipse cx="63" cy="57" rx="5.5" ry="5.5" fill="white" />
      <ellipse cx="37" cy="57" rx="3" ry="3" fill="#3d2b18" />
      <ellipse cx="63" cy="57" rx="3" ry="3" fill="#3d2b18" />
      <circle cx="36" cy="56" r="1" fill="black" />
      <circle cx="62" cy="56" r="1" fill="black" />
      {/* Strong jaw */}
      <path d="M28 75 Q30 82 50 88 Q70 82 72 75" stroke="#e8c0a0" strokeWidth="0.5" fill="none" />
      {/* Nose */}
      <path d="M46 63 Q50 70 54 63" stroke="#d8a880" strokeWidth="1.5" fill="none" />
      {/* Confident slight smile */}
      <path d="M42 76 Q50 80 58 76" stroke="#b87a5a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Rocket accent */}
      <g transform="translate(76, 6)">
        <ellipse cx="10" cy="14" rx="5" ry="10" fill="#e94560" />
        <rect x="7" y="20" width="6" height="6" fill="#c73050" />
        <path d="M5 24 Q7 28 10 26 Q13 28 15 24 L10 22Z" fill="#ff6b35" />
        <ellipse cx="10" cy="8" rx="3" ry="5" fill="#ff8080" />
        <path d="M5 16 Q2 20 4 22 L7 20" fill="#b82040" />
        <path d="M15 16 Q18 20 16 22 L13 20" fill="#b82040" />
      </g>
    </svg>
  );
}

const FACE_COMPONENTS: Record<AvatarId, () => JSX.Element> = {
  einstein: EinsteinFace,
  tesla: TeslaFace,
  mendeleev: MendeleevFace,
  musk: MuskFace,
};

// Thought bubble for "thinking" state
function ThoughtBubble({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className={styles.thoughtBubble}>
      <span>...</span>
    </div>
  );
}

export function AvatarRenderer({ avatarId, state, size = 180, onClick, onLongPress }: Props) {
  const info = AVATARS[avatarId];
  const FaceComponent = FACE_COMPONENTS[avatarId];
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseDown = () => {
    if (!onLongPress) return;
    longPressTimer.current = setTimeout(() => onLongPress(), 600);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
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
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      title={`${info.name} — ${state}`}
    >
      <div className={styles.avatarInner}>
        <FaceComponent />
      </div>
      <ThoughtBubble visible={state === 'thinking'} />
      {state === 'alert' && (
        <div className={styles.alertBadge}>!</div>
      )}
    </div>
  );
}
