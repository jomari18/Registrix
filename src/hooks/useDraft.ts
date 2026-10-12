import { useState } from "react";
import { useAuth } from "../features/auth/AuthProvider";
import { restoreDraft } from "../domain/drafts";
export function useDraft<T>(
  scope: string,
  initial: T,
  version: number | null = null,
) {
  const { user } = useAuth(),
    key = `registrix:draft:${user!.id}:${scope}`;
  const [state, setState] = useState(() =>
    restoreDraft(sessionStorage.getItem(key), initial, version),
  );
  return {
    value: state.value,
    baseline: state.baseline,
    baseVersion: state.baseVersion,
    stale: state.baseVersion !== version,
    set: (next: T) => {
      const updated = { ...state, value: next };
      setState(updated);
      try {
        sessionStorage.setItem(key, JSON.stringify(updated));
      } catch {
        /* The save flow independently requires recoverable tab storage. */
      }
    },
    clear: () => {
      sessionStorage.removeItem(key);
    },
    reset: () => {
      sessionStorage.removeItem(key);
      setState({ value: initial, baseline: initial, baseVersion: version });
    },
    commit: (value: T, baseVersion: number | null) => {
      sessionStorage.removeItem(key);
      setState({ value, baseline: value, baseVersion });
    },
  };
}
