import { AlertTriangle, CheckCircle2, ClipboardList, Sparkles, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";
import type { PlannerDraftPlan, PlannerEventDraft, PlannerHabitDraft, PlannerTaskDraft } from "../../api";
import { PreviewCard } from "./PreviewCard";
import { SummarySection } from "./SummarySection";

interface PreviewPanelProps {
  plan: PlannerDraftPlan | null;
  language: "vi" | "en";
  isLoading: boolean;
  loadingText: string;
  error: string | null;
  isApplying: boolean;
  applied: boolean;
  onUpdateEvent: (index: number, item: PlannerEventDraft) => void;
  onUpdateTask: (index: number, item: PlannerTaskDraft) => void;
  onUpdateHabit: (index: number, item: PlannerHabitDraft) => void;
  onDeleteItem: (kind: "events" | "tasks" | "habits", index: number) => void;
  onApply: () => void;
  onCancel: () => void;
}

export function PreviewPanel({
  plan,
  language,
  isLoading,
  loadingText,
  error,
  isApplying,
  applied,
  onUpdateEvent,
  onUpdateTask,
  onUpdateHabit,
  onDeleteItem,
  onApply,
  onCancel,
}: PreviewPanelProps) {
  const warnings = plan ? getWarnings(plan, language) : [];
  const events = plan?.events || [];
  const tasks = plan?.tasks || [];
  const habits = plan?.habits || [];
  const hasPlan = events.length > 0 || tasks.length > 0 || habits.length > 0;
  const hasDraft = !!plan;

  return (
    <section className="flex min-h-[420px] flex-col border-t border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/60 lg:border-l lg:border-t-0">
      <div className="border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {language === "vi" ? "Bản xem trước kế hoạch" : "Planning Preview"}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {hasPlan
                ? language === "vi"
                  ? "Chỉnh sửa bản nháp trước khi áp dụng"
                  : "Edit the draft before applying"
                : language === "vi"
                  ? "Kế hoạch AI sẽ xuất hiện tại đây"
                  : "The generated plan will appear here"}
            </p>
          </div>
          {applied && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200">
              <CheckCircle2 size={13} />
              {language === "vi" ? "Đã áp dụng" : "Applied"}
            </span>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed border-indigo-200 bg-white text-center dark:border-indigo-500/25 dark:bg-slate-950">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-200">
              <Sparkles className="animate-pulse" size={22} />
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{loadingText}</p>
            <div className="mt-4 flex gap-1.5">
              <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.2s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.1s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-amber-500" />
            </div>
          </div>
        ) : !hasDraft ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white px-6 text-center dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-300">
              <ClipboardList size={22} />
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {language === "vi" ? "Chưa có bản nháp" : "No draft yet"}
            </p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {language === "vi"
                ? "Gửi một yêu cầu ở bên trái, Planner Assistant sẽ tạo preview gồm sự kiện, công việc và thói quen để bạn duyệt trước."
                : "Send a request on the left, and Planner Assistant will preview events, tasks, and habits before anything is created."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <SummarySection plan={plan} language={language} />

            {warnings.length > 0 && (
              <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100">
                <AlertTriangle />
                <AlertTitle>{language === "vi" ? "Cảnh báo" : "Warnings"}</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4">
                    {warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {!hasPlan && (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-6 text-center dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {language === "vi" ? "Không có mục nào cần áp dụng" : "No items to apply"}
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {language === "vi"
                    ? "Planner Assistant không tạo mục mới hoặc cập nhật nào cho yêu cầu này."
                    : "Planner Assistant did not create or update anything for this request."}
                </p>
              </div>
            )}

            {hasPlan && <div className="space-y-5">
              {events.length > 0 && (
                <PreviewGroup title={language === "vi" ? "Sự kiện" : "Events"}>
                  {events.map((event, index) => (
                    <PreviewCard
                      key={`event-${index}`}
                      kind="event"
                      item={event}
                      language={language}
                      disabled={isApplying || applied}
                      onChange={(item) => onUpdateEvent(index, item)}
                      onDelete={() => onDeleteItem("events", index)}
                    />
                  ))}
                </PreviewGroup>
              )}
              {tasks.length > 0 && (
                <PreviewGroup title={language === "vi" ? "Công việc" : "Tasks"}>
                  {tasks.map((task, index) => (
                    <PreviewCard
                      key={`task-${index}`}
                      kind="task"
                      item={task}
                      language={language}
                      disabled={isApplying || applied}
                      onChange={(item) => onUpdateTask(index, item)}
                      onDelete={() => onDeleteItem("tasks", index)}
                    />
                  ))}
                </PreviewGroup>
              )}
              {habits.length > 0 && (
                <PreviewGroup title={language === "vi" ? "Thói quen" : "Habits"}>
                  {habits.map((habit, index) => (
                    <PreviewCard
                      key={`habit-${index}`}
                      kind="habit"
                      item={habit}
                      language={language}
                      disabled={isApplying || applied}
                      onChange={(item) => onUpdateHabit(index, item)}
                      onDelete={() => onDeleteItem("habits", index)}
                    />
                  ))}
                </PreviewGroup>
              )}
            </div>}
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle />
            <AlertTitle>{language === "vi" ? "Không thể tạo kế hoạch" : "Could not build plan"}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X size={15} />
          {language === "vi" ? "Đóng" : "Cancel"}
        </Button>
        <Button type="button" disabled={!hasPlan || isLoading || isApplying || applied} onClick={onApply} className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200">
          <CheckCircle2 size={15} />
          {isApplying
            ? language === "vi" ? "Đang áp dụng..." : "Applying..."
            : language === "vi" ? "Áp dụng kế hoạch" : "Apply Plan"}
        </Button>
      </div>
    </section>
  );
}

function PreviewGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function getWarnings(plan: PlannerDraftPlan, language: "vi" | "en") {
  const warnings = [...(plan.warnings || [])];
  const eventsByDate = new Map<string, PlannerEventDraft[]>();

  (plan.events || []).forEach((event) => {
    if (!event.eventDate) return;
    const current = eventsByDate.get(event.eventDate) || [];
    current.push(event);
    eventsByDate.set(event.eventDate, current);
  });

  eventsByDate.forEach((events, date) => {
    const sorted = [...events].sort((a, b) => toStartMinutes(a) - toStartMinutes(b));
    const totalHours = sorted.reduce((sum, event) => sum + (event.duration || 0), 0);
    if (totalHours > 8) {
      warnings.push(language === "vi" ? `${date} có khối lượng lịch khá dày.` : `${date} has a heavy schedule.`);
    }
    for (let i = 1; i < sorted.length; i += 1) {
      const previousEnd = toStartMinutes(sorted[i - 1]) + (sorted[i - 1].duration || 0) * 60;
      if (toStartMinutes(sorted[i]) < previousEnd) {
        warnings.push(language === "vi" ? `${date} có hai sự kiện bị chồng giờ.` : `${date} has overlapping events.`);
        break;
      }
    }
  });

  return Array.from(new Set(warnings));
}

function toStartMinutes(event: PlannerEventDraft) {
  return (event.startHour || 0) * 60 + (event.startMin || 0);
}
