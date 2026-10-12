import type { MutationRequest } from "./contracts";
export type MutationState<R> = {
  phase: "idle" | "pending" | "unknown" | "error" | "saved";
  message: string;
  data: R | null;
};
type Storage = Pick<globalThis.Storage, "getItem" | "setItem" | "removeItem">;
export class MutationFlow<T = any, R = any> {
  state: MutationState<R> = { phase: "idle", message: "", data: null };
  request: MutationRequest<T> | null = null;
  private key: string;
  onChange: () => void = () => {};
  constructor(
    private owner: string,
    private operation: string,
    scope: string,
    private storage: Storage,
  ) {
    this.key = `registrix:action:${operation}:${scope}`;
    try {
      const saved = JSON.parse(storage.getItem(this.key) ?? "null");
      if (
        saved?.owner === owner &&
        saved.operation === operation &&
        typeof saved.request?.actionId === "string"
      ) {
        this.request = saved.request;
        this.state = {
          phase: "unknown",
          message:
            "A previous save still needs confirmation. Recover or retry the same request.",
          data: null,
        };
      } else if (saved) storage.removeItem(this.key);
    } catch {
      storage.removeItem(this.key);
    }
  }
  private publish(state: MutationState<R>) {
    this.state = state;
    this.onChange();
  }
  async submit(
    payload: T,
    expectedVersion: number | null,
    send: (request: MutationRequest<T>) => Promise<R>,
  ) {
    if (this.request)
      throw Error(
        "Confirm the unresolved request before editing or starting a new save.",
      );
    this.request = JSON.parse(
      JSON.stringify({
        actionId: crypto.randomUUID(),
        expectedVersion,
        payload,
      }),
    );
    try {
      this.storage.setItem(
        this.key,
        JSON.stringify({
          owner: this.owner,
          operation: this.operation,
          request: this.request,
        }),
      );
    } catch {
      this.request = null;
      this.publish({
        phase: "error",
        message:
          "Tab storage is unavailable. Enable browser storage before saving.",
        data: null,
      });
      return;
    }
    await this.run(send);
  }
  private async run(send: (request: MutationRequest<T>) => Promise<R>) {
    if (!this.request) return;
    this.publish({ phase: "pending", message: "Saving…", data: null });
    try {
      const result = await send(JSON.parse(JSON.stringify(this.request)));
      this.storage.removeItem(this.key);
      this.request = null;
      this.publish({
        phase: "saved",
        message: "Saved to the workspace.",
        data: result,
      });
    } catch (error) {
      const e = error as { code?: string; message?: string };
      if (e.code === "NETWORK" || !e.code) {
        this.publish({
          phase: "unknown",
          message:
            "The save result is unknown. Keep this draft and recover the result before making changes.",
          data: null,
        });
      } else {
        this.storage.removeItem(this.key);
        this.request = null;
        this.publish({
          phase: "error",
          message: e.message ?? "Review your draft and try again.",
          data: null,
        });
      }
    }
  }
  async retry(send: (request: MutationRequest<T>) => Promise<R>) {
    if (this.request && this.state.phase !== "pending") await this.run(send);
  }
  async recover(find: (actionId: string) => Promise<R>) {
    if (!this.request || this.state.phase === "pending") return;
    const actionId = this.request.actionId;
    this.publish({
      phase: "pending",
      message: "Checking the previous save…",
      data: null,
    });
    try {
      const data = await find(actionId);
      this.storage.removeItem(this.key);
      this.request = null;
      this.publish({
        phase: "saved",
        message: "Saved result recovered.",
        data,
      });
    } catch (error) {
      this.publish({
        phase: "unknown",
        message:
          (error as Error).message ||
          "Still unable to confirm. Retry the same request.",
        data: null,
      });
    }
  }
}
