import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { ButtonLink } from "../../components/Button";
import { Icon } from "../../components/Icon";
import { Field } from "../../components/Field";
import { Pagination } from "../../components/Pagination";
import { QueryState, EmptyState } from "../../components/QueryState";
import { useQuery } from "../../hooks/useQuery";
import { useAuth } from "../auth/AuthProvider";
import { classesApi } from "./api";
import { AcademicFields } from "./AcademicFields";
import { CatalogPage } from "./CatalogPage";
export function ClassList() {
  const [params] = useSearchParams(),
    manage = useAuth().access?.role !== "teacher";
  return params.get("view") === "catalog" && manage ? (
    <CatalogPage />
  ) : (
    <ClassRecords />
  );
}
function ClassRecords() {
  const [filters, setFilters] = useState({
      course: "",
      year_level: "",
      semester: "",
    }),
    [search, setSearch] = useState(""),
    [archived, setArchived] = useState(false),
    [page, setPage] = useState(1),
    manage = useAuth().access?.role !== "teacher",
    request = {
      ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
      search,
      archived,
      page,
    },
    q = useQuery(["classes", request], () => classesApi.list(request));
  return (
    <>
      <PageHeader
        eyebrow="Class workspace"
        title="A place for every class."
        description="Organize subjects, academic groups and the students who bring them to life."
      >
        {manage && (
          <>
            <ButtonLink to="/classes?view=catalog" variant="secondary">
              Subject catalog
            </ButtonLink>
            <ButtonLink to="/classes/new">
              <Icon name="plus" />
              Add class
            </ButtonLink>
          </>
        )}
      </PageHeader>
      <section className="card">
        <div className="tabs" role="group" aria-label="Class visibility">
          <button
            className={!archived ? "active" : ""}
            onClick={() => {
              setArchived(false);
              setPage(1);
            }}
          >
            Active classes
          </button>
          {manage && (
            <button
              className={archived ? "active" : ""}
              onClick={() => {
                setArchived(true);
                setPage(1);
              }}
            >
              Archived classes
            </button>
          )}
        </div>
        <div className="filters">
          <Field
            label="Search classes"
            type="search"
            value={search}
            placeholder="Subject code or description"
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <AcademicFields
            course={filters.course}
            year={filters.year_level}
            semester={filters.semester}
            includeAll
            onChange={(key, value) => {
              setFilters({ ...filters, [key]: value });
              setPage(1);
            }}
          />
        </div>
        <QueryState query={q} />
        {q.data &&
          (q.data.items.length ? (
            <div className="class-grid">
              {q.data.items.map((c) => (
                <article className="card class-card" key={c.id}>
                  <span className="badge">
                    {c.course} · Year {c.year_level}
                  </span>
                  <h3>{c.subject.description}</h3>
                  <p>
                    {c.subject.code} · {c.subject.units} units
                  </p>
                  <p>
                    Section {c.section} · {c.semester} semester ·{" "}
                    {c.school_year}
                  </p>
                  <div className="actions">
                    <Link
                      className="btn secondary small"
                      to={"/classes/" + c.id}
                    >
                      Open class →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No classes here yet."
              description="Create a class or adjust the filters to find an academic group."
              icon="book"
            />
          ))}
        {q.data && (
          <Pagination page={page} total={q.data.total} onChange={setPage} />
        )}
      </section>
    </>
  );
}
