import { useEffect, useState } from "react";
import { rpc } from "../../lib/api";
import { useQuery } from "../../hooks/useQuery";
import { useMutation } from "../../hooks/useMutation";
import type { PageResult } from "../../domain/contracts";
import type { AcademicClass, Staff } from "../../domain/records";
import { Field } from "../../components/Field";
import { ResultChoices } from "../../components/ResultChoices";
import { Button } from "../../components/Button";
import { MutationNotice } from "../../components/MutationNotice";
import { QueryState } from "../../components/QueryState";
import { ConfirmationDialog } from "../../components/ConfirmationDialog";
import { Pagination } from "../../components/Pagination";
export function TeacherAssignments({
  record,
  onSaved,
}: {
  record: AcademicClass;
  onSaved: () => void;
}) {
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState(""),
    [confirm, setConfirm] = useState<{
      user_id: string;
      active: boolean;
      version: number | null;
      name: string;
    } | null>(null),
    q = useQuery(["teacher-select", search, page], () =>
      rpc<PageResult<Staff>>("list_staff", { state: "active", search, page }),
    ),
    mutation = useMutation("set_teacher_assignment", record.id),
    teachers = q.data?.items.filter((s) => s.role === "teacher") ?? [],
    selectedTeacher = teachers.find((s) => s.id === selected);
  useEffect(() => {
    if (mutation.state.phase === "saved") {
      setSelected("");
      onSaved();
    }
  }, [mutation.state.data]);
  return (
    <>
      <h2>Teacher assignments</h2>
      <p className="muted small" style={{ margin: "8px 0 20px" }}>
        Only active teachers assigned here can view this roster and enter
        grades.
      </p>
      {record.assignments
        ?.filter((a) => a.active)
        .map((a) => (
          <div className="mobile-item" key={a.user_id}>
            <strong>{a.profile.display_name}</strong>
            <Button
              variant="secondary small"
              disabled={mutation.locked}
              onClick={() =>
                setConfirm({
                  user_id: a.user_id,
                  active: false,
                  version: a.version,
                  name: a.profile.display_name,
                })
              }
            >
              Remove assignment
            </Button>
          </div>
        ))}
      <div className="record-picker">
        <Field
          label="Search staff to assign"
          type="search"
          value={search}
          disabled={mutation.locked}
          placeholder="Teacher name, username or email"
          hint="Choose an approved teacher from the results below."
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
            setSelected("");
          }}
        />
        <QueryState query={q} />
        {!q.loading && !q.error && q.data && (
          <ResultChoices
            label="Matching teachers"
            selected={selected}
            onSelect={setSelected}
            disabled={mutation.locked}
            emptyText={
              q.data.total
                ? "No approved teachers on this result page. Try another name or page."
                : "No matching teachers."
            }
            options={teachers.map((s) => ({
              id: s.id,
              title: s.display_name,
              detail: s.username + " · " + s.email,
            }))}
          />
        )}
      </div>
      {q.data && q.data.total > 20 && (
        <Pagination
          page={page}
          total={q.data.total}
          disabled={mutation.locked || q.loading}
          onChange={(next) => {
            setSelected("");
            setPage(next);
          }}
        />
      )}
      <MutationNotice mutation={mutation} />
      <div className="actions" style={{ marginTop: 20 }}>
        <Button
          disabled={!selectedTeacher || q.loading || mutation.locked}
          onClick={() =>
            selectedTeacher &&
            !q.loading &&
            !mutation.locked &&
            setConfirm({
              user_id: selected,
              active: true,
              version:
                record.assignments?.find((a) => a.user_id === selected)
                  ?.version ?? null,
              name: selectedTeacher.display_name,
            })
          }
        >
          Assign teacher
        </Button>
      </div>
      <ConfirmationDialog
        open={!!confirm}
        title={confirm?.active ? "Assign teacher?" : "Remove teacher access?"}
        message={`${confirm?.active ? "Assign" : "Remove access for"} ${confirm?.name ?? "this teacher"}? Class access changes on the teacher’s next request.`}
        confirmLabel="Update assignment"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm)
            void mutation.submit(
              {
                user_id: confirm.user_id,
                class_id: record.id,
                active: confirm.active,
              },
              confirm.version,
            );
          setConfirm(null);
        }}
      />
    </>
  );
}
