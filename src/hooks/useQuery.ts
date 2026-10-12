import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../features/auth/AuthProvider";
import { errorMessage } from "../lib/api";
export function useQuery<T>(
  key: unknown,
  load: () => Promise<T>,
  enabled = true,
) {
  const { user, access, accessRevision } = useAuth(),
    identity = JSON.stringify([
      user?.id,
      access?.role,
      accessRevision,
      key,
      enabled,
    ]),
    [nonce, setNonce] = useState(0),
    [state, setState] = useState<{
      data: T | null;
      loading: boolean;
      error: string;
    }>({ data: null, loading: true, error: "" }),
    loader = useRef(load),
    previous = useRef("");
  loader.current = load;
  useEffect(() => {
    let current = true;
    if (!enabled) {
      setState({ data: null, loading: false, error: "" });
      return;
    }
    const same = previous.current === identity;
    previous.current = identity;
    setState((prev) => ({
      data: same ? prev.data : null,
      loading: true,
      error: "",
    }));
    loader
      .current()
      .then((data) => {
        if (current) setState({ data, loading: false, error: "" });
      })
      .catch((e) => {
        if (current)
          setState({ data: null, loading: false, error: errorMessage(e) });
      });
    return () => {
      current = false;
    };
  }, [identity, nonce]);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, refresh };
}
