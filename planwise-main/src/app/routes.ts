import { createHashRouter } from "react-router";
import { Layout } from "./components/Layout";
import { DashboardView } from "./components/DashboardView";
import { WeeklyView } from "./components/WeeklyView";
import { MonthlyView } from "./components/MonthlyView";
import { TasksView } from "./components/TasksView";
import { GoalsView } from "./components/GoalsView";
import { HabitsView } from "./components/HabitsView";
import { AnalyticsView } from "./components/AnalyticsView";

export const router = createHashRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: DashboardView },
      { path: "timetable", Component: WeeklyView },
      { path: "calendar", Component: MonthlyView },
      { path: "tasks", Component: TasksView },
      { path: "goals", Component: GoalsView },
      { path: "habits", Component: HabitsView },
      { path: "analytics", Component: AnalyticsView },
    ],
  },
]);
