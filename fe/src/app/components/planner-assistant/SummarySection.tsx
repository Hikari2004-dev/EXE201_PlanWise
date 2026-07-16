import { CalendarDays, CheckSquare, Clock, Repeat2 } from "lucide-react";
import type { PlannerDraftPlan } from "../../api";

interface SummarySectionProps {
  plan: PlannerDraftPlan;
  language: "vi" | "en";
}

export function SummarySection({ plan, language }: SummarySectionProps) {
  const events = plan.events || [];
  const tasks = plan.tasks || [];
  const habits = plan.habits || [];
  const eventMinutes = events.reduce((sum, event) => sum + Math.round((event.duration || 0) * 60), 0);
  const taskMinutes = tasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0);
  const totalMinutes = eventMinutes + taskMinutes;

  const items = [
    {
      label: language === "vi" ? "Sự kiện" : "Events",
      value: events.length,
      icon: CalendarDays,
      className: "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-200",
    },
    {
      label: language === "vi" ? "Công việc" : "Tasks",
      value: tasks.length,
      icon: CheckSquare,
      className: "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200",
    },
    {
      label: language === "vi" ? "Thói quen" : "Habits",
      value: habits.length,
      icon: Repeat2,
      className: "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200",
    },
  ];

  return (
    <div className="space-y-3">
      {plan.summary && (
        <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          {plan.summary}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map(({ label, value, icon: Icon, className }) => (
          <div key={label} className={`rounded-md border px-3 py-2 ${className}`}>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Icon size={14} />
              {label}
            </div>
            <div className="mt-1 text-xl font-black">{value}</div>
          </div>
        ))}
        {totalMinutes > 0 && (
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Clock size={14} />
              {language === "vi" ? "Khối lượng" : "Workload"}
            </div>
            <div className="mt-1 text-xl font-black">{formatMinutes(totalMinutes)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`;
}
