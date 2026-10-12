import { useEffect, useState } from "react";
import { useQuery } from "../../hooks/useQuery";
import { useMutation } from "../../hooks/useMutation";
import { useAuth } from "../auth/AuthProvider";
import { accountsApi } from "./api";
import type { Staff, Assignment } from "../../domain/records";
import { PageHeader } from "../../components/PageHeader";
import { Field } from "../../components/Field";
import { SelectField } from "../../components/SelectField";
import { Button } from "../../components/Button";
import { QueryState, EmptyState } from "../../components/QueryState";
import { Pagination } from "../../components/Pagination";
import { MutationNotice } from "../../components/MutationNotice";
import { ConfirmationDialog } from "../../components/ConfirmationDialog";
export function AccountsPage() {
  const [search, setSearch] = useState(""),
    [state, setState] = useState("pending"),
    [page, setPage] = useState(1),
    q = useQuery(["staff-access", search, state, page], () =>
      accountsApi.list({ search, state, page }),
    );
  return (
    <>
      <PageHeader
        eyebrow="Administrator workspace"
        title="The right people. The right access."
        description="Review verified accounts, approve staff roles and keep records in trusted hands."
      />
      <section className="card">
        <div className="tabs" role="group" aria-label="Staff access state">
          {["pending", "active", "rejected", "revoked"].map((s) => (
            <button
              key={s}
              className={state === s ? "active" : ""}
              onClick={() => {
                setState(s);
                setPage(1);
              }}
            >
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="filters">
          <Field
            label="Search staff"
            type="search"
            placeholder="Name, username or email"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <QueryState query={q} />
        {q.data &&
          (q.data.items.length ? (
            <div className="staff-list">
              {q.data.items.map((s) => (
                <StaffCard key={s.id} staff={s} onSaved={q.refresh} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No staff accounts here."
              description="New verified registrations await review in the Pending tab."
              icon="users"
            />
          ))}
        {q.data && (
          <Pagination page={page} total={q.data.total} onChange={setPage} />
        )}
      </section>
    </>
  );
}
function StaffCard({ staff, onSaved }: { staff: Staff; onSaved: () => void }) {
  const [role, setRole] = useState(staff.role ?? "teacher"),
    [confirmation, setConfirmation] = useState<{
      state: string;
      label: string;
    } | null>(null),
    mutation = useMutation<any, Assignment>("review_staff_access", staff.id),
    auth = useAuth();
  useEffect(() => {
    if (mutation.state.phase === "saved") {
      onSaved();
      void auth.refreshAccess();
    }
  }, [mutation.state.data]);
  return (
    <article className="card" aria-label={"Staff " + staff.email}>
      <div className="sectionhead">
        <div className="person">
          <span className="avatar">{staff.display_name[0]}</span>
          <div>
            <h3>{staff.display_name}</h3>
            <p className="muted small">
              {staff.email} · {staff.username}
            </p>
          </div>
        </div>
        <span
          className={`badge ${staff.state === "active" ? "success" : staff.state === "revoked" || staff.state === "rejected" ? "danger" : "warning"}`}
        >
          {staff.state}
        </span>
      </div>
      <div className="form-grid">
        <SelectField
          label={"Role for " + staff.display_name}
          value={role}
          disabled={mutation.locked}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="teacher">Teacher</option>
          <option value="registrar">Registrar</option>
          <option value="administrator">Administrator</option>
        </SelectField>
        <div>
          <small className="muted">Email verification</small>
          <p>
            <strong>
              {staff.email_confirmed_at ? "Verified" : "Not verified yet"}
            </strong>
          </p>
          <small className="muted">
            Teacher class assignments are managed on each class page.
          </small>
        </div>
      </div>
      <MutationNotice mutation={mutation} />
      <div className="form-actions">
        {staff.state !== "active" ? (
          <>
            <Button
              disabled={!staff.email_confirmed_at || mutation.locked}
              onClick={() =>
                setConfirmation({ state: "active", label: "Approve access" })
              }
            >
              Approve access
            </Button>
            {staff.state === "pending" && (
              <Button
                variant="secondary"
                disabled={mutation.locked}
                onClick={() =>
                  setConfirmation({ state: "rejected", label: "Reject access" })
                }
              >
                Reject access
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              disabled={mutation.locked}
              onClick={() =>
                setConfirmation({ state: "active", label: "Update role" })
              }
            >
              Update role
            </Button>
            <Button
              variant="secondary"
              disabled={mutation.locked}
              onClick={() =>
                setConfirmation({ state: "revoked", label: "Revoke access" })
              }
            >
              Revoke access
            </Button>
          </>
        )}
      </div>
      <ConfirmationDialog
        open={!!confirmation}
        title={confirmation?.label + "?"}
        message={`Review ${staff.display_name} (${staff.email}). Role: ${role}. Access changes on their next request. Keep at least one active administrator.`}
        confirmLabel={confirmation?.label}
        onCancel={() => setConfirmation(null)}
        onConfirm={() => {
          if (confirmation)
            void mutation.submit(
              { user_id: staff.id, role, state: confirmation.state },
              staff.version,
            );
          setConfirmation(null);
        }}
      />
    </article>
  );
}
