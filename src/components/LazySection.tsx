import React, { Suspense, useEffect, useRef, useState } from 'react';

/**
 * Renders a placeholder (keeping the section's id so menu links still work) and
 * loads the real section when it comes within `margin` of the viewport.
 */
export const LazySection: React.FC<{
  id: string;
  minHeight: number;
  margin?: string;
  children: React.ReactNode;
}> = ({ id, minHeight, margin = '800px 0px', children }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (show) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: margin }
    );
    io.observe(el);
    // Deep links (e.g. /#schedule-and-map) should load immediately
    if (window.location.hash === `#${id}`) setShow(true);
    return () => io.disconnect();
  }, [show, id, margin]);

  const placeholder = <div id={id} ref={ref} style={{ minHeight }} aria-busy="true" />;
  if (!show) return placeholder;
  return <Suspense fallback={<div id={id} style={{ minHeight }} aria-busy="true" />}>{children}</Suspense>;
};
