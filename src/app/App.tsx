import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from "react-router-dom";
import { AuthProvider, useAuth } from "../features/auth/AuthProvider";
import { canEnterWorkspace } from "../features/auth/policy";
import { AuthPage } from "../features/auth/AuthPage";
import { RegisterPage } from "../features/auth/RegisterPage";
import { VerifyPage } from "../features/auth/VerifyPage";
import { RecoveryPage } from "../features/auth/RecoveryPage";
import { ResetPage } from "../features/auth/ResetPage";
import { AccessPage } from "../features/auth/AccessPage";
import { AppShell } from "./AppShell";
import { config } from "../lib/config";
import { StudentList } from "../features/students/StudentList";
import { StudentDetail } from "../features/students/StudentDetail";
import { StudentForm } from "../features/students/StudentForm";
import { ClassList } from "../features/classes/ClassList";
import { ClassDetail } from "../features/classes/ClassDetail";
import { ClassForm } from "../features/classes/ClassForm";
import { GradeSheet } from "../features/grades/GradeSheet";
import { GradeEntry } from "../features/grades/GradeEntry";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { AccountsPage } from "../features/accounts/AccountsPage";
import { HelpPage } from "../features/help/HelpPage";
import { AboutPage } from "../features/help/AboutPage";
import "../styles/tokens.css";
import "../styles/app.css";
function Protected() {
  const a = useAuth();
  if (a.loading)
    return (
      <div className="loading" role="status">
        Opening your workspace…
      </div>
    );
  if (!a.user) return <Navigate to="/auth" replace />;
  if (
    !a.access ||
    !canEnterWorkspace(
      a.access.state,
      a.access.role,
      !!a.user.email_confirmed_at,
    )
  )
    return <Navigate to="/access" replace />;
  return <AppShell key={a.user.id} access={a.access} onSignOut={a.signOut} />;
}
function AccessRoute() {
  const a = useAuth();
  if (a.loading) return <div className="loading">Checking your access…</div>;
  return a.user ? <AccessPage /> : <Navigate to="/auth" replace />;
}
function AdminOnly() {
  return useAuth().access?.role === "administrator" ? (
    <Outlet />
  ) : (
    <Navigate to="/" replace />
  );
}
function ManagerOnly() {
  return useAuth().access?.role !== "teacher" ? (
    <Outlet />
  ) : (
    <Navigate to="/" replace />
  );
}
const router = createBrowserRouter([
  { path: "/auth", element: <AuthPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/verify", element: <VerifyPage /> },
  { path: "/forgot-password", element: <RecoveryPage /> },
  { path: "/reset-password", element: <ResetPage /> },
  { path: "/access", element: <AccessRoute /> },
  {
    element: <Protected />,
    children: [
      { path: "/", element: <DashboardPage /> },
      { path: "/students", element: <StudentList /> },
      { path: "/students/:id", element: <StudentDetail /> },
      { path: "/classes", element: <ClassList /> },
      { path: "/classes/:id", element: <ClassDetail /> },
      { path: "/grades", element: <GradeSheet /> },
      { path: "/grades/:enrollmentId", element: <GradeEntry /> },
      { path: "/help", element: <HelpPage /> },
      { path: "/about", element: <AboutPage /> },
      {
        element: <ManagerOnly />,
        children: [
          { path: "/students/new", element: <StudentForm /> },
          { path: "/students/:id/edit", element: <StudentForm /> },
          { path: "/classes/new", element: <ClassForm /> },
          { path: "/classes/:id/edit", element: <ClassForm /> },
        ],
      },
      {
        element: <AdminOnly />,
        children: [{ path: "/accounts", element: <AccountsPage /> }],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
export function App() {
  if (!config.configured)
    return (
      <main className="main">
        <section className="card access-card">
          <h1>Welcome to Registrix.</h1>
          <p>
            Add your dedicated Supabase Project URL and publishable key to the
            environment configuration, then restart the app.
          </p>
        </section>
      </main>
    );
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
