/**
 * Browser side of first-party analytics. Sends small beacons to the
 * collector. Nothing is sent until the tracker enables it, and never for
 * admin pages, Global Privacy Control, Do Not Track, or an ignored browser.
 */
export type AnalyticsProps = Record<string, string | number | boolean>;

const endpoint = '/api/e';
export const ignoreStorageKey = 'atm-analytics-ignore';

let enabled = false;
let referrerSent = false;

export function enableFirstPartyAnalytics() {
  enabled = true;
}

export const ignoreChangeEvent = 'atm-analytics-ignore-change';

/** '1' = not counted, '0' = counted by choice, null = no choice yet. */
export function ignorePreference(): '1' | '0' | null {
  try {
    const value = window.localStorage.getItem(ignoreStorageKey);
    return value === '1' || value === '0' ? value : null;
  } catch {
    return null;
  }
}

export function isBrowserIgnored() {
  return ignorePreference() === '1';
}

export function setBrowserIgnored(ignored: boolean) {
  try {
    window.localStorage.setItem(ignoreStorageKey, ignored ? '1' : '0');
  } catch {
    // Storage can be unavailable (private mode); nothing else to do.
  }
  window.dispatchEvent(new Event(ignoreChangeEvent));
}

function optedOut() {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return Boolean(nav.globalPrivacyControl) || nav.doNotTrack === '1';
}

export function sendAnalytics(name: string, props?: AnalyticsProps) {
  if (!enabled || typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/admin')) return;
  if (optedOut() || isBrowserIgnored()) return;

  const payload: {
    n: string;
    u: string;
    w: number;
    r?: string;
    p?: AnalyticsProps;
  } = { n: name, u: window.location.href, w: window.innerWidth };
  if (name === 'pageview' && !referrerSent) {
    referrerSent = true;
    if (document.referrer) payload.r = document.referrer;
  }
  if (props && Object.keys(props).length) payload.p = props;

  const body = JSON.stringify(payload);
  try {
    const blob = new Blob([body], { type: 'application/json' });
    if (navigator.sendBeacon?.(endpoint, blob)) return;
  } catch {
    // Fall back to fetch below.
  }
  void fetch(endpoint, {
    method: 'POST',
    body,
    keepalive: true,
    headers: { 'content-type': 'application/json' },
  }).catch(() => undefined);
}
