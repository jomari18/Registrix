import { useId } from "react";
export type ResultChoice = { id: string; title: string; detail: string };
export function ResultChoices({
  label,
  options,
  selected,
  onSelect,
  disabled = false,
  emptyText,
}: {
  label: string;
  options: ResultChoice[];
  selected: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
  emptyText: string;
}) {
  const group = useId();
  return (
    <fieldset className="choice-group" disabled={disabled}>
      <legend>{label}</legend>
      {options.length ? (
        <div className="choice-list">
          {options.map((option) => (
            <label
              key={option.id}
              className={
                "choice-row" + (selected === option.id ? " selected" : "")
              }
            >
              <input
                type="radio"
                name={group}
                value={option.id}
                checked={selected === option.id}
                onChange={() => onSelect(option.id)}
              />
              <span className="choice-copy">
                <strong>{option.title}</strong>
                <span>{option.detail}</span>
              </span>
              {selected === option.id && (
                <span className="choice-selected" aria-hidden="true">
                  Selected
                </span>
              )}
            </label>
          ))}
        </div>
      ) : (
        <p className="choice-empty" role="status">
          {emptyText}
        </p>
      )}
    </fieldset>
  );
}
