import React, { useEffect, useState } from 'react';

export const CustomCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [cursorType, setCursorType] = useState<'default' | 'button' | 'route'>('default');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only enable on desktop devices with fine pointer
    if (typeof window === 'undefined' || !window.matchMedia('(pointer: fine)').matches) {
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isClickable = target.closest('button, a, input, [role="button"], .interactive-card');
      const isRoute = target.closest('.route-hoverable, .map-container');

      if (isRoute) {
        setIsHovered(true);
        setCursorType('route');
      } else if (isClickable) {
        setIsHovered(true);
        setCursorType('button');
      } else {
        setIsHovered(false);
        setCursorType('default');
      }
    };

    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Outer trailing ring */}
      <div
        className={`fixed top-0 left-0 pointer-events-none z-[9998] transition-transform duration-100 ease-out will-change-transform hidden md:block ${
          isHovered
            ? 'scale-150 bg-[#FFC928]/25 border-2 border-[#7B3FC6]'
            : 'scale-100 bg-[#7B3FC6]/15 border border-[#7B3FC6]/50'
        } rounded-full`}
        style={{
          width: '36px',
          height: '36px',
          transform: `translate3d(${position.x - 18}px, ${position.y - 18}px, 0)`,
        }}
      />
      {/* Center dot */}
      <div
        className="fixed top-0 left-0 pointer-events-none z-[9999] will-change-transform hidden md:flex items-center justify-center rounded-full bg-[#7B3FC6] shadow-sm transition-all duration-75"
        style={{
          width: isHovered ? '8px' : '6px',
          height: isHovered ? '8px' : '6px',
          transform: `translate3d(${position.x - (isHovered ? 4 : 3)}px, ${position.y - (isHovered ? 4 : 3)}px, 0)`,
        }}
      />
    </>
  );
};
