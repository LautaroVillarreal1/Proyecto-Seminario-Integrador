import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { useApp } from '../context/AppContext';

export default function ProductNameButton({ productId, children, className = '', style }: { productId: string; children: ReactNode; className?: string; style?: CSSProperties }) {
  const { openProductDetails } = useApp();

  const open = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    openProductDetails(productId);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    open(event);
  };

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={handleKeyDown}
      className={`cursor-pointer hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${className}`}
      style={style}>
      {children}
    </span>
  );
}