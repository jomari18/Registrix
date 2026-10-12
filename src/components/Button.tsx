import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
export function Button({
  children,
  variant = "",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) {
  return (
    <button className={`btn ${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}
export function ButtonLink({
  to,
  children,
  variant = "",
}: {
  to: string;
  children: ReactNode;
  variant?: string;
}) {
  return (
    <Link className={`btn ${variant}`} to={to}>
      {children}
    </Link>
  );
}
