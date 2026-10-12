import type { ReactNode } from "react";
export function StatusNotice({
  children,
  type = "info",
}: {
  children: ReactNode;
  type?: string;
}) {
  return (
    <div
      className={`notice ${type}`}
      role={type === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
