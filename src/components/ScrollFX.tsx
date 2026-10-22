import React, { useEffect, useRef } from 'react';

/** Scroll progress bar with a running dog at the top of the viewport. */
export const ScrollFX: React.FC = () => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const pct = h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0;
      if (barRef.current) barRef.current.style.width = `${pct}%`;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div ref={barRef} className="scroll-dog" aria-hidden="true" style={{ width: 0 }}>
      <span>🐕</span>
    </div>
  );
};
