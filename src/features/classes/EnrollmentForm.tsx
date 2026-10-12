import { useEffect, useState } from "react";
import { useQuery } from "../../hooks/useQuery";
import { useMutation } from "../../hooks/useMutation";
import { classesApi } from "./api";
import { studentsApi } from "../students/api";
import { classLabel, studentName, type Enrollment } from "../../domain/records";
import { Button } from "../../components/Button";
import { Field } from "../../components/Field";
import { ResultChoices } from "../../components/ResultChoices";
import { MutationNotice } from "../../components/MutationNotice";
import { QueryState } from "../../components/QueryState";
import { Pagination } from "../../components/Pagination";
export function EnrollmentForm({
  studentId,
  classId,
  onSaved,
}: {
  studentId?: string;
  classId?: string;
  onSaved: () => void;
}) {
  const [search, setSearch] = useState(""),
    [selected, setSelected] = useState(""),
    [page, setPage] = useState(1),
    classes = useQuery(
      ["enroll-class", search, page],
      () => classesApi.list({ search, page }),
      !!studentId,
    ),
    students = useQuery(
      ["enroll-student", search, page],
      () => studentsApi.list({ search, page }),
      !!classId,
    ),
    mutation = useMutation<any, Enrollment>(
      "save_enrollment",
      studentId ?? classId!,
    ),
    q = studentId ? classes : students,
    visibleSelection = !!q.data?.items.some((item) => item.id === selected);
  useEffect(() => {
    if (mutation.state.phase === "saved") {
      setSelected("");
      onSaved();
    }
  }, [mutation.state.data]);
  return (
    <div>
      <h3>
        {studentId ? "Add a class enrollment" : "Add a student to this class"}
      </h3>
      <p className="muted small" style={{ margin: "8px 0 20px" }}>
        Each enrollment keeps its own six scores and academic history.
      </p>
      <div className="record-picker">
        <Field
          label={studentId ? "Search classes" : "Search students to enroll"}
          type="search"
          value={search}
          disabled={mutation.locked}
          placeholder={
            studentId
              ? "Subject name, code or section"
              : "Student name or number"
          }
          hint="Matching records appear below. Choose one before adding the enrollment."
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
            setSelected("");
          }}
        />
        <QueryState query={q} />
        {!q.loading && !q.error && q.data && (
          <ResultChoices
            label={studentId ? "Matching classes" : "Matching students"}
            selected={selected}
            onSelect={setSelected}
            disabled={mutation.locked}
            emptyText={
              studentId ? "No matching classes." : "No matching students."
            }
            options={
              studentId
                ? (classes.data?.items ?? []).map((c) => ({
                    id: c.id,
                    title: c.subject.description,
                    detail: classLabel(c),
                  }))
                : (students.data?.items ?? []).map((s) => ({
                    id: s.id,
                    title: studentName(s),
                    detail: "Student number · " + s.student_no,
                  }))
            }
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
          disabled={!visibleSelection || q.loading || mutation.locked}
          onClick={() =>
            visibleSelection &&
            !q.loading &&
            !mutation.locked &&
            void mutation.submit(
              {
                student_id: studentId ?? selected,
                class_id: classId ?? selected,
              },
              null,
            )
          }
        >
          Add enrollment
        </Button>
      </div>
    </div>
  );
}
