/**
 * Keeps the page light: every section's CSS animations (sparkles, glows, shines…) are paused while the section is far
 * off screen, and only run when it is near the viewport. Sections that appear later (lazy ones) are picked up too.
 */
export function startFxPause(): void {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
  const seen = new WeakSet<Element>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) e.target.removeAttribute('data-fx-off');
        else e.target.setAttribute('data-fx-off', '');
      }
    },
    { rootMargin: '150px 0px 150px 0px' }
  );
  const scan = () => {
    document.querySelectorAll('section, footer, header').forEach((el) => {
      if (!seen.has(el)) {
        seen.add(el);
        el.setAttribute('data-fx-off', '');
        io.observe(el);
      }
    });
  };
  scan();
  window.setInterval(scan, 2500);
}
