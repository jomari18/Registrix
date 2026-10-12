import { useEffect, useId, useRef } from "react";
import { Button } from "./Button";
export function ConfirmationDialog({
  open,
  title,
  message,
  busy = false,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  danger = false,
}: {
  open: boolean;
  title: string;
  message: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  danger?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    cancel = useRef<HTMLButtonElement>(null),
    titleId = useId(),
    descriptionId = useId();
  useEffect(() => {
    const el = dialog.current!;
    if (open && !el.open) {
      const focused = document.activeElement as HTMLElement | null;
      el.showModal();
      cancel.current?.focus();
      return () => {
        el.close();
        focused?.focus();
      };
    }
    if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className="dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id={titleId}>{title}</h2>
      <p id={descriptionId}>{message}</p>
      <div className="actions">
        <button
          ref={cancel}
          className="btn secondary"
          disabled={busy}
          onClick={onCancel}
        >
          Cancel
        </button>
        <Button
          variant={danger ? "danger" : ""}
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? "Working…" : confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
