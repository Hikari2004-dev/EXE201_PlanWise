import { useState } from "react";
import { Link } from "react-router";
import {
  TrendingUp, Clock, ArrowRight, Flame, MapPin, History, XCircle,
  CalendarDays, CheckCircle2, AlertTriangle, Zap, Tag
} from "lucide-react";
import { HintBubble } from "./HintBubble";
import { NotificationCenter } from "./NotificationCenter";
import { PlannerAssistantButton } from "./planner-assistant";
import { useData } from "../context/DataContext";
import { COLOR_MAP, getTimeString, type EventColor } from "../data/mockData";

const EVENT_COLORS: EventColor[] = ["indigo", "blue", "emerald", "amber", "rose", "purple", "teal", "orange"];

function normalizeEventColor(color?: string): EventColor {
  const normalized = (color || "indigo").toLowerCase();
  return EVENT_COLORS.includes(normalized as EventColor) ? (normalized as EventColor) : "indigo";
}

function parseScheduledAt(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getHabitStreakUnit(frequency: string, count: number, language: string) {
  if (language === "vi") {
    return frequency === "weekly" ? "tuần" : frequency === "monthly" ? "tháng" : "ngày";
  }

  const unit = frequency === "weekly" ? "week" : frequency === "monthly" ? "month" : "day";
  return count === 1 ? unit : `${unit}s`;
}

function getTaskStatus(task: { status?: string; completed: boolean; dueDate?: string }) {
  if (task.status) return task.status;
  if (task.completed) return "COMPLETED";
  const dueDate = parseTaskDueDate(task.dueDate);
  const now = new Date();
  if (dueDate && dueDate < now) return "MISSED";
  return "IN_PROGRESS";
}

function formatScheduledTaskTime(value?: string) {
  const parsed = parseScheduledAt(value);
  if (!parsed) return "";
  return parsed.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function parseTaskDueDate(value?: string) {
  if (!value) return null;
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    parsed.setHours(23, 59, 59, 999);
    return parsed;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatTaskDueDateLabel(value?: string) {
  const parsed = parseTaskDueDate(value);
  if (!parsed) return value || "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed).replace(",", "");
}

function CurrentTimeIndicator() {
  const now = new Date();
  const h = now.getHours(), m = now.getMinutes();
  const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
      </span>
      {dh}:{String(m).padStart(2, "0")} {h >= 12 ? "PM" : "AM"}
    </div>
  );
}

export function DashboardView() {
  const { events, tasks, habits, categories, updateTask, completeHabitDate, language } = useData();
  const [togglingHabitIds, setTogglingHabitIds] = useState<string[]>([]);
  const [completingTaskIds, setCompletingTaskIds] = useState<string[]>([]);
  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayDate = toLocalDateString(today);
  const todayCode = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][today.getDay()];
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const startOfWeekDate = toLocalDateString(startOfWeek);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const endOfWeekDate = toLocalDateString(endOfWeek);
  const monthPrefix = todayDate.slice(0, 7);

  const habitReminders = habits
    .filter((habit) => {
      const completedToday = habit.completedDates.includes(todayDate);

      if (habit.repeatDays.length > 0) {
        return habit.repeatDays.includes(todayCode) && !completedToday;
      }
      if (habit.frequency === "daily") return !completedToday;
      if (habit.frequency === "weekly") {
        return !habit.completedDates.some(date => date >= startOfWeekDate && date <= todayDate);
      }
      return !habit.completedDates.some(date => date.startsWith(monthPrefix));
    })
    .sort((a, b) => b.currentStreak - a.currentStreak || a.title.localeCompare(b.title))
    .slice(0, 5);

  const completeHabit = async (habitId: string) => {
    if (togglingHabitIds.includes(habitId)) return;
    setTogglingHabitIds(ids => [...ids, habitId]);
    try {
      await completeHabitDate(habitId, todayDate);
    } catch (error) {
      console.error("Failed to complete habit from dashboard:", error);
    } finally {
      setTogglingHabitIds(ids => ids.filter(id => id !== habitId));
    }
  };

  const completeUpcomingTask = async (taskId: string) => {
    if (completingTaskIds.includes(taskId)) return;
    setCompletingTaskIds(ids => [...ids, taskId]);
    try {
      await updateTask(taskId, { completed: true, status: "COMPLETED" });
    } catch (error) {
      console.error("Failed to complete task from dashboard:", error);
    } finally {
      setCompletingTaskIds(ids => ids.filter(id => id !== taskId));
    }
  };
  const todayEvents = events
    .filter((event) => event.eventDate?.slice(0, 10) === todayDate)
    .sort((a, b) => a.startHour - b.startHour || a.startMin - b.startMin);
  const todayScheduledTasks = tasks
    .filter((task) => !task.completed && task.showOnCalendar !== false)
    .filter((task) => {
      const scheduledAt = parseScheduledAt(task.scheduledAt);
      if (scheduledAt && isSameDay(scheduledAt, today)) return true;

      const dueDate = parseTaskDueDate(task.dueDate);
      return !scheduledAt && !!dueDate && isSameDay(dueDate, today);
    })
    .sort((a, b) => {
      const aScheduled = parseScheduledAt(a.scheduledAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bScheduled = parseScheduledAt(b.scheduledAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      if (aScheduled !== bScheduled) return aScheduled - bScheduled;
      const aDue = parseTaskDueDate(a.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bDue = parseTaskDueDate(b.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aDue - bDue;
    });

  const upcomingTasks = tasks
    .filter((task) => getTaskStatus(task) !== "COMPLETED")
    .sort((a, b) => {
      const aScheduled = parseScheduledAt(a.scheduledAt)?.getTime() || Number.MAX_SAFE_INTEGER;
      const bScheduled = parseScheduledAt(b.scheduledAt)?.getTime() || Number.MAX_SAFE_INTEGER;
      if (aScheduled !== bScheduled) return aScheduled - bScheduled;
      const aDue = parseTaskDueDate(a.dueDate)?.getTime() || Number.MAX_SAFE_INTEGER;
      const bDue = parseTaskDueDate(b.dueDate)?.getTime() || Number.MAX_SAFE_INTEGER;
      return aDue - bDue;
    })
    .slice(0, 5);
  const todayTimeline = [
    ...todayEvents.map((event) => ({
      kind: "event" as const,
      id: event.id,
      title: event.title,
      startHour: event.startHour,
      startMin: event.startMin,
      duration: event.duration,
      location: event.location,
      color: event.color,
      categoryId: event.categoryId,
    })),
    ...todayScheduledTasks.map((task) => {
      const scheduledAt = parseScheduledAt(task.scheduledAt);
      const dueDate = parseTaskDueDate(task.dueDate);
      const hasScheduledTime = !!scheduledAt;
      const sourceDate = scheduledAt || dueDate!;
      return {
        kind: "task" as const,
        id: task.id,
        title: task.title,
        startHour: sourceDate.getHours(),
        startMin: sourceDate.getMinutes(),
        duration: hasScheduledTime ? Math.max(0.5, (task.estimatedTime || 60) / 60) : 0.5,
        location: hasScheduledTime
          ? (language === "vi" ? "Task đã lên lịch" : "Scheduled task")
          : (language === "vi" ? "Hạn chót" : "Deadline"),
        color: task.categoryColor || task.color || "indigo",
        categoryId: task.categoryId,
      };
    }),
  ].sort((a, b) => a.startHour - b.startHour || a.startMin - b.startMin);
  const completedCount  = tasks.filter(t => getTaskStatus(t) === "COMPLETED").length;
  const weeklyEventCount = events.filter((event) => {
    const eventDate = event.eventDate?.slice(0, 10);
    return !!eventDate && eventDate >= startOfWeekDate && eventDate <= endOfWeekDate;
  }).length;
  const highPriority    = tasks.filter(t => getTaskStatus(t) !== "COMPLETED" && t.priority === "Cao").length;
  const completionRate  = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const delayedTasks = tasks.filter(t => {
    const dueDate = parseTaskDueDate(t.dueDate);
    return !t.completed && !!dueDate && dueDate < now;
  }).slice(0, 3);

  const categoryStats = categories.map(cat => {
    const catTasks = tasks.filter(t => t.categoryId === cat.id);
    const progress = catTasks.length > 0
      ? Math.round((catTasks.filter(t => t.completed).length / catTasks.length) * 100) : 0;
    return { ...cat, eventCount: events.filter(e => e.categoryId === cat.id).length, progress };
  }).slice(0, 6);

  const getGreeting = () => {
    const h = now.getHours();
    if (language === "vi") {
      if (h < 12) return "Chào buổi sáng ☀️";
      if (h < 18) return "Chào buổi chiều 🌤";
      return "Chào buổi tối 🌙";
    }
    if (h < 12) return "Good morning ☀️";
    if (h < 18) return "Good afternoon 🌤";
    return "Good evening 🌙";
  };

  const currentDateLabel = now.toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const missingTaskCount = tasks.filter((task) => getTaskStatus(task) === "MISSED").length;

  // KPI card configs with real color
  const kpiCards = [
    {
      label:   language === "vi" ? "Hôm nay" : "Today",
      value:   todayEvents.length + todayScheduledTasks.length,
      sub:     language === "vi" ? "Sự kiện + công việc" : "events + tasks",
      icon:    Zap,
      from:    "from-amber-500", to: "to-orange-500",
      shadow:  "shadow-amber-200",
      badge:   "bg-amber-50 text-amber-600",
    },
    {
      label:   language === "vi" ? "Ưu tiên cao" : "High Priority",
      value:   highPriority,
      sub:     language === "vi" ? "Công việc ưu tiên cao" : "High priority tasks",
      icon:    AlertTriangle,
      from:    "from-rose-500", to: "to-pink-600",
      shadow:  "shadow-rose-200",
      badge:   "bg-rose-50 text-rose-600",
    },
    {
      label:   language === "vi" ? "Sự kiện tuần" : "Events This Week",
      value:   weeklyEventCount,
      sub:     language === "vi" ? "Sự kiện" : "Events",
      icon:    CalendarDays,
      from:    "from-violet-500", to: "to-indigo-600",
      shadow:  "shadow-indigo-200",
      badge:   "bg-indigo-50 text-indigo-600",
    },
    {
      label:   language === "vi" ? "Task bị trễ hạn" : "Overdue Tasks",
      value:   missingTaskCount,
      sub:     language === "vi" ? "Cần xử lý" : "Needs attention",
      icon:    XCircle,
      from:    "from-slate-500", to: "to-slate-700",
      shadow:  "shadow-slate-200",
      badge:   "bg-slate-50 text-slate-600",
    },
  ];

  const priorityChip: Record<string, string> = {
    Cao: "bg-rose-50 text-rose-600 border border-rose-200",
    "Trung bình": "bg-amber-50 text-amber-600 border border-amber-200",
    Thấp: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  };

  // Progress bar color per category
  const catProgressColor = ["bg-indigo-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-blue-500"];

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto font-sans dark:bg-slate-950">
      {/* ── Top Header ── */}
      <div className="px-4 sm:px-8 pt-5 sm:pt-7 pb-4 sm:pb-5 flex items-start sm:items-center justify-between flex-shrink-0 bg-white border-b border-slate-200 dark:bg-slate-950 dark:border-slate-800 gap-3 flex-wrap">
        <div>
          <h1 className="text-[1.65rem] font-extrabold tracking-tight text-slate-900 leading-snug dark:text-slate-50">
            {getGreeting()}
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium dark:text-slate-300">
            {currentDateLabel}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <CurrentTimeIndicator />
          <PlannerAssistantButton />
          <NotificationCenter />
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-[1440px] mx-auto w-full">
        <HintBubble 
          id="dashboard_intro" 
          title={language === 'vi' ? "Chào mừng đến với PlanWise" : "Welcome to PlanWise"}
          color="indigo"
          persistent={false}
        >
          {language === 'vi' 
            ? "Đây là bảng điều khiển tổng quan, giúp bạn xem nhanh hôm nay có gì, việc nào đang gấp và danh mục nào đang tiến triển tốt để quyết định nên ưu tiên điều gì tiếp theo."
            : "This is your command center. Quickly view key metrics, today's schedule, and tasks that need immediate attention."}
        </HintBubble>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {kpiCards.map(({ label, value, sub, icon: Icon, from, to, shadow, badge }, i) => (
            <div
              key={i}
              className="group bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden relative dark:bg-slate-900 dark:border-slate-800 dark:shadow-black/20"
            >
              {/* Subtle gradient top accent */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${from} ${to} rounded-t-2xl opacity-80`} />
              <div className="flex items-start justify-between mt-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-300">{label}</p>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${from} ${to} shadow-sm ${shadow} flex items-center justify-center`}>
                  <Icon size={16} className="text-white" />
                </div>
              </div>
              <p className="text-3xl font-black tracking-tight text-slate-900 mt-3 dark:text-slate-50">{value}</p>
              <p className={`inline-flex mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge} dark:border dark:border-white/10 dark:bg-white/10`}>{sub}</p>
            </div>
          ))}
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — Schedule + Alerts */}
          <div className="lg:col-span-2 space-y-5">

            {/* Today's Schedule */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col dark:bg-slate-900 dark:border-slate-800" style={{ height: 390 }}>
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center dark:bg-indigo-500/15">
                    <Clock size={15} className="text-indigo-600" />
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-50">
                    {language === "vi" ? "Lịch Trình Hôm Nay" : "Today's Schedule"}
                  </h3>
                </div>
                <Link
                  to="/dashboard/timetable"
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors dark:bg-indigo-500/15 dark:text-indigo-200 dark:hover:bg-indigo-500/25 dark:hover:text-indigo-100"
                >
                  {language === "vi" ? "Xem đầy đủ" : "View all"} <ArrowRight size={12} />
                </Link>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-slate-50/50 dark:bg-slate-950/60">
                {todayTimeline.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 dark:text-slate-500">
                    <CalendarDays size={32} className="opacity-30" />
                    <p className="text-sm font-medium">{language === "vi" ? "Lịch trống hôm nay" : "No events today"}</p>
                  </div>
                ) : todayTimeline.map(item => {
                  const timeStr = getTimeString(item.startHour, item.startMin, item.duration);
                  const now = new Date();
                  const nd = now.getHours() + now.getMinutes() / 60;
                  const sd = item.startHour + item.startMin / 60;
                  const ed = sd + item.duration;
                  const isNow = nd >= sd && nd < ed;
                  const isPast = nd >= ed;
                  const colors = COLOR_MAP[normalizeEventColor(item.color)];
                  const catName = categories.find(c => c.id === item.categoryId)?.name || "";

                  return (
                    <div
                      key={`${item.kind}-${item.id}`}
                      className={`group flex items-center gap-4 p-3.5 rounded-xl border transition-all duration-200 ${
                        isNow
                          ? "bg-indigo-50 border-indigo-200 shadow-sm shadow-indigo-100 dark:bg-indigo-500/12 dark:border-indigo-400/30 dark:shadow-none"
                          : isPast
                          ? "bg-transparent border-transparent opacity-45"
                          : "bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:hover:border-indigo-400/30"
                      }`}
                    >
                      <div className="w-16 flex-shrink-0 text-right">
                        <p className={`text-[13px] font-bold ${isNow ? "text-indigo-700 dark:text-indigo-200" : "text-slate-700 dark:text-slate-200"}`}>
                          {item.startHour > 12 ? item.startHour - 12 : item.startHour}:{String(item.startMin).padStart(2, "0")}
                        </p>
                        <p className={`text-[10px] font-semibold uppercase ${isNow ? "text-indigo-400 dark:text-indigo-300" : "text-slate-400 dark:text-slate-500"}`}>
                          {item.startHour >= 12 ? "PM" : "AM"}
                        </p>
                      </div>

                      <div className={`w-1 h-10 rounded-full flex-shrink-0 ${isNow ? "bg-indigo-500" : colors.bg}`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold truncate ${isNow ? "text-indigo-900 dark:text-indigo-100" : "text-slate-800 dark:text-slate-100"}`}>
                            {item.title}
                          </p>
                          {item.kind === "task" && (
                            <span className="flex-shrink-0 text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                              {language === "vi" ? "Task" : "Task"}
                            </span>
                          )}
                          {isNow && (
                            <span className="flex-shrink-0 text-[9px] font-bold bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                              Live
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 dark:text-slate-300">
                            <Clock size={9} /> {timeStr}
                          </span>
                          {item.location && (
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 dark:text-slate-300">
                              <MapPin size={9} /> {item.location}
                            </span>
                          )}
                        </div>
                      </div>

                      {catName && (
                        <span className={`hidden sm:inline-flex text-[10px] font-semibold px-2.5 py-1 rounded-full ${colors.badge} flex-shrink-0`}>
                          {catName}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Progress */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 dark:bg-slate-900 dark:border-slate-800">
              <div className="pb-4 border-b border-slate-100 flex items-center justify-between dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center dark:bg-indigo-500/15">
                      <Tag size={15} className="text-indigo-600" />
                    </div>
                  <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-50">
                    {language === "vi" ? "Tiến Độ Danh Mục" : "Category Progress"}
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full dark:bg-slate-800 dark:text-slate-200">
                  {categories.length}
                </span>
              </div>
              <div className="space-y-4 mt-4">
                {categoryStats.map((cat, idx) => {
                  return (
                    <div key={cat.id}>
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${catProgressColor[idx % 6]}`} />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-100">{cat.name}</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-300">{cat.progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${catProgressColor[idx % 6]}`}
                          style={{ width: `${cat.progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">

            {/* Alert cards */}
            {delayedTasks.length > 0 && (
              <div className="bg-white rounded-2xl border border-rose-100 overflow-hidden shadow-sm dark:bg-slate-900 dark:border-rose-500/20">
                <div className="px-4 py-3 bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-100 flex items-center justify-between dark:from-rose-500/12 dark:to-pink-500/10 dark:border-rose-500/20">
                  <div className="w-6 h-6 bg-rose-100 rounded-md flex items-center justify-center dark:bg-rose-500/15">
                    <History size={12} className="text-rose-600" />
                  </div>
                  <h3 className="text-sm font-bold text-rose-800 dark:text-rose-200">
                    {language === "vi" ? "Quá hạn" : "Overdue"}
                  </h3>
                  <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">{delayedTasks.length}</span>
                </div>
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {delayedTasks.map(t => (
                    <div key={t.id} className="px-4 py-3 flex items-start gap-3 hover:bg-rose-50/30 transition-colors dark:hover:bg-rose-500/5">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 flex-shrink-0" />
                      <div>
                        <p className="text-[13px] font-semibold text-slate-800 line-clamp-1 dark:text-slate-100">{t.title}</p>
                        <p className="text-[11px] text-rose-500 mt-0.5 font-medium">{formatTaskDueDateLabel(t.dueDate)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Tasks */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center dark:bg-violet-500/15">
                    <TrendingUp size={13} className="text-violet-600" />
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-50">
                    {language === "vi" ? "Sắp Đến Hạn" : "Upcoming"}
                  </h3>
                </div>
                <Link to="/dashboard/tasks" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-full hover:bg-indigo-100 transition-colors dark:bg-indigo-500/15 dark:text-indigo-200 dark:hover:bg-indigo-500/25 dark:hover:text-indigo-100">
                  {language === "vi" ? "Tất cả" : "All"}
                </Link>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {upcomingTasks.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6 dark:text-slate-300">{language === "vi" ? "Bạn đã hoàn thành mọi thứ!" : "All done!"}</p>
                ) : upcomingTasks.map(t => (
                  <div key={t.id} className="group px-4 py-3.5 flex items-start gap-3 hover:bg-slate-50/60 transition-colors dark:hover:bg-slate-800/70">
                    <button
                      type="button"
                      onClick={() => void completeUpcomingTask(t.id)}
                      disabled={completingTaskIds.includes(t.id)}
                      className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-slate-300 text-transparent transition-colors hover:border-emerald-500 hover:bg-emerald-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:cursor-wait disabled:border-emerald-400 disabled:bg-emerald-400 disabled:text-white dark:border-slate-500 dark:hover:border-emerald-400 dark:focus:ring-emerald-500/40"
                      aria-label={language === "vi" ? `Hoàn thành task ${t.title}` : `Complete task ${t.title}`}
                      title={language === "vi" ? "Đánh dấu hoàn thành" : "Mark complete"}
                    >
                      <CheckCircle2 size={13} className={completingTaskIds.includes(t.id) ? "animate-pulse" : ""} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 line-clamp-1 transition-colors dark:text-slate-100">{t.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityChip[t.priority] || "bg-slate-50 text-slate-500"}`}>
                          {t.priority}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-300">{formatTaskDueDateLabel(t.dueDate)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Habit streak reminders */}
            <div className="bg-white rounded-2xl border border-orange-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-orange-500/25">
              <div className="px-5 py-4 border-b border-orange-100 flex items-center justify-between dark:border-orange-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center dark:bg-orange-500/15">
                    <Flame size={14} className="text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-50">
                      {language === "vi" ? "Giữ Chuỗi Thói Quen" : "Keep Your Streak"}
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-400">
                      {language === "vi" ? "Hoàn thành hôm nay để không đứt chuỗi" : "Complete today to protect your streak"}
                    </p>
                  </div>
                </div>
                <Link to="/dashboard/habits" className="text-xs font-semibold text-orange-700 hover:text-orange-900 bg-orange-50 px-2.5 py-1 rounded-full hover:bg-orange-100 transition-colors dark:bg-orange-500/15 dark:text-orange-200 dark:hover:bg-orange-500/25">
                  {language === "vi" ? "Tất cả" : "All"}
                </Link>
              </div>

              <div className="divide-y divide-orange-50 dark:divide-slate-800">
                {habitReminders.length === 0 ? (
                  <div className="py-6 px-4 text-center">
                    <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-2" />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-300">
                      {language === "vi" ? "Các chuỗi hôm nay đều an toàn!" : "Today's streaks are safe!"}
                    </p>
                  </div>
                ) : habitReminders.map(habit => {
                  const isToggling = togglingHabitIds.includes(habit.id);
                  return (
                    <button
                      key={habit.id}
                      type="button"
                      disabled={isToggling}
                      onClick={() => completeHabit(habit.id)}
                      className="group w-full px-4 py-3.5 flex items-center gap-3 text-left hover:bg-orange-50/60 transition-colors disabled:opacity-60 disabled:cursor-wait dark:hover:bg-orange-500/5"
                    >
                      <span className="w-5 h-5 rounded-full border-2 border-orange-300 group-hover:border-orange-500 group-hover:bg-orange-500 flex items-center justify-center flex-shrink-0 transition-colors dark:border-orange-500/60">
                        <CheckCircle2 size={13} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-semibold text-slate-800 truncate group-hover:text-orange-800 dark:text-slate-100 dark:group-hover:text-orange-200">
                          {habit.title}
                        </span>
                        <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-orange-600 dark:text-orange-300">
                          <Flame size={11} />
                          {habit.currentStreak > 0
                            ? `${language === "vi" ? "Chuỗi" : "Streak"} ${habit.currentStreak} ${getHabitStreakUnit(habit.frequency, habit.currentStreak, language)}`
                            : (language === "vi" ? "Bắt đầu chuỗi hôm nay" : "Start a streak today")}
                        </span>
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400">
                        {language === "vi" ? "Đánh dấu" : "Complete"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
