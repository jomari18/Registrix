import { useState } from "react";
import { Link } from "react-router-dom";
import { client } from "../../lib/client";
import { Field } from "../../components/Field";
import { Button } from "../../components/Button";
import { StatusNotice } from "../../components/StatusNotice";
import { AuthLayout } from "./AuthLayout";
export function RecoveryPage() {
  const [email, setEmail] = useState(""),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <AuthLayout
      title="Find your way back."
      description="We’ll send instructions to reset your password."
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!client) return;
          setBusy(true);
          setError("");
          try {
            const { error } = await client.auth.resetPasswordForEmail(
              email.trim(),
              { redirectTo: location.origin + "/reset-password" },
            );
            if (error)
              setError(
                "Could not request a reset. Wait a moment and try again.",
              );
            else
              setNotice(
                "If this email has an account, password reset instructions are on their way.",
              );
          } catch {
            setError("Could not connect. Try again when online.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field
          label="Email address"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {error && <StatusNotice type="error">{error}</StatusNotice>}
        {notice && <StatusNotice type="success">{notice}</StatusNotice>}
        <Button type="submit" disabled={busy}>
          {busy ? "Sending…" : "Send reset instructions"}
        </Button>
      </form>
      <div className="auth-note">
        <Link to="/auth">Back to sign in</Link>
      </div>
    </AuthLayout>
  );
}
