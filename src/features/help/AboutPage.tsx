import { Link } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
export function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Independent portfolio project"
        title="Records, thoughtfully reimagined."
        description="Registrix brings a recovered desktop school project into a connected web workspace."
      />
      <div className="grid2">
        <section className="card help">
          <h2>A new identity. A connected workflow.</h2>
          <p>
            Registrix uses original branding and the Studio Campus design: warm
            ivory, clear white surfaces and thoughtful violet accents. It is
            independent of St. Clare and is not an official school system.
          </p>
          <p>
            The React interface connects to Supabase authentication and a
            dedicated PostgreSQL database. Staff approval, class assignments,
            archival history and server-calculated grades protect the core
            student-record workflow.
          </p>
          <p>
            Only academic catalog labels were recovered from the legacy source.
            Original accounts, passwords, student records, the Access database
            and school artwork were not imported or redistributed.
          </p>
          <p>
            Developed as an academic portfolio project by Jomari M. Candido.
          </p>
          <Link to="/help">Explore the workspace guide →</Link>
        </section>
        <section className="card">
          <img
            src="/assets/illustrations/records-workspace.svg"
            alt="An organized workspace of student records and academic materials"
            style={{
              display: "block",
              maxWidth: "100%",
              maxHeight: 360,
              margin: "auto",
            }}
          />
          <h3 style={{ marginTop: 24 }}>Original Registrix artwork</h3>
          <p className="muted" style={{ marginTop: 10 }}>
            Logo, interface icons and illustration are included locally with
            their supplied reuse license. Typography uses system fonts; no
            external font downloads are required.
          </p>
        </section>
      </div>
    </>
  );
}
