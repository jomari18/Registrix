import { it, expect, vi } from "vitest";
import {
  RecoveryFlow,
  type RecoveryAuth,
  type MainAuth,
} from "../../src/features/auth/recovery";
function fixture() {
  const user = { id: "recovery-user", email: "person@example.test" };
  const auth = {
    resetPasswordForEmail: vi.fn(async () => ({ error: null })),
    verifyOtp: vi.fn(async () => ({
      data: { user, session: { user } },
      error: null,
    })),
    getUser: vi.fn(async () => ({ data: { user }, error: null })),
    updateUser: vi.fn(async () => ({ data: { user }, error: null })),
    signOut: vi.fn(async () => ({ error: null })),
  };
  const normal = {
    getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
    signOut: vi.fn(async () => ({ error: null })),
  };
  const clock = { now: 1000 };
  return {
    flow: new RecoveryFlow(
      auth as unknown as RecoveryAuth,
      normal as unknown as MainAuth,
      () => clock.now,
    ),
    auth,
    normal,
    clock,
    user,
  };
}
it("does not allow a normal session to bypass a recovery OTP", async () => {
  const { flow, auth } = fixture();
  await flow.save("NewPassword123!", "NewPassword123!");
  expect(auth.updateUser).not.toHaveBeenCalled();
  expect(flow.state.phase).toBe("email");
});
it("requests a non-enumerating recovery email and enforces resend cooldown", async () => {
  const { flow, auth } = fixture();
  await flow.send("Person@example.test");
  expect(flow.state.phase).toBe("code");
  expect(flow.state.notice).toMatch(/If this email has an account/);
  await flow.send("person@example.test");
  expect(auth.resetPasswordForEmail).toHaveBeenCalledTimes(1);
});
it("verifies recovery rather than signup tokens and rejects invalid/expired codes", async () => {
  const { flow, auth } = fixture();
  await flow.send("person@example.test");
  auth.verifyOtp.mockResolvedValueOnce({
    data: { user: null, session: null },
    error: { code: "otp_expired" },
  } as never);
  await flow.verify("123456");
  expect(auth.verifyOtp).toHaveBeenCalledWith({
    email: "person@example.test",
    token: "123456",
    type: "recovery",
  });
  expect(flow.state.phase).toBe("code");
  await flow.save("NewPassword123!", "NewPassword123!");
  expect(auth.updateUser).not.toHaveBeenCalled();
});
it("saves only after verified recovery and matching passwords then clears recovery session", async () => {
  const { flow, auth } = fixture();
  await flow.send("person@example.test");
  await flow.verify("12345678");
  await flow.save("NewPassword123!", "wrong");
  expect(auth.updateUser).not.toHaveBeenCalled();
  await flow.save("NewPassword123!", "NewPassword123!");
  expect(auth.updateUser).toHaveBeenCalledWith({ password: "NewPassword123!" });
  expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  expect(flow.state.phase).toBe("complete");
  expect(JSON.stringify(flow.state)).not.toContain("NewPassword");
});
it("invalidates authority if recovery identity changes", async () => {
  const { flow, auth } = fixture();
  await flow.send("person@example.test");
  await flow.verify("12345678");
  auth.getUser.mockResolvedValueOnce({
    data: { user: { id: "another", email: "other@example.test" } },
    error: null,
  });
  await flow.save("NewPassword123!", "NewPassword123!");
  expect(auth.updateUser).not.toHaveBeenCalled();
  expect(flow.state.phase).toBe("code");
});
it("preserves another account normal session and can retry cleanup without changing password twice", async () => {
  const { flow, auth, normal } = fixture();
  normal.getSession.mockResolvedValueOnce({
    data: { session: { user: { id: "different" } } },
    error: null,
  } as never);
  await flow.send("person@example.test");
  await flow.verify("12345678");
  auth.signOut.mockResolvedValueOnce({ error: { code: "network" } } as never);
  await flow.save("NewPassword123!", "NewPassword123!");
  expect(flow.state.phase).toBe("finishing");
  await flow.finish();
  expect(auth.updateUser).toHaveBeenCalledTimes(1);
  expect(normal.signOut).not.toHaveBeenCalled();
  expect(flow.state.phase).toBe("complete");
});
it("hides raw provider error details", async () => {
  const { flow, auth } = fixture();
  auth.resetPasswordForEmail.mockRejectedValueOnce(new Error("SMTP internal secret detail"));
  await flow.send("person@example.test");
  expect(flow.state.error).toMatch(/Check your connection/);
  expect(flow.state.error).not.toContain("SMTP");
});
it("clears the same account session even if the page closes during password update", async () => {
  const { flow, auth, normal, user } = fixture();
  normal.getSession.mockResolvedValue({ data: { session: { user } }, error: null } as never);
  await flow.send("person@example.test");
  await flow.verify("12345678");
  let complete!: () => void;
  auth.updateUser.mockImplementationOnce(() => new Promise(resolve => {
    complete = () => resolve({ data: { user }, error: null });
  }));
  const saving = flow.save("NewPassword123!", "NewPassword123!");
  await vi.waitFor(() => expect(auth.updateUser).toHaveBeenCalled());
  flow.detach();
  complete();
  await saving;
  expect(normal.signOut).toHaveBeenCalledWith({ scope: "local" });
});
