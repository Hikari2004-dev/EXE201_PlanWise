import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BellRing,
  Briefcase,
  ChevronRight,
  Clock3,
  Flame,
  Sparkles,
  Target,
} from "lucide-react";
import { useData } from "../context/DataContext";

type NotificationTone = "indigo" | "rose" | "amber" | "emerald" | "violet";

type NotificationItem = {
  id: string;
  type: "time" | "deadline" | "habit" | "progress" | "goal";
  tone: NotificationTone;
  title: string;
  message: string;
  cta?: string;
  taskId?: number;
  habitId?: number;
  goalId?: number;
};

const PLAN_TODAY = new Date(2026, 2, 12);
const PLAN_TODAY_ISO = "2026-03-12";
const TODAY_DAY = "Thu";

const TONE_STYLES: Record<
  NotificationTone,
  { card: string; icon: string; badge: string; action: string; subtle: string }
> = {
  indigo: {
    card: "border-indigo-100 bg-indigo-50/70 dark:border-indigo-400/20 dark:bg-indigo-500/10",
    icon: "bg-indigo-500 text-white",
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-100",
    action: "bg-indigo-600 hover:bg-indigo-700 text-white",
    subtle: "border-indigo-200 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-400/25 dark:text-indigo-100 dark:hover:bg-indigo-400/12",
  },
  rose: {
    card: "border-rose-100 bg-rose-50/70 dark:border-rose-400/20 dark:bg-rose-500/10",
    icon: "bg-rose-500 text-white",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-100",
    action: "bg-rose-600 hover:bg-rose-700 text-white",
    subtle: "border-rose-200 text-rose-700 hover:bg-rose-100 dark:border-rose-400/25 dark:text-rose-100 dark:hover:bg-rose-400/12",
  },
  amber: {
    card: "border-amber-100 bg-amber-50/80 dark:border-amber-400/20 dark:bg-amber-500/10",
    icon: "bg-amber-500 text-white",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-100",
    action: "bg-amber-500 hover:bg-amber-600 text-white",
    subtle: "border-amber-200 text-amber-700 hover:bg-amber-100 dark:border-amber-400/25 dark:text-amber-100 dark:hover:bg-amber-400/12",
  },
  emerald: {
    card: "border-emerald-100 bg-emerald-50/80 dark:border-emerald-400/20 dark:bg-emerald-500/10",
    icon: "bg-emerald-500 text-white",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-100",
    action: "bg-emerald-600 hover:bg-emerald-700 text-white",
    subtle: "border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-400/25 dark:text-emerald-100 dark:hover:bg-emerald-400/12",
  },
  violet: {
    card: "border-violet-100 bg-violet-50/80 dark:border-violet-400/20 dark:bg-violet-500/10",
    icon: "bg-violet-500 text-white",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-100",
    action: "bg-violet-600 hover:bg-violet-700 text-white",
    subtle: "border-violet-200 text-violet-700 hover:bg-violet-100 dark:border-violet-400/25 dark:text-violet-100 dark:hover:bg-violet-400/12",
  },
};

function parseViDate(dateStr: string) {
  if (!dateStr?.includes("Th")) return PLAN_TODAY;
  const [day, month] = dateStr.split(" Th");
  return new Date(2026, parseInt(month, 10) - 1, parseInt(day, 10));
}

function getEventStatus(startHour: number, startMin: number, duration: number) {
  const now = new Date();
  const nowDecimal = now.getHours() + now.getMinutes() / 60;
  const startDecimal = startHour + startMin / 60;
  const endDecimal = startDecimal + duration;

  if (nowDecimal >= startDecimal && nowDecimal <= endDecimal) return "live";
  if (startDecimal > nowDecimal && startDecimal - nowDecimal <= 2) return "upcoming";
  return "idle";
}

export function NotificationCenter() {
  const { events, tasks, habits, goals, updateTask, toggleHabitDate, updateGoal, language } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];

    const todayEvents = events
      .filter((event) => event.day === TODAY_DAY)
      .sort((a, b) => a.startHour - b.startHour || a.startMin - b.startMin);

    const activeEvent = todayEvents.find((event) => getEventStatus(event.startHour, event.startMin, event.duration) === "live");
    const upcomingEvent = todayEvents.find((event) => getEventStatus(event.startHour, event.startMin, event.duration) === "upcoming");
    const dueTodayTask = tasks.find((task) => !task.completed && task.dueDate === "12 Th3");
    const overdueTask = tasks
      .filter((task) => !task.completed && parseViDate(task.dueDate) < PLAN_TODAY)
      .sort((a, b) => parseViDate(a.dueDate).getTime() - parseViDate(b.dueDate).getTime())[0];
    const habitReminder = habits.find((habit) => !habit.completedDates.includes(PLAN_TODAY_ISO));
    const progressReminder = tasks.find((task) => !task.completed && task.priority === "Cao");
    const goalReminder = goals
      .filter((goal) => goal.progress < 60)
      .sort((a, b) => a.progress - b.progress)[0];

    if (activeEvent) {
      items.push({
        id: `event-live-${activeEvent.id}`,
        type: "time",
        tone: "indigo",
        title: language === "vi" ? "Đã đến giờ sự kiện" : "It's time",
        message:
          language === "vi"
            ? `⏰ Đã đến giờ ${activeEvent.title.toLowerCase()}! Hãy chuẩn bị và vào việc thôi.`
            : `It's time for ${activeEvent.title}. Get ready and jump in.`,
        cta: language === "vi" ? "Đang diễn ra" : "Live now",
      });
    } else if (upcomingEvent) {
      const minuteText = `${String(upcomingEvent.startHour).padStart(2, "0")}:${String(upcomingEvent.startMin).padStart(2, "0")}`;
      items.push({
        id: `event-upcoming-${upcomingEvent.id}`,
        type: "time",
        tone: "indigo",
        title: language === "vi" ? "Nhắc nhở theo thời gian" : "Time reminder",
        message:
          language === "vi"
            ? `📌 Nhắc bạn: ${upcomingEvent.title} sẽ bắt đầu lúc ${minuteText}. ${upcomingEvent.location ? `Địa điểm: ${upcomingEvent.location}.` : ""}`
            : `Reminder: ${upcomingEvent.title} starts at ${minuteText}.`,
        cta: language === "vi" ? "Sắp diễn ra" : "Coming up",
      });
    }

    if (dueTodayTask) {
      items.push({
        id: `task-today-${dueTodayTask.id}`,
        type: "deadline",
        tone: "amber",
        title: language === "vi" ? "Nhắc công việc hôm nay" : "Today's task reminder",
        message:
          language === "vi"
            ? `📌 Nhắc bạn: ${dueTodayTask.title} cần được hoàn thành trong hôm nay. Nếu đây là báo cáo cuối ngày, nhớ chốt trước 17:00 nhé.`
            : `Reminder: ${dueTodayTask.title} is due today.`,
        taskId: dueTodayTask.id,
        cta: language === "vi" ? "Hôm nay" : "Due today",
      });
    }

    if (overdueTask) {
      items.push({
        id: `task-overdue-${overdueTask.id}`,
        type: "deadline",
        tone: "rose",
        title: language === "vi" ? "Công việc đã quá hạn" : "Overdue task",
        message:
          language === "vi"
            ? `Task "${overdueTask.title}" đã qua deadline ${overdueTask.dueDate}. Bạn đã hoàn thành việc này chưa?`
            : `"${overdueTask.title}" is overdue. Have you finished it yet?`,
        taskId: overdueTask.id,
        cta: overdueTask.dueDate,
      });
    }

    if (habitReminder) {
      items.push({
        id: `habit-${habitReminder.id}`,
        type: "habit",
        tone: "emerald",
        title: language === "vi" ? "Nhắc nhở thói quen" : "Habit reminder",
        message:
          language === "vi"
            ? `🌱 Hôm nay bạn chưa đánh dấu "${habitReminder.title}". Hoàn thành ngay để giữ chuỗi ${habitReminder.currentStreak} ngày nhé.`
            : `You haven't marked "${habitReminder.title}" today yet.`,
        habitId: habitReminder.id,
        cta: language === "vi" ? "Giữ chuỗi" : "Keep streak",
      });
    }

    if (progressReminder) {
      items.push({
        id: `progress-${progressReminder.id}`,
        type: "progress",
        tone: "violet",
        title: language === "vi" ? "Nhắc theo tiến độ công việc" : "Progress reminder",
        message:
          language === "vi"
            ? `🚀 Bạn vẫn còn việc ưu tiên cao "${progressReminder.title}" chưa xong. Nếu xử lý trước, bảng điều khiển sẽ nhẹ hơn rất nhiều.`
            : `You still have a high-priority task pending: "${progressReminder.title}".`,
        taskId: progressReminder.id,
        cta: language === "vi" ? "Ưu tiên cao" : "High priority",
      });
    }

    if (goalReminder) {
      items.push({
        id: `goal-${goalReminder.id}`,
        type: "goal",
        tone: "amber",
        title: language === "vi" ? "Nhắc nhở mục tiêu dài hạn" : "Long-term goal reminder",
        message:
          language === "vi"
            ? `🎯 Mục tiêu "${goalReminder.title}" mới ở mức ${goalReminder.progress}%. Đây là lúc dành một bước nhỏ để mục tiêu dài hạn không bị chìm trong việc ngắn hạn.`
            : `Your long-term goal "${goalReminder.title}" is currently at ${goalReminder.progress}%.`,
        goalId: goalReminder.id,
        cta: `${goalReminder.progress}%`,
      });
    }

    return items;
  }, [events, goals, habits, language, tasks]);

  const visibleNotifications = notifications.filter((item) => !hiddenIds.includes(item.id));

  const hideNotification = (id: string) => {
    setHiddenIds((prev) => [...prev, id]);
  };

  const handleTaskDone = (id: string, taskId?: number) => {
    if (!taskId) return;
    updateTask(taskId, { completed: true });
    hideNotification(id);
  };

  const handleTaskPending = (id: string) => {
    hideNotification(id);
  };

  const handleHabitComplete = (id: string, habitId?: number) => {
    if (!habitId) return;
    toggleHabitDate(habitId, PLAN_TODAY_ISO);
    hideNotification(id);
  };

  const handleGoalBoost = (id: string, goalId?: number) => {
    if (!goalId) return;
    const targetGoal = goals.find((goal) => goal.id === goalId);
    if (!targetGoal) return;
    updateGoal(goalId, { progress: Math.min(100, targetGoal.progress + 10) });
    hideNotification(id);
  };

  const getItemIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "time":
        return <Clock3 size={16} />;
      case "deadline":
        return <Briefcase size={16} />;
      case "habit":
        return <Flame size={16} />;
      case "progress":
        return <Sparkles size={16} />;
      case "goal":
        return <Target size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative h-12 w-12 rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
        aria-label={language === "vi" ? "Mở thông báo" : "Open notifications"}
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-rose-50 dark:from-indigo-500/10 dark:via-slate-900 dark:to-rose-500/10" />
        <div className="relative flex h-full w-full items-center justify-center">
          {visibleNotifications.length > 0 ? (
            <BellRing className="h-5 w-5 text-indigo-600" />
          ) : (
            <Bell className="h-5 w-5 text-slate-500 dark:text-slate-200" />
          )}
        </div>
        {visibleNotifications.length > 0 && (
          <>
            <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-1.5 text-[10px] font-bold text-white shadow-lg shadow-rose-200">
              {visibleNotifications.length}
            </span>
            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-rose-400 ring-4 ring-rose-100 animate-pulse" />
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-16 z-50 w-[400px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.3)] dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-5 py-4 text-white dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold tracking-tight">
                  {language === "vi" ? "Trung tâm thông báo" : "Notification Center"}
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  {language === "vi"
                    ? "Nhắc nhở từ lịch, công việc, thói quen và mục tiêu của bạn."
                    : "Smart alerts from your schedule, tasks, habits, and goals."}
                </p>
              </div>
              <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                {visibleNotifications.length} {language === "vi" ? "mục" : "items"}
              </div>
            </div>
          </div>

          <div className="max-h-[520px] overflow-y-auto p-4 dark:bg-slate-950/70">
            {visibleNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900">
                <Bell className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-500" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                  {language === "vi" ? "Hiện chưa có thông báo mới" : "No new notifications"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400 dark:text-slate-300">
                  {language === "vi"
                    ? "Khi có việc cần chú ý, thói quen chưa đánh dấu hoặc deadline sắp tới, bạn sẽ thấy chúng ở đây."
                    : "Upcoming reminders and alerts will appear here."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleNotifications.map((item) => {
                  const styles = TONE_STYLES[item.tone];

                  return (
                    <div key={item.id} className={`rounded-2xl border p-4 ${styles.card}`}>
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${styles.icon}`}>
                          {getItemIcon(item.type)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-slate-50">{item.title}</p>
                              <p className="mt-1 text-[13px] leading-relaxed text-slate-600 dark:text-slate-200">{item.message}</p>
                            </div>
                            {item.cta && (
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${styles.badge}`}>
                                {item.cta}
                              </span>
                            )}
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.type === "deadline" && item.taskId && (
                              <>
                                <button
                                  onClick={() => handleTaskDone(item.id, item.taskId)}
                                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${styles.action}`}
                                >
                                  {language === "vi" ? "Đã hoàn thành" : "Mark done"}
                                </button>
                                <button
                                  onClick={() => handleTaskPending(item.id)}
                                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${styles.subtle}`}
                                >
                                  {language === "vi" ? "Chưa xong" : "Not yet"}
                                </button>
                              </>
                            )}

                            {item.type === "habit" && item.habitId && (
                              <button
                                onClick={() => handleHabitComplete(item.id, item.habitId)}
                                className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${styles.action}`}
                              >
                                {language === "vi" ? "Đánh dấu hôm nay" : "Mark today"}
                              </button>
                            )}

                            {item.type === "goal" && item.goalId && (
                              <button
                                onClick={() => handleGoalBoost(item.id, item.goalId)}
                                className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${styles.action}`}
                              >
                                {language === "vi" ? "Tăng tiến độ +10%" : "Boost +10%"}
                              </button>
                            )}

                            {(item.type === "time" || item.type === "progress") && (
                              <button
                                onClick={() => hideNotification(item.id)}
                                className={`inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${styles.subtle}`}
                              >
                                {language === "vi" ? "Đã xem" : "Dismiss"} <ChevronRight size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
