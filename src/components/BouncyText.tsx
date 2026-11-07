import React, { useMemo } from 'react';

/**
 * Text that drops in letter by letter and hops when hovered. Splits by grapheme so Thai
 * vowels and tone marks stay on their letter ("วิ่ง" never becomes "วิ" + "่ง" floating apart).
 * `gradient` paints one gradient across the whole word (each letter shows its own slice of it),
 * because a gradient clipped to the parent's text doesn't follow letters that move.
 */
export const BouncyText: React.FC<{ text: string; className?: string; delayMs?: number; stepMs?: number; gradient?: string }> = ({
  text,
  className = '',
  delayMs = 0,
  stepMs = 55,
  gradient,
}) => {
  const parts = useMemo(() => {
    const Seg = (Intl as unknown as { Segmenter?: new (l: string, o: { granularity: string }) => { segment: (s: string) => Iterable<{ segment: string }> } }).Segmenter;
    if (!Seg) return Array.from(text);
    return Array.from(new Seg('th', { granularity: 'grapheme' }).segment(text), (s) => s.segment);
  }, [text]);
  const n = parts.length;

  // Letters are grouped per word (each word never breaks), so a long English line wraps between
  // words instead of in the middle of "four-legged".
  const words: { ch: string; i: number }[][] = [[]];
  parts.forEach((ch, i) => {
    if (ch === ' ') words.push([]);
    else words[words.length - 1].push({ ch, i });
  });

  const letter = ({ ch, i }: { ch: string; i: number }) => (
    <span
      key={i}
      aria-hidden="true"
      className="bouncy-char"
      style={{
        ['--d' as string]: `${delayMs + i * stepMs}ms`,
        ['--i' as string]: i,
        ...(gradient
          ? {
              backgroundImage: gradient,
              backgroundSize: `${n * 100}% 100%`,
              backgroundPosition: `${n > 1 ? (i / (n - 1)) * 100 : 0}% 0`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }
          : {}),
      }}
    >
      {ch}
    </span>
  );

  return (
    <span className={`bouncy-text ${className}`} aria-label={text} role="text">
      {words.map((w, wi) => (
        <React.Fragment key={wi}>
          {wi > 0 && ' '}
          <span className="inline-block whitespace-nowrap">{w.map(letter)}</span>
        </React.Fragment>
      ))}
    </span>
  );
};
