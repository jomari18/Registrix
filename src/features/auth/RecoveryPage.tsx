import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { client, createRecoveryClient } from "../../lib/client";
import { RecoveryFlow } from "./recovery";
import { Field, PasswordField } from "../../components/Field";
import { Button } from "../../components/Button";
import { StatusNotice } from "../../components/StatusNotice";
import { AuthLayout } from "./AuthLayout";
export function RecoveryPage() {
  const [flow, setFlow] = useState<RecoveryFlow | null>(null),
    [, render] = useState(0),
    [email, setEmail] = useState(""),
    [code, setCode] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [clock, setClock] = useState(Date.now());
  useEffect(() => {
    const recovery = createRecoveryClient();
    if (!recovery || !client) return;
    const controller = new RecoveryFlow(recovery.auth, client.auth);
    controller.onChange = () => render((n) => n + 1);
    setFlow(controller);
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => {
      clearInterval(timer);
      controller.detach();
      recovery.auth.stopAutoRefresh();
    };
  }, []);
  const state = flow?.state,
    phase = state?.phase ?? "email",
    busy = state?.busy ?? true,
    wait = Math.max(0, Math.ceil(((state?.deadline ?? 0) - clock) / 1000));
  useEffect(() => {
    if (phase === "finishing" || phase === "complete") {
      setPassword("");
      setConfirm("");
      setCode("");
    }
  }, [phase]);
  return (
    <AuthLayout
      title={
        phase === "password"
          ? "A fresh password."
          : phase === "complete"
            ? "You’re ready to return."
            : "Find your way back."
      }
      description="Reset your password with a code from your email. No reset link needed."
    >
      {phase === "email" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void flow?.send(email);
          }}
        >
          <Field
            label="Email address"
            type="email"
            required
            autoComplete="email"
            value={email}
            disabled={busy}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" disabled={busy || wait > 0}>
            {busy
              ? "Sending…"
              : wait
                ? `Try again in ${wait}s`
                : "Send recovery code"}
          </Button>
        </form>
      )}
      {phase === "code" && (
        <>
          <p className="muted small">
            Recovery email: <strong>{state?.email}</strong>
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void flow?.verify(code);
            }}
          >
            <Field
              label="Recovery code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              pattern="[0-9]{6,10}"
              minLength={6}
              maxLength={10}
              value={code}
              disabled={busy}
              onChange={(e) => setCode(e.target.value)}
            />
            <Button type="submit" disabled={busy}>
              {busy ? "Verifying…" : "Verify recovery code"}
            </Button>
          </form>
          <div className="actions" style={{ marginTop: 16 }}>
            <Button
              variant="secondary"
              disabled={busy || wait > 0}
              onClick={() => void flow?.send(state!.email)}
            >
              {wait ? `Resend in ${wait}s` : "Resend recovery code"}
            </Button>
            <Button
              variant="quiet"
              disabled={busy}
              onClick={() => {
                setCode("");
                setEmail("");
                void flow?.restart();
              }}
            >
              Use another email
            </Button>
          </div>
        </>
      )}
      {phase === "password" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void flow?.save(password, confirm);
          }}
        >
          <PasswordField
            label="New password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            value={password}
            disabled={busy}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordField
            label="Confirm password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            value={confirm}
            disabled={busy}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <Button type="submit" disabled={busy}>
            {busy ? "Updating…" : "Update password"}
          </Button>
        </form>
      )}
      {phase === "finishing" && (
        <Button disabled={busy} onClick={() => void flow?.finish()}>
          Finish reset and sign out
        </Button>
      )}
      {state?.error && <StatusNotice type="error">{state.error}</StatusNotice>}
      {state?.notice && (
        <StatusNotice type="success">{state.notice}</StatusNotice>
      )}
      <div className="auth-note">
        <Link to="/auth" aria-disabled={busy || phase === "finishing"} onClick={(event) => { if (busy || phase === "finishing") event.preventDefault(); }}>
          {phase === "complete"
            ? "Sign in with your new password"
            : "Back to sign in"}
        </Link>
      </div>
    </AuthLayout>
  );
}
