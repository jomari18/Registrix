import { Link } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { Brand } from "../../app/AppShell";
import { Button } from "../../components/Button";
import { Icon } from "../../components/Icon";
import { StatusNotice } from "../../components/StatusNotice";
export function AccessPage() {
  const auth = useAuth();
  const state = auth.access?.state;
  return (
    <main className="main">
      <Brand />
      <section className="card access-card">
        <div className="icon-circle">
          <Icon name="shield" />
        </div>
        <div className="eyebrow" style={{ marginTop: 24 }}>
          Staff access
        </div>
        <h1>
          {state === "active"
            ? "Your workspace is ready."
            : state === "unverified"
              ? "Verify your email."
              : state === "revoked"
                ? "Access has been revoked."
                : state === "rejected"
                  ? "Access was not approved."
                  : "You’re on the list."}
        </h1>
        <p className="muted" style={{ marginTop: 16 }}>
          {" "}
          {state === "active"
            ? "Your verified account has approved staff access."
            : state === "unverified"
              ? "Finish email verification before requesting workspace access."
              : "Your account cannot access student records until an administrator approves an active staff role. Contact your workspace administrator."}
        </p>
        {auth.error && (
          <StatusNotice type="error">
            {auth.error} If this project is new, apply the Registrix setup SQL
            first.
          </StatusNotice>
        )}
        <div className="form-actions">
          {state === "active" ? (
            <Link className="btn" to="/">
              Open workspace
            </Link>
          ) : state === "unverified" ? (
            <Link
              className="btn"
              to={"/verify?email=" + encodeURIComponent(auth.user?.email ?? "")}
            >
              Verify email
            </Link>
          ) : (
            <Button onClick={() => void auth.refreshAccess()}>
              Check access again
            </Button>
          )}
          <Button variant="secondary" onClick={() => void auth.signOut()}>
            Sign out
          </Button>
        </div>
      </section>
    </main>
  );
}
