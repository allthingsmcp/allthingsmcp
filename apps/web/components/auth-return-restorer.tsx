'use client';

import { useEffect } from 'react';
import { authScrollRestoreKey, parseAuthReturnState } from '@/lib/auth-return';

export function AuthReturnRestorer() {
  useEffect(() => {
    const state = parseAuthReturnState(
      sessionStorage.getItem(authScrollRestoreKey),
    );
    if (!state) {
      sessionStorage.removeItem(authScrollRestoreKey);
      return;
    }

    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (currentPath !== state.path) return;

    const restore = () => {
      const previousBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo({ top: state.scrollY, left: 0 });
      document.documentElement.style.scrollBehavior = previousBehavior;
    };

    const frame = requestAnimationFrame(restore);
    const settled = window.setTimeout(() => {
      restore();
      sessionStorage.removeItem(authScrollRestoreKey);
    }, 300);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settled);
    };
  }, []);

  return null;
}
