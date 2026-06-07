import { useEffect, useRef, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { Annotation } from '../../types';
import styles from './AnnotationCanvas.module.css';

interface Props {
  annotation?: Annotation | null;
}

export function AnnotationCanvas({ annotation: propAnnotation }: Props) {
  const [annotation, setAnnotation] = useState<Annotation | null>(propAnnotation ?? null);
  const canvasRef = useRef<SVGSVGElement>(null);

  // Listen for Tauri events from the Rust overlay commands
  useEffect(() => {
    const unlistenUpdate = listen<Annotation>('annotation-update', event => {
      setAnnotation(event.payload);
    });
    const unlistenClear = listen('annotation-clear', () => {
      setAnnotation(null);
    });

    return () => {
      unlistenUpdate.then(fn => fn());
      unlistenClear.then(fn => fn());
    };
  }, []);

  // Also react to prop changes (for storybook / testing)
  useEffect(() => {
    if (propAnnotation !== undefined) setAnnotation(propAnnotation);
  }, [propAnnotation]);

  if (!annotation || annotation.type === 'none') {
    return <div className={styles.container} />;
  }

  return (
    <div className={styles.container}>
      <svg
        ref={canvasRef}
        className={styles.svg}
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', pointerEvents: 'none' }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#ff6b35" />
          </marker>
        </defs>
        <AnnotationShape annotation={annotation} />
      </svg>
    </div>
  );
}

function AnnotationShape({ annotation }: { annotation: Annotation }) {
  const { type, x, y, w, h, label } = annotation;
  const color = '#ff6b35';
  const strokeWidth = 3;

  switch (type) {
    case 'circle': {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const rx = w / 2;
      const ry = h / 2;
      return (
        <g className={styles.annotationGroup} filter="url(#glow)">
          <ellipse
            cx={cx} cy={cy} rx={rx} ry={ry}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray="8 4"
          />
          <ellipse
            cx={cx} cy={cy} rx={rx} ry={ry}
            fill="rgba(255, 107, 53, 0.08)"
          />
          {label && <AnnotationLabel x={cx} y={cy - ry - 12} text={label} />}
        </g>
      );
    }

    case 'rectangle':
      return (
        <g className={styles.annotationGroup} filter="url(#glow)">
          <rect
            x={x} y={y} width={w} height={h}
            fill="rgba(255, 107, 53, 0.08)"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray="8 4"
            rx={6}
          />
          {label && <AnnotationLabel x={x + w / 2} y={y - 12} text={label} />}
        </g>
      );

    case 'arrow': {
      // Draw an arrow from center-left to the target point
      const startX = Math.max(0, x - 80);
      const startY = y + h / 2;
      const endX = x;
      const endY = y + h / 2;
      return (
        <g className={styles.annotationGroup} filter="url(#glow)">
          <line
            x1={startX} y1={startY} x2={endX} y2={endY}
            stroke={color} strokeWidth={strokeWidth}
            markerEnd="url(#arrowhead)"
          />
          {label && <AnnotationLabel x={startX} y={startY - 14} text={label} />}
        </g>
      );
    }

    default:
      return null;
  }
}

function AnnotationLabel({ x, y, text }: { x: number; y: number; text: string }) {
  const padding = 6;
  const estimatedWidth = text.length * 7 + padding * 2;
  return (
    <g>
      <rect
        x={x - estimatedWidth / 2}
        y={y - 18}
        width={estimatedWidth}
        height={22}
        rx={5}
        fill="rgba(255, 107, 53, 0.85)"
      />
      <text
        x={x}
        y={y - 3}
        textAnchor="middle"
        fill="white"
        fontSize="12"
        fontFamily="-apple-system, sans-serif"
        fontWeight="600"
      >
        {text}
      </text>
    </g>
  );
}
