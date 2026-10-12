import type { SupabaseClient } from "@supabase/supabase-js";
export type RecoveryAuth = Pick<
  SupabaseClient["auth"],
  "resetPasswordForEmail" | "verifyOtp" | "getUser" | "updateUser" | "signOut"
>;
export type MainAuth = Pick<SupabaseClient["auth"], "getSession" | "signOut">;
export type RecoveryState = {
  phase: "email" | "code" | "password" | "finishing" | "complete";
  email: string;
  busy: boolean;
  error: string;
  notice: string;
  deadline: number;
};
class RecoveryValidationError extends Error {}
function message(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === "otp_expired")
    return "This recovery code is invalid or expired. Use the latest email or request a new code.";
  if (code === "weak_password")
    return "Choose a stronger password with at least 8 characters.";
  if (code === "same_password")
    return "Choose a password different from your current password.";
  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit"
  )
    return "Too many attempts. Wait before trying again.";
  if (code === "unexpected_failure" || code === "email_address_not_authorized")
    return "Email delivery or account recovery setup needs attention. Please contact the administrator.";
  return "Could not complete this request. Check your connection and try again.";
}
export class RecoveryFlow {
  state: RecoveryState = {
    phase: "email",
    email: "",
    busy: false,
    error: "",
    notice: "",
    deadline: 0,
  };
  onChange = () => {};
  private userId: string | null = null;
  private epoch = 0;
  constructor(
    private auth: RecoveryAuth,
    private main: MainAuth,
    private now = () => Date.now(),
  ) {}
  private publish(values: Partial<RecoveryState>) {
    this.state = { ...this.state, ...values };
    this.onChange();
  }
  private async run(operation: (epoch: number) => Promise<void>) {
    if (this.state.busy) return;
    const epoch = this.epoch;
    this.publish({ busy: true, error: "" });
    try {
      await operation(epoch);
    } catch (error) {
      if (epoch === this.epoch)
        this.publish({
          error:
            error instanceof RecoveryValidationError
              ? error.message
              : message(error),
        });
    } finally {
      if (epoch === this.epoch) this.publish({ busy: false });
    }
  }
  async send(input: string) {
    await this.run(async (epoch) => {
      const email = input.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new RecoveryValidationError("Enter a valid email address.");
      if (this.now() < this.state.deadline)
        throw new RecoveryValidationError(
          "Wait for the resend cooldown before requesting another code.",
        );
      this.userId = null;
      const { error } = await this.auth.resetPasswordForEmail(email);
      if (error) throw error;
      if (epoch === this.epoch)
        this.publish({
          phase: "code",
          email,
          deadline: this.now() + 60000,
          notice:
            "If this email has an account, a password recovery code is on its way. Enter the code from the newest email.",
        });
    });
  }
  async verify(input: string) {
    await this.run(async (epoch) => {
      if (this.state.phase !== "code")
        throw new RecoveryValidationError("Request a recovery code first.");
      const token = input.trim();
      if (!/^\d{6,10}$/.test(token))
        throw new RecoveryValidationError(
          "Enter the complete numeric recovery code from your email.",
        );
      const { data, error } = await this.auth.verifyOtp({
        email: this.state.email,
        token,
        type: "recovery",
      });
      if (error) throw error;
      if (epoch !== this.epoch) {
        await this.auth.signOut({ scope: "local" });
        return;
      }
      if (
        !data.session ||
        !data.user ||
        data.user.email?.toLowerCase() !== this.state.email
      )
        throw new RecoveryValidationError("Recovery could not be verified. Request a fresh code.");
      this.userId = data.user.id;
      this.publish({
        phase: "password",
        notice: "Recovery verified. Choose your new password.",
      });
    });
  }
  async save(password: string, confirm: string) {
    await this.run(async (epoch) => {
      if (this.state.phase !== "password" || !this.userId)
        throw new RecoveryValidationError("Verify a password recovery code first.");
      if (password.length < 8 || password.length > 128)
        throw new RecoveryValidationError("Use a password with 8–128 characters.");
      if (password !== confirm) throw new RecoveryValidationError("Passwords do not match.");
      const targetId = this.userId;
      const { data, error } = await this.auth.getUser();
      if (epoch !== this.epoch) return;
      if (
        error ||
        data.user?.id !== this.userId ||
        data.user?.email?.toLowerCase() !== this.state.email
      ) {
        this.userId = null;
        this.publish({ phase: "code" });
        throw new RecoveryValidationError("Recovery expired or changed. Request a new code.");
      }
      const updated = await this.auth.updateUser({ password });
      if (updated.error) throw updated.error;
      this.publish({
        phase: "finishing",
        notice: "Password updated. Finishing secure sign-out…",
      });
      await this.cleanup(targetId);
    });
  }
  private async cleanup(targetId = this.userId) {
    const normal = await this.main.getSession();
    if (normal.error) throw normal.error;
    if (normal.data.session?.user.id === targetId) {
      const result = await this.main.signOut({ scope: "local" });
      if (result.error) throw result.error;
    }
    const result = await this.auth.signOut({ scope: "local" });
    if (result.error) throw result.error;
    this.userId = null;
    this.publish({
      phase: "complete",
      notice: "Password updated. Sign in with your new password.",
    });
  }
  async finish() {
    if (this.state.phase === "finishing") await this.run(() => this.cleanup());
  }
  async restart() {
    if (this.state.busy) return;
    this.epoch++;
    this.userId = null;
    await this.auth.signOut({ scope: "local" });
    this.publish({ phase: "email", email: "", error: "", notice: "" });
  }
  detach() {
    this.epoch++;
    this.userId = null;
    this.onChange = () => {};
    void this.auth.signOut({ scope: "local" }).catch(() => {});
  }
}
