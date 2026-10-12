import { it, expect } from "vitest";
import { MutationFlow } from "../../src/domain/mutations";
const store = () => {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
  };
};
it("keeps immutable request through ambiguous response and refresh, then recovers one save", async () => {
  const storage = store();
  let last: any;
  const flow = new MutationFlow("a", "save_student", "new", storage);
  const original = { name: "Alex" };
  await flow.submit(original, null, async (request) => {
    last = request;
    throw Object.assign(Error("Lost response"), { code: "NETWORK" });
  });
  original.name = "Other";
  expect(flow.state.phase).toBe("unknown");
  expect(last.payload.name).toBe("Alex");
  await expect(
    flow.submit({ name: "Changed" }, null, async () => ({})),
  ).rejects.toThrow();
  const restored = new MutationFlow("a", "save_student", "new", storage);
  expect(restored.state.phase).toBe("unknown");
  await restored.retry(async (request) => {
    expect(request.actionId).toBe(last.actionId);
    expect(request.payload.name).toBe("Alex");
    return { id: "record-1" };
  });
  expect(restored.state.phase).toBe("saved");
  expect(
    new MutationFlow("a", "save_student", "new", storage).state.phase,
  ).toBe("idle");
});
it("does not recover an action belonging to another account", async () => {
  const storage = store(),
    flow = new MutationFlow("a", "save_student", "new", storage);
  await flow.submit({ name: "Alex" }, 1, async () => {
    throw Object.assign(Error("Offline"), { code: "NETWORK" });
  });
  expect(
    new MutationFlow("b", "save_student", "new", storage).state.phase,
  ).toBe("idle");
});
it("releases known validation/conflict outcomes without losing the caller draft", async () => {
  const storage = store(),
    flow = new MutationFlow("a", "save_student", "new", storage);
  await flow.submit({ name: "Draft" }, 1, async () => {
    throw Object.assign(Error("Reload first"), { code: "VERSION_CONFLICT" });
  });
  expect(flow.state.phase).toBe("error");
  expect(flow.state.message).toBe("Reload first");
  await flow.submit({ name: "Draft" }, 2, async () => ({ id: "saved" }));
  expect(flow.state.phase).toBe("saved");
});
