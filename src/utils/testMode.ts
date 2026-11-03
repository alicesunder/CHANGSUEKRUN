import { useSyncExternalStore } from 'react';

/**
 * Admin test mode: while it is on in THIS browser, every order made here is priced at 1 baht, so the
 * slip check can be tried with a real 1-baht transfer. It lives in sessionStorage (gone when the tab
 * closes) and only counts while an admin is logged in; the server prices 1 baht only for a valid admin
 * token, so no visitor can get it by editing the page.
 */
const KEY = 'changsuek_test_mode';
const EVENT = 'changsuek:test-mode';
export const TEST_PRICE_BAHT = 1;

const adminTokenKey = 'changsuek_admin_token_v2';

function adminLoggedIn(): boolean {
  try {
    const raw = sessionStorage.getItem(adminTokenKey);
    if (!raw) return false;
    const { token, expiresAt } = JSON.parse(raw);
    return Boolean(token) && Date.now() <= expiresAt;
  } catch {
    return false;
  }
}

export function isTestModeOn(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1' && adminLoggedIn();
  } catch {
    return false;
  }
}

export function setTestMode(on: boolean): void {
  try {
    if (on) sessionStorage.setItem(KEY, '1');
    else sessionStorage.removeItem(KEY);
  } catch {
    // storage unavailable: the mode simply stays off
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  // the admin session can run out while the page stays open
  const t = window.setInterval(cb, 15_000);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', cb);
    window.clearInterval(t);
  };
}

/** True while the 1-baht test mode is on (re-renders when it changes). */
export function useTestMode(): boolean {
  return useSyncExternalStore(subscribe, isTestModeOn, () => false);
}
