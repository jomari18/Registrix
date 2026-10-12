import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "../../hooks/useQuery";
import { useDraft } from "../../hooks/useDraft";
import { useMutation } from "../../hooks/useMutation";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { gradesApi } from "./api";
import type { Enrollment, Grade } from "../../domain/records";
import { studentName, classLabel } from "../../domain/records";
import type { GradeScores } from "../../domain/contracts";
import {
  computeGrade,
  parseScore,
  periods,
  periodLabels,
} from "../../domain/grades";
import { GradeResultSummary } from "./GradeResultSummary";
import { PageHeader } from "../../components/PageHeader";
import { Field } from "../../components/Field";
import { Button } from "../../components/Button";
import { QueryState } from "../../components/QueryState";
import { MutationNotice } from "../../components/MutationNotice";
import { StatusNotice } from "../../components/StatusNotice";
const inputs = (scores?: GradeScores) =>
  Object.fromEntries(
    periods.map((key) => [
      key,
      scores?.[key] == null ? "" : String(scores[key]),
    ]),
  ) as Record<(typeof periods)[number], string>;
export function GradeEntry() {
  const { enrollmentId } = useParams(),
    q = useQuery(["grade-entry", enrollmentId], () =>
      gradesApi.get(enrollmentId!),
    );
  if (!q.data) return <QueryState query={q} />;
  return <GradeEditor key={enrollmentId} enrollment={q.data} />;
}
function GradeEditor({ enrollment }: { enrollment: Enrollment }) {
  const [saved, setSaved] = useState<Grade | null>(enrollment.grade),
    [baseline, setBaseline] = useState(inputs(enrollment.grade?.scores)),
    draft = useDraft("grades:" + enrollment.id, baseline),
    mutation = useMutation<
      { enrollment_id: string; scores: GradeScores },
      Grade
    >("save_grades", enrollment.id),
    dirty = JSON.stringify(draft.value) !== JSON.stringify(baseline),
    unsaved = useUnsavedChanges(dirty || mutation.state.phase === "unknown"),
    readOnly =
      enrollment.archived ||
      enrollment.student.archived ||
      enrollment.class.archived;
  let scores: GradeScores | null = null,
    error = "";
  const invalid = new Set<string>();
  for (const key of periods) {
    try {
      parseScore(draft.value[key]);
    } catch {
      invalid.add(key);
    }
  }
  try {
    scores = Object.fromEntries(
      periods.map((key) => [key, parseScore(draft.value[key])]),
    ) as GradeScores;
  } catch (e) {
    error = (e as Error).message;
  }
  const result = scores ? computeGrade(scores) : null;
  useEffect(() => {
    if (mutation.state.phase === "saved" && mutation.state.data) {
      const grade = mutation.state.data;
      setSaved(grade);
      setBaseline(inputs(grade.scores));
      draft.set(inputs(grade.scores));
      draft.clear();
    }
  }, [mutation.state.data]);
  return (
    <>
      <div className="breadcrumb">
        <Link to={"/grades?class_id=" + enrollment.class_id}>
          Grading sheet
        </Link>
        <span>/</span>Grade entry
      </div>
      <PageHeader
        eyebrow={enrollment.student.student_no}
        title={studentName(enrollment.student)}
        description={
          classLabel(enrollment.class) +
          " · " +
          enrollment.class.subject.units +
          " units"
        }
      />
      <div className="grid2">
        <section className="card">
          <div className="sectionhead">
            <h2>Six periods. One clear result.</h2>
            <span
              className={`badge ${result?.status === "complete" ? "success" : "warning"}`}
            >
              {dirty ? "Unsaved changes" : saved ? "Saved record" : "New draft"}
            </span>
          </div>
          {readOnly && (
            <StatusNotice type="warning">
              This enrollment is archived. Scores are retained as read-only
              history.
            </StatusNotice>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (scores && !readOnly && !mutation.locked)
                void mutation.submit(
                  { enrollment_id: enrollment.id, scores },
                  saved?.version ?? null,
                );
            }}
          >
            <fieldset
              disabled={mutation.locked || readOnly}
              style={{ border: 0, margin: 0, padding: 0 }}
            >
              <div className="form-grid">
                {periods.map((key, i) => (
                  <Field
                    key={key}
                    label={periodLabels[i]}
                    inputMode="decimal"
                    autoComplete="off"
                    aria-invalid={invalid.has(key)}
                    placeholder="0–100"
                    value={draft.value[key]}
                    onChange={(e) =>
                      draft.set({ ...draft.value, [key]: e.target.value })
                    }
                    hint="Optional for drafts · up to 2 decimals"
                  />
                ))}
              </div>
            </fieldset>
            {error && <StatusNotice type="error">{error}</StatusNotice>}
            {result && (
              <GradeResultSummary result={result} label="Grade preview" />
            )}
            <MutationNotice mutation={mutation} />
            <div className="form-actions">
              {!readOnly && (
                <Button type="submit" disabled={mutation.locked || !!error}>
                  Save grades
                </Button>
              )}
              <Link to={"/grades?class_id=" + enrollment.class_id}>
                Back to grading sheet
              </Link>
            </div>
          </form>
          {saved && (
            <div
              style={{
                marginTop: 26,
                paddingTop: 22,
                borderTop: "1px solid var(--line)",
              }}
            >
              <h3>Saved result</h3>
              <p className="muted small">
                Authoritative database calculation · version {saved.version}
              </p>
              <GradeResultSummary result={saved.result} label="Saved result" />
            </div>
          )}
        </section>
        <aside className="stack">
          <section className="card">
            <div className="eyebrow">Calculation guide</div>
            <h2>A transparent average.</h2>
            <p className="muted" style={{ marginTop: 12 }}>
              Each of the six grading periods contributes equally. Subject units
              are academic metadata and do not weight this result.
            </p>
            <div className="formula">
              (Monthly + First prelim + Second prelim + Midterm + Pre-final +
              Final) ÷ 6
            </div>
            <p className="muted small">
              Display: raw average rounded half-up to two decimals.
              Classification: raw average rounded half-up to one decimal, then
              matched to the scale.
            </p>
            <p className="muted small">
              An empty score stays missing. Zero is a valid score. All six are
              needed for a completed result.
            </p>
            <Link
              to="/help#grading"
              style={{ display: "inline-block", marginTop: 20 }}
            >
              Review the grading scale →
            </Link>
          </section>
          <section className="card">
            <h3>Connected to the right record</h3>
            <dl className="detail-grid">
              <div>
                <dt>Subject</dt>
                <dd>{enrollment.class.subject.code}</dd>
              </div>
              <div>
                <dt>Section</dt>
                <dd>{enrollment.class.section}</dd>
              </div>
              <div>
                <dt>Semester</dt>
                <dd>{enrollment.class.semester}</dd>
              </div>
              <div>
                <dt>School year</dt>
                <dd>{enrollment.class.school_year}</dd>
              </div>
            </dl>
            <p className="muted small">
              Saving updates this enrollment only. Other subjects and academic
              terms stay independent.
            </p>
          </section>
        </aside>
      </div>
      {unsaved.dialog}
    </>
  );
}
