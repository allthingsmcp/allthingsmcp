import { describe, expect, it } from 'vitest';
import {
  normalizeGuideProgress,
  reconcileGuideProgress,
} from '@/lib/guide-progress';

const steps = ['one', 'two', 'three', 'four'];

describe('Guide progress reconciliation', () => {
  it('normalizes stored progress to canonical Guide order', () => {
    expect(normalizeGuideProgress(['three', 'missing', 'one'], steps)).toEqual([
      'one',
      'three',
    ]);
  });

  it('preserves remote additions while applying a local completion', () => {
    expect(
      reconcileGuideProgress(['one', 'two'], ['one'], ['one', 'three'], steps),
    ).toEqual(['one', 'two', 'three']);
  });

  it('preserves a local removal when another device changes the run', () => {
    expect(
      reconcileGuideProgress(
        ['one', 'two', 'three'],
        ['one', 'two'],
        ['one'],
        steps,
      ),
    ).toEqual(['one', 'three']);
  });

  it('supports resetting progress without deleting unrelated remote work', () => {
    expect(
      reconcileGuideProgress(['one', 'two', 'four'], ['one', 'two'], [], steps),
    ).toEqual(['four']);
  });
});
