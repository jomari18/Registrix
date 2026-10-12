import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { client } from "../../lib/client";
import { PasswordField } from "../../components/Field";
import { Button } from "../../components/Button";
import { StatusNotice } from "../../components/StatusNotice";
import { AuthLayout } from "./AuthLayout";
import { useAuth } from "./AuthProvider";
export function ResetPage() {
  const [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    auth = useAuth(),
    navigate = useNavigate();
  return (
    <AuthLayout
      title="A fresh password."
      description="Choose a secure new password for your account."
    >
      {!auth.user ? (
        <StatusNotice>
          Open the latest password reset link from your email.{" "}
          <Link to="/forgot-password">Request a reset</Link>
        </StatusNotice>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (password !== confirm) {
              setError("Passwords do not match.");
              return;
            }
            if (!client) return;
            setBusy(true);
            try {
              const { error } = await client.auth.updateUser({ password });
              if (error)
                setError(
                  "Password could not be updated. Open a fresh reset link and try again.",
                );
              else {
                await auth.signOut();
                navigate("/auth?reset=complete");
              }
            } catch {
              setError("Could not connect. Try again when online.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <PasswordField
            label="New password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordField
            label="Confirm password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {error && <StatusNotice type="error">{error}</StatusNotice>}
          <Button type="submit" disabled={busy}>
            {busy ? "Updating…" : "Update password"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
