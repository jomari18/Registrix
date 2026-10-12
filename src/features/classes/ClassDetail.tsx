import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useQuery } from "../../hooks/useQuery";
import { classesApi } from "./api";
import { classLabel, studentName } from "../../domain/records";
import { PageHeader } from "../../components/PageHeader";
import { ButtonLink } from "../../components/Button";
import { QueryState, EmptyState } from "../../components/QueryState";
import { ArchiveAction } from "../../components/ArchiveAction";
import { Pagination } from "../../components/Pagination";
import { EnrollmentForm } from "./EnrollmentForm";
import { TeacherAssignments } from "./TeacherAssignments";
export function ClassDetail() {
  const { id } = useParams(),
    [page, setPage] = useState(1),
    [archived, setArchived] = useState(false),
    role = useAuth().access?.role,
    manage = role !== "teacher",
    q = useQuery(["class-detail", id], () => classesApi.get(id!)),
    roster = useQuery(["roster", id, page, archived], () =>
      classesApi.roster({ class_id: id, page, archived }),
    ),
    c = q.data;
  const refresh = () => {
    q.refresh();
    roster.refresh();
  };
  return (
    <>
      <div className="breadcrumb">
        <Link to="/classes">Classes</Link>
        <span>/</span>Class record
      </div>
      <QueryState query={q} />
      {c && (
        <>
          <PageHeader
            eyebrow={c.subject.code}
            title={c.subject.description}
            description={classLabel(c) + " · " + c.subject.units + " units"}
          >
            <ButtonLink to={"/grades?class_id=" + c.id}>
              Open grading sheet
            </ButtonLink>
            {manage && (
              <>
                <ButtonLink
                  to={"/classes/" + c.id + "/edit"}
                  variant="secondary"
                >
                  Edit class
                </ButtonLink>
                <ArchiveAction
                  entity="class"
                  id={c.id}
                  version={c.version}
                  archived={c.archived}
                  onSaved={refresh}
                />
              </>
            )}
          </PageHeader>
          <div className="stack">
            <section className="card">
              <div className="sectionhead">
                <h2>Class roster</h2>
                <span className={`badge ${c.archived ? "warning" : "success"}`}>
                  {c.archived ? "Class archived" : "Active class"}
                </span>
              </div>
              {manage && (
                <div className="tabs">
                  <button
                    className={!archived ? "active" : ""}
                    onClick={() => {
                      setArchived(false);
                      setPage(1);
                    }}
                  >
                    Active enrollments
                  </button>
                  <button
                    className={archived ? "active" : ""}
                    onClick={() => {
                      setArchived(true);
                      setPage(1);
                    }}
                  >
                    Archived enrollments
                  </button>
                </div>
              )}
              <QueryState query={roster} />
              {roster.data &&
                (roster.data.items.length ? (
                  <>
                    {roster.data.items.map((e) => (
                      <article className="mobile-item" key={e.id}>
                        <div>
                          <Link to={"/students/" + e.student_id}>
                            <strong>{studentName(e.student)}</strong>
                          </Link>
                          <p className="muted small">
                            {e.student.student_no} ·{" "}
                            {e.grade?.result.generalAverage ?? "Incomplete"}
                          </p>
                        </div>
                        <div className="actions">
                          <Link
                            className="btn secondary small"
                            to={"/grades/" + e.id}
                          >
                            View grades
                          </Link>
                          {manage && (
                            <ArchiveAction
                              entity="enrollment"
                              id={e.id}
                              version={e.version}
                              archived={e.archived}
                              labelSuffix={e.student.student_no}
                              onSaved={refresh}
                            />
                          )}
                        </div>
                      </article>
                    ))}
                  </>
                ) : (
                  <EmptyState
                    title="An open roster."
                    description="Add students to this class to start their grading records."
                    icon="book"
                  />
                ))}
              {roster.data && (
                <Pagination
                  page={page}
                  total={roster.data.total}
                  onChange={setPage}
                />
              )}
            </section>
            {manage && !c.archived && (
              <section className="card">
                <EnrollmentForm classId={c.id} onSaved={refresh} />
              </section>
            )}
            {role === "administrator" && (
              <section className="card">
                <TeacherAssignments record={c} onSaved={q.refresh} />
              </section>
            )}
          </div>
        </>
      )}
    </>
  );
}
