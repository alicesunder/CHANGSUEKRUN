import { useEffect, useState } from 'react';
import { getPublicConfig } from './api';

/** True while the admin's early-bird switch is on (read from the public config, once per page load). */
export function useEarlyBird(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let alive = true;
    getPublicConfig()
      .then((c) => {
        if (alive) setOn(c.earlyBird === true);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return on;
}
