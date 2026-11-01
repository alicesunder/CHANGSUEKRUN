import React, { useEffect } from 'react';

/**
 * Site-wide playful motion, all done with plain DOM + CSS (see "Playful layer" in index.css):
 *  - scroll reveal for section headings and anything marked data-reveal / data-reveal-stagger
 *  - paw prints that follow the mouse (desktop only)
 *  - a little burst of hearts / paws / bones on every tap or click
 * Nothing runs for people who ask for reduced motion.
 */
const REVEAL_SELECTOR = 'main section h2, main [data-reveal], main [data-reveal-stagger] > *';
const BOOPS = ['🐾', '💛', '💜', '🦴', '✨', '🐾', '💖'];

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function useScrollReveal() {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) return;
    const main = document.querySelector('main');
    if (!main) return;

    const pending = new Set<HTMLElement>();
    const show = (el: HTMLElement) => {
      if (!pending.delete(el)) return;
      el.classList.remove('rv-init');
      el.classList.add('rv-in');
      // Drop the slow springy transition once it has played, so hover effects stay snappy.
      const delay = parseInt(el.style.getPropertyValue('--rv-delay') || '0', 10) || 0;
      window.setTimeout(() => el.classList.remove('rv-in'), 1100 + delay);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          // Also reveal anything already scrolled past (deep links, fast scrolling).
          if (e.isIntersecting || e.boundingClientRect.top < 0) {
            io.unobserve(e.target);
            show(e.target as HTMLElement);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );

    const scan = () => {
      main.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((el) => {
        if (el.dataset.rv) return;
        el.dataset.rv = '1';
        // Elements inside open dialogs or the sticky cart shouldn't wait for a scroll.
        if (el.closest('[role="dialog"], .no-reveal')) return;
        const parent = el.parentElement;
        if (parent?.hasAttribute('data-reveal-stagger')) {
          const i = Array.prototype.indexOf.call(parent.children, el);
          el.style.setProperty('--rv-delay', `${Math.min(i, 10) * 80}ms`);
          if (!el.dataset.reveal) el.dataset.reveal = parent.getAttribute('data-reveal-stagger') || '';
        }
        el.classList.add('rv-init');
        pending.add(el);
        io.observe(el);
      });
    };

    // Safety net: if the observer is throttled (background tab, old browser), a plain position
    // check still reveals whatever is on screen, so nothing can stay invisible.
    const check = () => {
      const limit = window.innerHeight * 0.96;
      pending.forEach((el) => {
        if (el.getBoundingClientRect().top < limit) {
          io.unobserve(el);
          show(el);
        }
      });
    };

    scan();
    // Lazy sections mount later; pick their headings up as they arrive.
    let queued = 0;
    const mo = new MutationObserver(() => {
      if (queued) return;
      queued = window.setTimeout(() => {
        queued = 0;
        scan();
      }, 60);
    });
    mo.observe(main, { childList: true, subtree: true });
    let scrollT = 0;
    const onScroll = () => {
      if (!scrollT) scrollT = window.setTimeout(() => ((scrollT = 0), check()), 120);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    const tick = window.setInterval(check, 1500);
    return () => {
      // Un-hide anything still waiting, so a remount (React dev double-run, HMR) starts clean.
      pending.forEach((el) => {
        el.classList.remove('rv-init');
        delete el.dataset.rv;
      });
      pending.clear();
      io.disconnect();
      mo.disconnect();
      window.clearTimeout(queued);
      window.clearTimeout(scrollT);
      window.clearInterval(tick);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);
}

function usePawTrailAndBoops() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const layer = document.createElement('div');
    layer.className = 'paw-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);

    const add = (node: HTMLElement) => {
      layer.appendChild(node);
      node.addEventListener('animationend', () => node.remove(), { once: true });
      // Hard cap so a frantic mouse never piles up nodes
      while (layer.childElementCount > 40) layer.firstElementChild?.remove();
    };

    // Paw prints: one step every ~60px of mouse travel, alternating left and right foot.
    let lastX = -1;
    let lastY = -1;
    let foot = 1;
    const fine = window.matchMedia('(pointer: fine)').matches;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      if (lastX < 0) {
        lastX = e.clientX;
        lastY = e.clientY;
        return;
      }
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (dx * dx + dy * dy < 60 * 60) return;
      const angle = Math.atan2(dy, dx);
      foot = -foot;
      const ox = Math.cos(angle + Math.PI / 2) * 7 * foot;
      const oy = Math.sin(angle + Math.PI / 2) * 7 * foot;
      const step = document.createElement('span');
      step.className = foot > 0 ? 'paw-step' : 'paw-step gold';
      step.style.left = `${e.clientX + ox}px`;
      step.style.top = `${e.clientY + oy}px`;
      step.style.rotate = `${(angle * 180) / Math.PI + 90}deg`;
      add(step);
      lastX = e.clientX;
      lastY = e.clientY;
    };

    // Boop burst on tap / click (skipped while typing in form fields).
    const onDown = (e: PointerEvent) => {
      const t = e.target instanceof Element ? e.target : null;
      if (t?.closest('input, textarea, select, [contenteditable="true"], .leaflet-container')) return;
      const n = 6;
      for (let i = 0; i < n; i++) {
        const b = document.createElement('span');
        b.className = 'boop';
        b.textContent = BOOPS[(i + Math.floor(Math.random() * BOOPS.length)) % BOOPS.length];
        const a = (Math.PI * 2 * i) / n + Math.random() * 0.6;
        const dist = 34 + Math.random() * 26;
        b.style.left = `${e.clientX}px`;
        b.style.top = `${e.clientY}px`;
        b.style.setProperty('--dx', `${Math.cos(a) * dist}px`);
        b.style.setProperty('--dy', `${Math.sin(a) * dist - 14}px`);
        b.style.setProperty('--rot', `${Math.round(Math.random() * 80 - 40)}deg`);
        b.style.fontSize = `${14 + Math.random() * 8}px`;
        add(b);
      }
    };

    if (fine) window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      layer.remove();
    };
  }, []);
}

export const PlayfulFX: React.FC = () => {
  useScrollReveal();
  usePawTrailAndBoops();
  return null;
};
