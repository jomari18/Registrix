import { useEffect, useRef } from "react";
import { useBlocker } from "react-router-dom";
import { ConfirmationDialog } from "../components/ConfirmationDialog";
export function useUnsavedChanges(dirty: boolean) {
  const allowed = useRef(false),
    blocker = useBlocker(
      ({ currentLocation, nextLocation }) =>
        dirty &&
        !allowed.current &&
        currentLocation.pathname + currentLocation.search !==
          nextLocation.pathname + nextLocation.search,
    );
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (dirty && !allowed.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [dirty]);
  return {
    allowNavigation: () => {
      allowed.current = true;
    },
    dialog: (
      <ConfirmationDialog
        open={blocker.state === "blocked"}
        title="Leave your unsaved changes?"
        message="Your changes have not been saved to the workspace. Leave this page only when you’re ready to discard this draft. Unresolved saves remain recoverable in this tab."
        confirmLabel="Leave page"
        onCancel={() => {
          if (blocker.state === "blocked") blocker.reset();
        }}
        onConfirm={() => {
          if (blocker.state === "blocked") blocker.proceed();
        }}
      />
    ),
  };
}
