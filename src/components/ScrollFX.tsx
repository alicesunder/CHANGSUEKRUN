import React, { useEffect, useRef } from 'react';

/** Scroll progress bar with a running dog at the top of the viewport. */
export const ScrollFX: React.FC = () => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // One update per frame, and a transform instead of width so scrolling never triggers layout.
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const pct = h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0;
      if (barRef.current) barRef.current.style.transform = `translateX(${pct - 100}%)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={barRef} className="scroll-dog" aria-hidden="true" style={{ width: '100%', transform: 'translateX(-100%)' }}>
      <span>🐕</span>
    </div>
  );
};
