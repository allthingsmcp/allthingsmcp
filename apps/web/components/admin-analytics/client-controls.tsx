'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useAuthDialog } from '@/components/auth-dialog';
import {
  ignoreChangeEvent,
  ignorePreference,
  isBrowserIgnored,
  setBrowserIgnored,
} from '@/lib/analytics/client';

/** Shown to signed-out visitors: opens the existing GitHub sign-in dialog. */
export function AdminSignIn() {
  const { openAuth } = useAuthDialog();
  return (
    <main id="main-content" className="shell analytics-gate">
      <h1>Sign in</h1>
      <p>This page is only available to the site administrator.</p>
      <button
        type="button"
        className="button button--primary"
        onClick={() => openAuth('account')}
      >
        Sign in with GitHub
      </button>
    </main>
  );
}

function subscribe(onChange: () => void) {
  window.addEventListener(ignoreChangeEvent, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(ignoreChangeEvent, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/**
 * Excludes this browser from first-party analytics the first time the admin
 * opens the dashboard, and lets the admin change that choice.
 */
export function IgnoreThisBrowser() {
  const ignored = useSyncExternalStore(subscribe, isBrowserIgnored, () => null);

  useEffect(() => {
    if (ignorePreference() === null) setBrowserIgnored(true);
  }, []);

  if (ignored === null) return null;
  return (
    <p className="analytics-ignore">
      {ignored
        ? 'Your visits from this browser are not counted.'
        : 'Your visits from this browser are counted.'}{' '}
      <button
        type="button"
        className="button--text"
        onClick={() => setBrowserIgnored(!ignored)}
      >
        {ignored ? 'Count them' : 'Stop counting them'}
      </button>
    </p>
  );
}
