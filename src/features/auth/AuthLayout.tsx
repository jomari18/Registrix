import type { ReactNode } from "react";
import { Brand } from "../../app/AppShell";
export function AuthLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="auth">
      <aside className="auth-story">
        <Brand />
        <div>
          <div className="eyebrow">A thoughtful academic workspace</div>
          <h1>
            Every record.
            <br />A clearer story.
          </h1>
          <p>
            Bring student information, class rosters and grading sheets into one
            calm, connected workspace.
          </p>
        </div>
        <img
          src="/assets/illustrations/records-workspace.svg"
          alt="Illustration of organized student records and a graduation cap"
        />
        <small className="muted">
          Registrix · Independent academic portfolio project
        </small>
      </aside>
      <section className="auth-panel">
        <div className="auth-form">
          <Brand />
          <div className="eyebrow">Your academic workspace</div>
          <h1>{title}</h1>
          <p className="muted">{description}</p>
          {children}
        </div>
      </section>
    </main>
  );
}
