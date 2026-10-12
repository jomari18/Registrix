export type StoredDraft<T> = {
  value: T;
  baseline: T;
  baseVersion: number | null;
};
export function restoreDraft<T>(
  stored: string | null,
  initial: T,
  version: number | null,
): StoredDraft<T> {
  try {
    const draft = JSON.parse(stored ?? "null");
    if (
      draft &&
      "value" in draft &&
      "baseline" in draft &&
      (draft.baseVersion === null || Number.isInteger(draft.baseVersion))
    )
      return draft;
  } catch {
    /* Discard malformed or unversioned storage rather than overwrite newer data. */
  }
  return { value: initial, baseline: initial, baseVersion: version };
}
