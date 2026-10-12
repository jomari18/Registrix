import { Link } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
export function HelpPage() {
  return (
    <>
      <PageHeader
        eyebrow="Workspace guide"
        title="A little clarity goes a long way."
        description="How Registrix connects staff access, student information and grading records."
      />
      <div className="grid2">
        <section className="card help">
          <h2>Working with your records</h2>
          <details open>
            <summary>How do I get staff access?</summary>
            <p>
              Create an account with your email and verify it. New accounts stay
              pending until an administrator approves a role. A position entered
              during registration does not grant permissions.
            </p>
          </details>
          <details>
            <summary>What can each role do?</summary>
            <p>
              Administrators manage staff approval, assignments and all records.
              Registrars manage students, curriculum subjects, classes,
              enrollments and grades. Teachers view and grade only their
              assigned classes; student identity and staff controls stay
              restricted.
            </p>
          </details>
          <details>
            <summary>Can students have multiple subjects?</summary>
            <p>
              Yes. Create one student identity with a unique student number,
              then add separate class enrollments. Each enrollment keeps its own
              grading periods and academic term. Duplicate names are allowed;
              student numbers must be unique.
            </p>
          </details>
          <details>
            <summary>How do archived records work?</summary>
            <p>
              Archiving preserves history. A student archive hides their
              enrollments from active lists without changing individual
              enrollment archive flags. Restoring the student preserves those
              separate flags. Archive active enrollments before archiving a
              class or subject.
            </p>
          </details>
          <details>
            <summary>What if a save result is unknown?</summary>
            <p>
              Keep this tab open. Editing is locked until you recover the saved
              result or retry the same request. The action reference prevents
              duplicate saves. Private drafts are tab-scoped and cleared when
              you sign out or change accounts.
            </p>
          </details>
          <details>
            <summary>What if someone else edits the record?</summary>
            <p>
              A stale version is rejected. Your draft remains visible. Reload
              and review the updated record before saving again. Avoid copying
              old changes over newer information without checking it.
            </p>
          </details>
          <details>
            <summary>Can I change an enrolled class or subject?</summary>
            <p>
              To protect academic history, create a new class or curriculum
              subject for a new academic group. Existing enrollments retain
              their original references. Unused records can be edited.
            </p>
          </details>
          <details>
            <summary>Why are some original catalog items missing?</summary>
            <p>
              The recovered code contains conflicting labels, missing
              descriptions and an unsupported course spelling. Those entries are
              held out rather than guessed. An authorized staff member can add
              confirmed curriculum subjects.
            </p>
          </details>
        </section>
        <section className="card help" id="grading">
          <div className="eyebrow">Automatic computation</div>
          <h2>The General Average</h2>
          <div className="formula">
            Sum of Monthly, First prelim, Second prelim, Midterm, Pre-final and
            Final ÷ 6
          </div>
          <p>
            All six scores are equally weighted. Scores range from 0 to 100 with
            up to two decimals. Empty means incomplete; explicit zero counts as
            a score.
          </p>
          <p>
            The raw mean rounds half-up to two decimals for display and
            independently to one decimal for classification.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Classification minimum</th>
                  <th>Equivalent</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["96.5", "1.00"],
                  ["93.5", "1.25"],
                  ["90.5", "1.50"],
                  ["87.5", "1.75"],
                  ["84.5", "2.00"],
                  ["81.5", "2.25"],
                  ["78.5", "2.50"],
                  ["75.5", "2.75"],
                  ["74.5", "3.00"],
                  ["Below 74.5", "5.00 — Failed"],
                ].map(([n, e]) => (
                  <tr key={n}>
                    <td>{n}</td>
                    <td>{e}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: 20 }}>
            Six 74.45 scores classify at 74.5 (3.00, Passed). Six 96.45 scores
            classify at 96.5 (1.00, Passed). Partial records have no final
            equivalent or remarks.
          </p>
          <p>
            This is the approved portfolio grading scale and is not presented as
            an institution’s official policy.
          </p>
          <Link to="/grades">Open grading sheets →</Link>
        </section>
      </div>
    </>
  );
}
