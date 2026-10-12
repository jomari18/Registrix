import { Button } from "./Button";
import { StatusNotice } from "./StatusNotice";
export function DraftConflict({
  latest,
  onDiscard,
}: {
  latest: unknown;
  onDiscard: () => void;
}) {
  return (
    <StatusNotice type="warning">
      <p>
        A newer record was saved while this draft was open. Your draft keeps its
        original version and cannot overwrite that record. Review the latest
        values before discarding your draft.
      </p>
      <details>
        <summary>Review latest saved values</summary>
        <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
          {JSON.stringify(latest, null, 2)}
        </pre>
      </details>
      <Button type="button" variant="secondary" onClick={onDiscard}>
        Discard draft and load latest
      </Button>
    </StatusNotice>
  );
}
