import { useEffect } from 'react';
import { FloatingCard as FloatingCardType } from '../../types';
import { useAppStore } from '../../store/appStore';
import styles from './FloatingCard.module.css';

export function FloatingCards({ cards }: { cards: FloatingCardType[] }) {
  if (cards.length === 0) return null;
  return (
    <div className={styles.stack}>
      {cards.map((card, i) => (
        <FloatingCard key={card.id} card={card} index={i} />
      ))}
    </div>
  );
}

function FloatingCard({ card, index }: { card: FloatingCardType; index: number }) {
  const { dispatch } = useAppStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: 'REMOVE_FLOATING_CARD', payload: card.id });
    }, 6000);
    return () => clearTimeout(timer);
  }, [card.id, dispatch]);

  return (
    <div
      className={`${styles.card} ${styles[`type-${card.type}`]}`}
      style={{ '--index': index } as React.CSSProperties}
    >
      <div className={styles.icon}>
        {card.type === 'error' ? '⚠️' : card.type === 'suggestion' ? '💡' : 'ℹ️'}
      </div>
      <div className={styles.content}>{card.content}</div>
      <button
        className={styles.dismiss}
        onClick={() => dispatch({ type: 'REMOVE_FLOATING_CARD', payload: card.id })}
      >
        ×
      </button>
    </div>
  );
}
