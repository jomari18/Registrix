import { Button } from "./Button";
import { StatusNotice } from "./StatusNotice";
import type { MutationState } from "../domain/mutations";
export function MutationNotice({
  mutation,
}: {
  mutation: {
    state: MutationState<any>;
    recover: () => Promise<void>;
    retry: () => Promise<void>;
  };
}) {
  const state = mutation.state;
  if (state.phase === "idle") return null;
  return (
    <StatusNotice
      type={
        state.phase === "error"
          ? "error"
          : state.phase === "saved"
            ? "success"
            : state.phase === "unknown"
              ? "warning"
              : "info"
      }
    >
      <p>{state.message}</p>
      {state.phase === "unknown" && (
        <div className="actions" style={{ marginTop: 12 }}>
          <Button type="button" onClick={() => void mutation.recover()}>
            Recover saved result
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void mutation.retry()}
          >
            Retry same request
          </Button>
        </div>
      )}
    </StatusNotice>
  );
}
