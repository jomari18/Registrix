import type { GradeResult } from "../../domain/contracts";
export function GradeResultSummary({
  result,
  label,
}: {
  result: GradeResult;
  label: string;
}) {
  return (
    <section aria-label={label} className="result-grid">
      <div className="result">
        <small>General Average</small>
        <strong>{result.generalAverage ?? "—"}</strong>
        <small>
          {result.status === "complete"
            ? "Equal mean of six periods"
            : "Incomplete · all six needed"}
        </small>
      </div>
      <div className="result">
        <small>Numerical equivalent</small>
        <strong>{result.numericalEquivalent ?? "—"}</strong>
        <small>
          {result.classificationAverage
            ? "Classified at " + result.classificationAverage
            : "No classification yet"}
        </small>
      </div>
      <div
        className={`result ${result.remarks === "Passed" ? "success" : result.remarks === "Failed" ? "danger" : ""}`}
      >
        <small>Remarks</small>
        <strong>{result.remarks ?? "Incomplete"}</strong>
        <small>
          {result.status === "complete"
            ? "Calculated by the approved scale"
            : "Draft can be saved"}
        </small>
      </div>
    </section>
  );
}
