import { useEffect, useState } from "react";
import { useQuery } from "../../hooks/useQuery";
import { useMutation } from "../../hooks/useMutation";
import { classesApi } from "./api";
import { studentsApi } from "../students/api";
import { classLabel, studentName, type Enrollment } from "../../domain/records";
import { Button } from "../../components/Button";
import { Field } from "../../components/Field";
import { SelectField } from "../../components/SelectField";
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
    q = studentId ? classes : students;
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
      <div className="form-grid">
        <Field
          label={studentId ? "Search classes" : "Search students to enroll"}
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <SelectField
          label={studentId ? "Select a class" : "Select a student"}
          name={studentId ? "class_id" : "student_id"}
          disabled={mutation.locked || q.loading}
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Choose an active record</option>
          {studentId
            ? classes.data?.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {classLabel(c)}
                </option>
              ))
            : students.data?.items.map((s) => (
                <option key={s.id} value={s.id}>
                  {studentName(s)} · {s.student_no}
                </option>
              ))}
        </SelectField>
      </div>
      <QueryState query={q} />
      {q.data && q.data.total > 20 && (
        <Pagination page={page} total={q.data.total} onChange={setPage} />
      )}
      <MutationNotice mutation={mutation} />
      <div className="actions" style={{ marginTop: 20 }}>
        <Button
          disabled={!selected || mutation.locked}
          onClick={() =>
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
