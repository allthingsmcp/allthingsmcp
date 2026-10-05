import { describe, expect, it } from 'vitest';
import { parseAuthReturnState, safeAuthReturnPath } from '@/lib/auth-return';

describe('authentication return state', () => {
  it('keeps a guide path, query, and fragment on the current origin', () => {
    expect(
      safeAuthReturnPath(
        '/guides/building-your-first-mcp-server/add-tools?view=code#result',
      ),
    ).toBe('/guides/building-your-first-mcp-server/add-tools?view=code#result');
  });

  it('rejects external and protocol-relative return locations', () => {
    expect(safeAuthReturnPath('https://example.com')).toBeNull();
    expect(safeAuthReturnPath('//example.com/guide')).toBeNull();
    expect(safeAuthReturnPath('/\\example.com/guide')).toBeNull();
  });

  it('accepts fresh scroll state and rejects expired state', () => {
    const now = 1_000_000;
    const state = JSON.stringify({
      path: '/guides/building-your-first-mcp-server/add-tools',
      scrollY: 840,
      createdAt: now - 1_000,
    });

    expect(parseAuthReturnState(state, now)).toEqual({
      path: '/guides/building-your-first-mcp-server/add-tools',
      scrollY: 840,
      createdAt: now - 1_000,
    });
    expect(parseAuthReturnState(state, now + 16 * 60 * 1_000)).toBeNull();
  });
});
