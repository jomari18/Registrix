import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "../../hooks/useQuery";
import { useDraft } from "../../hooks/useDraft";
import { useMutation } from "../../hooks/useMutation";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { studentsApi } from "./api";
import type { Student } from "../../domain/records";
import {
  normalizeStudentNumber,
  validateStudent,
} from "../../domain/validation";
import { PageHeader } from "../../components/PageHeader";
import { QueryState } from "../../components/QueryState";
import { Field } from "../../components/Field";
import { SelectField } from "../../components/SelectField";
import { Button } from "../../components/Button";
import { StatusNotice } from "../../components/StatusNotice";
import { MutationNotice } from "../../components/MutationNotice";
import { DraftConflict } from "../../components/DraftConflict";
export function StudentForm() {
  const { id } = useParams(),
    q = useQuery(["student", id], () => studentsApi.get(id!), !!id);
  if (id && !q.data) return <QueryState query={q} />;
  return <StudentEditor key={id ?? "new"} student={q.data ?? undefined} />;
}
function StudentEditor({ student }: { student?: Student }) {
  const initial = {
      student_no: student?.student_no ?? "",
      surname: student?.surname ?? "",
      first_name: student?.first_name ?? "",
      middle_initial: student?.middle_initial ?? "",
      gender: student?.gender ?? "",
    },
    draft = useDraft(
      "student:" + (student?.id ?? "new"),
      initial,
      student?.version ?? null,
    ),
    mutation = useMutation<any, Student>("save_student", student?.id ?? "new"),
    [error, setError] = useState(""),
    navigate = useNavigate(),
    unsaved = useUnsavedChanges(
      JSON.stringify(initial) !== JSON.stringify(draft.value) &&
        mutation.state.phase !== "saved",
    );
  useEffect(() => {
    const saved = mutation.state.data;
    if (saved && mutation.state.phase === "saved") {
      draft.clear();
      unsaved.allowNavigation();
      navigate(`/students/${saved.id}${student ? "" : "?new=1"}`);
    }
  }, [mutation.state.data]);
  const update =
    (key: keyof typeof initial) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      draft.set({ ...draft.value, [key]: e.target.value });
  return (
    <>
      <div className="breadcrumb">
        <Link to="/students">Students</Link>
        <span>/</span>
        {student ? "Edit student" : "New student"}
      </div>
      <PageHeader
        title={student ? "A thoughtful update." : "A new student story."}
        description="Start with identity details. Academic information belongs to each class enrollment."
      />
      <section className="card">
        {draft.stale && (
          <DraftConflict latest={initial} onDiscard={draft.reset} />
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const invalid = validateStudent(draft.value);
            if (invalid) {
              setError(invalid);
              return;
            }
            setError("");
            void mutation.submit(
              {
                ...draft.value,
                student_no: normalizeStudentNumber(draft.value.student_no),
                ...(student ? { id: student.id } : {}),
              },
              draft.baseVersion,
            );
          }}
        >
          <fieldset
            disabled={mutation.locked}
            style={{ border: 0, padding: 0, margin: 0 }}
          >
            <div className="form-grid identity">
              <Field
                label="Student number"
                required
                maxLength={40}
                value={draft.value.student_no}
                onChange={update("student_no")}
              />
              <SelectField
                label="Gender"
                required
                value={draft.value.gender}
                onChange={update("gender")}
              >
                <option value="">Select gender</option>
                {["male", "female", "other"].map((g) => (
                  <option key={g} value={g}>
                    {g[0].toUpperCase() + g.slice(1)}
                  </option>
                ))}
              </SelectField>
              <Field
                label="Surname"
                required
                maxLength={100}
                value={draft.value.surname}
                onChange={update("surname")}
              />
              <Field
                label="First name"
                required
                maxLength={100}
                value={draft.value.first_name}
                onChange={update("first_name")}
              />
              <Field
                label="Middle initial (optional)"
                maxLength={12}
                value={draft.value.middle_initial}
                onChange={update("middle_initial")}
              />
            </div>
          </fieldset>
          {error && <StatusNotice type="error">{error}</StatusNotice>}
          <MutationNotice mutation={mutation} />
          <div className="form-actions">
            <Button type="submit" disabled={mutation.locked || draft.stale}>
              Save student
            </Button>
            <Link to={student ? "/students/" + student.id : "/students"}>
              Cancel
            </Link>
          </div>
        </form>
      </section>
      {unsaved.dialog}
    </>
  );
}
