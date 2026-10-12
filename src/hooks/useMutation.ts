import { useEffect, useMemo, useState } from "react";
import { MutationFlow } from "../domain/mutations";
import { rpc } from "../lib/api";
import { useAuth } from "../features/auth/AuthProvider";
export function useMutation<T = any, R = any>(
  operation: string,
  scope: string,
) {
  const { user } = useAuth(),
    flow = useMemo(
      () => new MutationFlow<T, R>(user!.id, operation, scope, sessionStorage),
      [user?.id, operation, scope],
    ),
    [, render] = useState(0);
  useEffect(() => {
    flow.onChange = () => render((n) => n + 1);
    return () => {
      flow.onChange = () => {};
    };
  }, [flow]);
  const send = (request: unknown) => rpc<R>(operation, request);
  return {
    state: flow.state,
    locked: ["pending", "unknown"].includes(flow.state.phase),
    submit: (payload: T, version: number | null) =>
      flow.submit(payload, version, send),
    retry: () => flow.retry(send),
    recover: () =>
      flow.recover((actionId) => rpc<R>("find_my_action", { actionId })),
  };
}
