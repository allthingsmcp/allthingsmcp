export function guideProgressMatches(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

export function normalizeGuideProgress(ids: string[], stepIds: string[]) {
  const completed = new Set(ids);
  return stepIds.filter((id) => completed.has(id));
}

export function reconcileGuideProgress(
  latest: string[],
  base: string[],
  desired: string[],
  stepIds: string[],
) {
  const latestSet = new Set(latest);
  const baseSet = new Set(base);
  const desiredSet = new Set(desired);

  for (const id of baseSet) {
    if (!desiredSet.has(id)) latestSet.delete(id);
  }
  for (const id of desiredSet) {
    if (!baseSet.has(id)) latestSet.add(id);
  }

  return stepIds.filter((id) => latestSet.has(id));
}
