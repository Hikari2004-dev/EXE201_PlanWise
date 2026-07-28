import { createElement } from "react";
import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { DashboardView } from "./components/DashboardView";
import { WeeklyView } from "./components/WeeklyView";
import { TasksView } from "./components/TasksView";
import { GoalsView } from "./components/GoalsView";
import { HabitsView } from "./components/HabitsView";
import { AnalyticsView } from "./components/AnalyticsView";
import { RegisterPage } from "./components/RegisterPage";
import { AuthCallback } from "./components/AuthCallback";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PricingPage } from "./components/PricingPage";
import { PaymentResultPage } from "./components/PaymentResultPage";
import { AdminDashboard } from "./components/AdminDashboard";
import HomePage from "./components/Homepage";
import { LoginPage } from "./components/LoginPage";
import { VerifyEmailPage } from "./components/VerifyEmailPage";
import { ForgotPasswordPage } from "./components/ForgotPasswordPage";
import { ResetPasswordPage } from "./components/ResetPasswordPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: HomePage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
  },
  {
    path: "/verify-email",
    Component: VerifyEmailPage,
  },
  {
    path: "/forgot-password",
    Component: ForgotPasswordPage,
  },
  {
    path: "/reset-password",
    Component: ResetPasswordPage,
  },
  {
    path: "/auth/callback",
    Component: AuthCallback,
  },
  {
    path: "/dashboard",
    element: createElement(ProtectedRoute, null, createElement(Layout)),
    children: [
      { index: true, Component: DashboardView },
      { path: "timetable", Component: WeeklyView },
      { path: "calendar", Component: WeeklyView },
      { path: "tasks", Component: TasksView },
      { path: "goals", Component: GoalsView },
      { path: "habits", Component: HabitsView },
      { path: "analytics", Component: AnalyticsView },
      { path: "pricing", Component: PricingPage },
      { path: "admin", Component: AdminDashboard },
    ],
  },
  {
    path: "/payment/result",
    Component: PaymentResultPage,
  },
]);
