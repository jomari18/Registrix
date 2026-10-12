import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "../../hooks/useQuery";
import { classesApi } from "../classes/api";
import { AcademicFields } from "../classes/AcademicFields";
import { classLabel, studentName } from "../../domain/records";
import { periods, periodLabels } from "../../domain/grades";
import { PageHeader } from "../../components/PageHeader";
import { Field } from "../../components/Field";
import { SelectField } from "../../components/SelectField";
import { QueryState, EmptyState } from "../../components/QueryState";
import { Pagination } from "../../components/Pagination";
export function GradeSheet() {
  const [params, setParams] = useSearchParams(),
    [page, setPage] = useState(1),
    [classPage, setClassPage] = useState(1),
    [search, setSearch] = useState(""),
    classId = params.get("class_id") ?? "",
    filters = Object.fromEntries(
      ["course", "year_level", "semester", "section", "school_year"]
        .map((key) => [key, params.get(key) ?? ""])
        .filter(([, v]) => v),
    ),
    classes = useQuery(["sheet-classes", filters, classPage], () =>
      classesApi.list({ ...filters, page: classPage, pageSize: 100 }),
    ),
    sheet = useQuery(
      ["grade-sheet", classId, search, page],
      () => classesApi.roster({ class_id: classId, search, page }),
      !!classId,
    ),
    change = (key: string, value: string) => {
      const next = new URLSearchParams(params);
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete("class_id");
      setParams(next);
      setPage(1);
      setClassPage(1);
    };
  return (
    <>
      <PageHeader
        eyebrow="Grading workspace"
        title="A clearer view of progress."
        description="Choose an academic group, open a student’s scores and let the average compute itself."
      />
      <section className="card">
        <div className="filters">
          <AcademicFields
            course={params.get("course") ?? ""}
            year={params.get("year_level") ?? ""}
            semester={params.get("semester") ?? ""}
            includeAll
            onChange={change}
          />
          <SelectField
            label="Section"
            value={params.get("section") ?? ""}
            onChange={(e) => change("section", e.target.value)}
          >
            <option value="">All sections</option>
            {"ABCDEFGHIJ".split("").map((s) => (
              <option key={s}>{s}</option>
            ))}
          </SelectField>
          <Field
            label="School year"
            placeholder="All school years"
            value={params.get("school_year") ?? ""}
            onChange={(e) => change("school_year", e.target.value)}
          />
          <SelectField
            label="Subject and class"
            value={classId}
            onChange={(e) => {
              const next = new URLSearchParams(params);
              if (e.target.value) next.set("class_id", e.target.value);
              else next.delete("class_id");
              setParams(next);
              setPage(1);
            }}
          >
            <option value="">Choose a class</option>
            {classes.data?.items.map((c) => (
              <option key={c.id} value={c.id}>
                {classLabel(c)}
              </option>
            ))}
          </SelectField>
        </div>
        <QueryState query={classes} />
        {classes.data && classes.data.total > 100 && (
          <Pagination
            page={classPage}
            size={100}
            total={classes.data.total}
            onChange={setClassPage}
          />
        )}
        <div className="sectionhead">
          <h2>Class grading sheet</h2>
          {classId && <Link to={"/classes/" + classId}>View class →</Link>}
        </div>
        {classId ? (
          <>
            <div className="filters">
              <Field
                label="Search the grading sheet"
                type="search"
                placeholder="Student number or name"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <QueryState query={sheet} />
            {sheet.data &&
              (sheet.data.items.length ? (
                <>
                  <div className="table-wrap desktop-records">
                    <table className="grade-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          {periodLabels.map((label) => (
                            <th key={label}>{label}</th>
                          ))}
                          <th>General Average</th>
                          <th>Equivalent</th>
                          <th>Remarks</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sheet.data.items.map((e) => (
                          <tr key={e.id}>
                            <td>
                              <strong>{studentName(e.student)}</strong>
                              <small className="muted">
                                {e.student.student_no}
                              </small>
                            </td>
                            {periods.map((key) => (
                              <td key={key}>{e.grade?.scores[key] ?? "—"}</td>
                            ))}
                            <td>
                              <strong>
                                {e.grade?.result.generalAverage ?? "—"}
                              </strong>
                            </td>
                            <td>
                              {e.grade?.result.numericalEquivalent ?? "—"}
                            </td>
                            <td>
                              <span
                                className={`badge ${e.grade?.result.remarks === "Passed" ? "success" : e.grade?.result.remarks === "Failed" ? "danger" : "warning"}`}
                              >
                                {e.grade?.result.remarks ?? "Incomplete"}
                              </span>
                            </td>
                            <td>
                              <Link to={"/grades/" + e.id}>Enter grades →</Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mobile-records">
                    {sheet.data.items.map((e) => (
                      <article className="mobile-item" key={e.id}>
                        <h3>{studentName(e.student)}</h3>
                        <small className="muted">{e.student.student_no}</small>
                        <div className="form-grid">
                          {periods.map((key, i) => (
                            <div key={key}>
                              <small className="muted">{periodLabels[i]}</small>
                              <p>
                                <strong>{e.grade?.scores[key] ?? "—"}</strong>
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="actions">
                          <span className="badge">
                            {e.grade?.result.generalAverage ?? "Incomplete"} ·{" "}
                            {e.grade?.result.remarks ?? "Draft"}
                          </span>
                          <Link
                            className="btn secondary small"
                            to={"/grades/" + e.id}
                          >
                            Enter grades →
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState
                  title="No active students in this sheet."
                  description="Add class enrollments or adjust the student search."
                  icon="grades"
                />
              ))}
            {sheet.data && (
              <Pagination
                page={page}
                total={sheet.data.total}
                onChange={setPage}
              />
            )}
          </>
        ) : (
          <EmptyState
            title="Choose a class to begin."
            description="Filters keep the right course, year, section, term and subject together."
            icon="grades"
          />
        )}
        <p className="muted small" style={{ marginTop: 20 }}>
          General Average is the equal mean of six periods. Numerical conversion
          uses the raw average rounded half-up to one decimal.
        </p>
      </section>
    </>
  );
}
