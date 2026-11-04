import React from 'react';
import { formatBaht } from '../data/eventData';

/** A price; while early bird is on and it is lower than the list price, the list price is struck through in front of it. */
export const EarlyBirdPrice: React.FC<{ list: number; now: number; className?: string }> = ({ list, now, className = '' }) =>
  now < list ? (
    <span className={className}>
      <s className="mr-1.5 text-[0.7em] font-bold opacity-60 decoration-2 decoration-rose-500">{formatBaht(list)}</s>
      <span className="text-rose-600">{formatBaht(now)}</span>
    </span>
  ) : (
    <span className={className}>{formatBaht(now)}</span>
  );
