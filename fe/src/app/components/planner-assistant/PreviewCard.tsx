import { CalendarDays, CheckSquare, Clock, MapPin, Repeat2 } from "lucide-react";
import type { PlannerEventDraft, PlannerHabitDraft, PlannerTaskDraft } from "../../api";

type PreviewCardProps =
  | { kind: "event"; item: PlannerEventDraft; language: "vi" | "en" }
  | { kind: "task"; item: PlannerTaskDraft; language: "vi" | "en" }
  | { kind: "habit"; item: PlannerHabitDraft; language: "vi" | "en" };

const priorityClasses: Record<string, string> = {
  HIGH: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200",
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200",
};

export function PreviewCard(props: PreviewCardProps) {
  if (props.kind === "event") {
    const item = props.item;
    return (
      <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200">
            <CalendarDays size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h4 className="line-clamp-2 text-sm font-bold text-slate-900 dark:text-slate-100">{item.title}</h4>
              <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-200">
                {props.language === "vi" ? "Sự kiện" : "Event"}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Clock size={12} />
                {formatEventTime(item)}
              </span>
              {item.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} />
                  {item.location}
                </span>
              )}
            </div>
            {item.notes && <p className="mt-2 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{item.notes}</p>}
          </div>
        </div>
      </article>
    );
  }

  if (props.kind === "task") {
    const item = props.item;
    const normalizedPriority = (item.priority || "MEDIUM").toUpperCase();
    return (
      <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200">
            <CheckSquare size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h4 className="line-clamp-2 text-sm font-bold text-slate-900 dark:text-slate-100">{item.title}</h4>
              <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${priorityClasses[normalizedPriority] || priorityClasses.MEDIUM}`}>
                {priorityLabel(normalizedPriority, props.language)}
              </span>
            </div>
            {item.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{item.description}</p>}
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
              {(item.scheduledAt || item.dueDate) && (
                <span className="inline-flex items-center gap-1">
                  <Clock size={12} />
                  {formatDateTime(item.scheduledAt || item.dueDate)}
                </span>
              )}
              {item.estimatedTime ? <span>{item.estimatedTime}m</span> : null}
            </div>
          </div>
        </div>
      </article>
    );
  }

  const item = props.item;
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-200">
          <Repeat2 size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h4 className="line-clamp-2 text-sm font-bold text-slate-900 dark:text-slate-100">{item.title}</h4>
            <span className="rounded-md border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
              {frequencyLabel(item.frequency, props.language)}
            </span>
          </div>
          {item.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{item.description}</p>}
          {item.repeatDays?.length ? (
            <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{item.repeatDays.join(", ")}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function formatEventTime(item: PlannerEventDraft) {
  const date = item.eventDate || "";
  const hour = String(item.startHour ?? 0).padStart(2, "0");
  const minute = String(item.startMin ?? 0).padStart(2, "0");
  return `${date} ${hour}:${minute}`;
}

function formatDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date).replace(",", "");
}

function priorityLabel(value: string, language: "vi" | "en") {
  if (language === "en") return value.charAt(0) + value.slice(1).toLowerCase();
  if (value === "HIGH") return "Cao";
  if (value === "LOW") return "Thấp";
  return "Trung bình";
}

function frequencyLabel(value: PlannerHabitDraft["frequency"], language: "vi" | "en") {
  if (language === "en") return value || "daily";
  if (value === "weekly") return "Hàng tuần";
  if (value === "monthly") return "Hàng tháng";
  return "Hàng ngày";
}
