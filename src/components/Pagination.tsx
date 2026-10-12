import { Button } from "./Button";
export function Pagination({
  page,
  total,
  size = 20,
  onChange,
  disabled = false,
}: {
  page: number;
  total: number;
  size?: number;
  onChange: (page: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="table-footer">
      <span>
        {total
          ? `${(page - 1) * size + 1}–${Math.min(page * size, total)} of ${total} records`
          : "No records"}{" "}
        · Page {page}
      </span>
      <div className="actions">
        <Button
          variant="secondary small"
          disabled={disabled || page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="secondary small"
          disabled={disabled || page * size >= total}
          onClick={() => onChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
