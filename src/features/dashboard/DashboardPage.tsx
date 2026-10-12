import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useQuery } from "../../hooks/useQuery";
import { dashboardApi } from "./api";
import { studentsApi } from "../students/api";
import { studentName } from "../../domain/records";
import { PageHeader } from "../../components/PageHeader";
import { ButtonLink } from "../../components/Button";
import { Icon, type IconName } from "../../components/Icon";
import { QueryState, EmptyState } from "../../components/QueryState";
const actions: Record<string, string> = {
  save_student: "Student information saved",
  set_student_archived: "Student visibility updated",
  save_class: "Class details saved",
  set_class_archived: "Class visibility updated",
  save_enrollment: "Student enrolled in a class",
  set_enrollment_archived: "Enrollment visibility updated",
  save_grades: "Grading record saved",
  review_staff_access: "Staff access reviewed",
  set_teacher_assignment: "Teacher assignment updated",
  save_subject: "Subject details saved",
  set_subject_archived: "Subject visibility updated",
};
export function DashboardPage() {
  const auth = useAuth(),
    manage = auth.access?.role !== "teacher",
    metrics = useQuery("dashboard", dashboardApi.metrics),
    activity = useQuery("dashboard-activity", dashboardApi.activity),
    students = useQuery("dashboard-students", () =>
      studentsApi.list({ pageSize: 5 }),
    ),
    m = metrics.data;
  return (
    <>
      <PageHeader
        eyebrow={new Intl.DateTimeFormat("en-PH", {
          timeZone: "Asia/Manila",
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        }).format(new Date())}
        title="Your academic day, organized."
        description={`Welcome back, ${auth.profile?.display_name ?? "colleague"}. A connected view of your workspace.`}
      >
        {manage ? (
          <ButtonLink to="/students/new">
            <Icon name="plus" />
            Add student
          </ButtonLink>
        ) : (
          <ButtonLink to="/grades">
            <Icon name="grades" />
            Open grading sheets
          </ButtonLink>
        )}
      </PageHeader>
      <QueryState query={metrics} />
      {m && (
        <section className="metrics" aria-label="Workspace metrics">
          {[
            [
              "Active students",
              String(m.students),
              "students",
              "Identity records in your scope",
            ],
            [
              "Active classes",
              String(m.classes),
              "book",
              "Connected academic groups",
            ],
            [
              "Grading progress",
              m.enrollments
                ? Math.round((m.completed / m.enrollments) * 100) + "%"
                : "—",
              "grades",
              `${m.completed} complete / ${m.enrollments} active enrollments`,
            ],
          ].map(([label, value, icon, hint]) => (
            <article className="card metric" key={label}>
              <div>
                <small className="muted">{label}</small>
                <strong>{value}</strong>
                <small className="muted">{hint}</small>
              </div>
              <span className="icon-circle">
                <Icon name={icon as IconName} />
              </span>
            </article>
          ))}
        </section>
      )}
      <div className="grid2" style={{ marginBottom: 24 }}>
        <section className="card soft workspace-hero">
          <div>
            <div className="eyebrow">Class workspace</div>
            <h2>Your classes, connected.</h2>
            <p className="muted">
              Subjects, students and grading records.
              <br />A clear place to pick up where you left off.
            </p>
            <ButtonLink to="/classes">
              Explore classes <Icon name="arrow-right" />
            </ButtonLink>
          </div>
          <img
            src="/assets/illustrations/records-workspace.svg"
            alt="Organized academic records"
          />
        </section>
        <section className="card">
          <div className="sectionhead">
            <h2>A thoughtful next step.</h2>
            <Icon name="check" />
          </div>
          <ul className="checklist">
            <li>
              <span className="number">1</span>
              <div>
                <strong>
                  {manage
                    ? "Connect the academic group"
                    : "Choose an assigned class"}
                </strong>
                <p>
                  Course, year, section, semester and subject stay together.
                </p>
              </div>
            </li>
            <li>
              <span className="number">2</span>
              <div>
                <strong>Bring the scores into focus</strong>
                <p>Six periods calculate one General Average automatically.</p>
              </div>
            </li>
            <li>
              <span className="number">3</span>
              <div>
                <strong>Keep the history</strong>
                <p>Save drafts and recover archived records with care.</p>
              </div>
            </li>
          </ul>
        </section>
      </div>
      <div className="grid2">
        <section className="card">
          <div className="sectionhead">
            <h2>Student records</h2>
            <Link to="/students">View all →</Link>
          </div>
          <QueryState query={students} />
          {students.data &&
            (students.data.items.length ? (
              <>
                <div className="table-wrap desktop-records">
                  <table>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Student number</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.data.items.map((s) => (
                        <tr key={s.id}>
                          <td>
                            <div className="person">
                              <span className="avatar">
                                {s.first_name[0]}
                                {s.surname[0]}
                              </span>
                              <strong>{studentName(s)}</strong>
                            </div>
                          </td>
                          <td>{s.student_no}</td>
                          <td>
                            <Link to={"/students/" + s.id}>View record →</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mobile-records">
                  {students.data.items.map((s) => (
                    <article className="mobile-item" key={s.id}>
                      <h3>{studentName(s)}</h3>
                      <small className="muted">{s.student_no}</small>
                      <Link to={"/students/" + s.id}>View record →</Link>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                title="A calm beginning."
                description={
                  manage
                    ? "Add your first student to begin."
                    : "Assigned class students appear here."
                }
              />
            ))}
        </section>
        <section className="card">
          <div className="sectionhead">
            <h2>Recent activity</h2>
            <Icon name="clock" />
          </div>
          <QueryState query={activity} />
          {activity.data &&
            (activity.data.items.length ? (
              activity.data.items.map((a) => (
                <article className="activity-item" key={a.id}>
                  <span className="icon-circle">
                    <Icon name="check" />
                  </span>
                  <div>
                    <strong>{actions[a.action] ?? "Workspace updated"}</strong>
                    <p className="small muted">{a.display_name}</p>
                    <small>
                      {new Intl.DateTimeFormat("en-PH", {
                        timeZone: "Asia/Manila",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      }).format(new Date(a.created_at))}{" "}
                      · Philippine time
                    </small>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState
                title="Nothing to catch up on."
                description="Completed workspace changes will appear here."
                icon="clock"
              />
            ))}
        </section>
      </div>
    </>
  );
}
