'use client';

import { useEffect } from 'react';
import {
  authScrollRestoreKey,
  parseAuthReturnState,
  pendingAuthReturnKey,
  safeAuthReturnPath,
} from '@/lib/auth-return';

export default function AuthReturnPage() {
  useEffect(() => {
    const pending = parseAuthReturnState(
      sessionStorage.getItem(pendingAuthReturnKey),
    );
    sessionStorage.removeItem(pendingAuthReturnKey);

    const params = new URLSearchParams(window.location.search);
    const fallback = safeAuthReturnPath(params.get('next')) ?? '/guides';
    const target = pending?.path ?? fallback;

    if (pending) {
      sessionStorage.setItem(authScrollRestoreKey, JSON.stringify(pending));
    }

    window.location.replace(target);
  }, []);

  return (
    <main id="main-content" className="shell">
      <p className="eyebrow">Signed in</p>
      <h1>Returning to your guide…</h1>
    </main>
  );
}
