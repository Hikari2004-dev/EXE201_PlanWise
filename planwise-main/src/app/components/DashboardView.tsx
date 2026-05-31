import { Link } from "react-router";
import {
  TrendingUp, Clock, ArrowRight, Flame, MapPin, History, XCircle,
  CalendarDays, CheckCircle2, AlertTriangle, Zap,
} from "lucide-react";
import { HintBubble } from "./HintBubble";
import { NotificationCenter } from "./NotificationCenter";
import { useData } from "../context/DataContext";
import { COLOR_MAP, getTimeString } from "../data/mockData";

const TODAY_DAY = "Thu";

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
  const { events, tasks, categories, language } = useData();

  const todayEvents = events.filter(e => e.day === TODAY_DAY).sort(
    (a, b) => a.startHour - b.startHour || a.startMin - b.startMin
  );

  const upcomingTasks   = tasks.filter(t => !t.completed).slice(0, 5);
  const completedCount  = tasks.filter(t => t.completed).length;
  const totalEvents     = events.length;
  const highPriority    = tasks.filter(t => !t.completed && t.priority === "Cao").length;
  const completionRate  = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const parseViDate = (s: string) => {
    if (!s?.includes("Th")) return new Date();
    const [day, mo] = s.split(" Th");
    return new Date(2026, parseInt(mo) - 1, parseInt(day));
  };
  const today       = new Date(2026, 2, 12);
  const sevenAgo    = new Date(today); sevenAgo.setDate(today.getDate() - 7);
  const delayedTasks   = tasks.filter(t => !t.completed && parseViDate(t.dueDate) < today).slice(0, 3);
  const abandonedTasks = tasks.filter(t => !t.completed && parseViDate(t.dueDate) < sevenAgo).slice(0, 3);

  const categoryStats = categories.map(cat => {
    const catTasks = tasks.filter(t => t.categoryId === cat.id);
    const progress = catTasks.length > 0
      ? Math.round((catTasks.filter(t => t.completed).length / catTasks.length) * 100) : 0;
    return { ...cat, eventCount: events.filter(e => e.categoryId === cat.id).length, progress };
  }).slice(0, 6);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (language === "vi") {
      if (h < 12) return "Chào buổi sáng ☀️";
      if (h < 18) return "Chào buổi chiều 🌤";
      return "Chào buổi tối 🌙";
    }
    if (h < 12) return "Good morning ☀️";
    if (h < 18) return "Good afternoon 🌤";
    return "Good evening 🌙";
  };

  // KPI card configs with real color
  const kpiCards = [
    {
      label:   language === "vi" ? "Sự kiện tuần" : "Events",
      value:   totalEvents,
      sub:     `${categories.length} ${language === "vi" ? "danh mục" : "categories"}`,
      icon:    CalendarDays,
      from:    "from-violet-500", to: "to-indigo-600",
      shadow:  "shadow-indigo-200",
      badge:   "bg-indigo-50 text-indigo-600",
    },
    {
      label:   language === "vi" ? "Hoàn thành" : "Completed",
      value:   `${completedCount}/${tasks.length}`,
      sub:     `${completionRate}% ${language === "vi" ? "hoàn tất" : "done"}`,
      icon:    CheckCircle2,
      from:    "from-emerald-500", to: "to-teal-600",
      shadow:  "shadow-emerald-200",
      badge:   "bg-emerald-50 text-emerald-600",
    },
    {
      label:   language === "vi" ? "Ưu tiên cao" : "High Priority",
      value:   highPriority,
      sub:     language === "vi" ? "Cần xử lý ngay" : "Needs action",
      icon:    AlertTriangle,
      from:    "from-rose-500", to: "to-pink-600",
      shadow:  "shadow-rose-200",
      badge:   "bg-rose-50 text-rose-600",
    },
    {
      label:   language === "vi" ? "Hôm nay" : "Today",
      value:   todayEvents.length,
      sub:     language === "vi" ? "sự kiện lịch" : "scheduled events",
      icon:    Zap,
      from:    "from-amber-500", to: "to-orange-500",
      shadow:  "shadow-amber-200",
      badge:   "bg-amber-50 text-amber-600",
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
      <div className="px-8 pt-7 pb-5 flex items-center justify-between flex-shrink-0 bg-white border-b border-slate-200 dark:bg-slate-950 dark:border-slate-800">
        <div>
          <h1 className="text-[1.65rem] font-extrabold tracking-tight text-slate-900 leading-snug dark:text-slate-50">
            {getGreeting()}
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium dark:text-slate-300">
            {language === "vi" ? "Thứ Năm, 12 tháng 3, 2026" : "Thursday, March 12, 2026"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationCenter />
          <CurrentTimeIndicator />
          <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-amber-50 border border-amber-200 rounded-full px-3.5 py-1.5 shadow-sm dark:from-amber-500/15 dark:to-orange-500/15 dark:border-amber-400/30 dark:bg-slate-900">
            <Flame size={14} className="text-orange-500" />
            <span className="text-xs font-bold text-orange-700 dark:text-amber-200">
              {language === "vi" ? "Chuỗi 7 ngày" : "7 Day Streak"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 px-8 py-6 space-y-6 max-w-[1440px] mx-auto w-full">
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                  to="/timetable"
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors dark:bg-indigo-500/15 dark:text-indigo-200 dark:hover:bg-indigo-500/25 dark:hover:text-indigo-100"
                >
                  {language === "vi" ? "Xem đầy đủ" : "View all"} <ArrowRight size={12} />
                </Link>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-slate-50/50 dark:bg-slate-950/60">
                {todayEvents.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 dark:text-slate-500">
                    <CalendarDays size={32} className="opacity-30" />
                    <p className="text-sm font-medium">{language === "vi" ? "Lịch trống hôm nay" : "No events today"}</p>
                  </div>
                ) : todayEvents.map(event => {
                  const timeStr = getTimeString(event.startHour, event.startMin, event.duration);
                  const now = new Date();
                  const nd = now.getHours() + now.getMinutes() / 60;
                  const sd = event.startHour + event.startMin / 60;
                  const ed = sd + event.duration;
                  const isNow = nd >= sd && nd < ed;
                  const isPast = nd >= ed;
                  const colors = COLOR_MAP[event.color];
                  const catName = categories.find(c => c.id === event.categoryId)?.name || "";

                  return (
                    <div
                      key={event.id}
                      className={`group flex items-center gap-4 p-3.5 rounded-xl border transition-all duration-200 ${
                        isNow
                          ? "bg-indigo-50 border-indigo-200 shadow-sm shadow-indigo-100 dark:bg-indigo-500/12 dark:border-indigo-400/30 dark:shadow-none"
                          : isPast
                          ? "bg-transparent border-transparent opacity-45"
                          : "bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:hover:border-indigo-400/30"
                      }`}
                    >
                      {/* Time */}
                      <div className="w-16 flex-shrink-0 text-right">
                        <p className={`text-[13px] font-bold ${isNow ? "text-indigo-700 dark:text-indigo-200" : "text-slate-700 dark:text-slate-200"}`}>
                          {event.startHour > 12 ? event.startHour - 12 : event.startHour}:{String(event.startMin).padStart(2, "0")}
                        </p>
                        <p className={`text-[10px] font-semibold uppercase ${isNow ? "text-indigo-400 dark:text-indigo-300" : "text-slate-400 dark:text-slate-500"}`}>
                          {event.startHour >= 12 ? "PM" : "AM"}
                        </p>
                      </div>

                      {/* Color bar */}
                      <div className={`w-1 h-10 rounded-full flex-shrink-0 ${isNow ? "bg-indigo-500" : colors.bg}`} />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold truncate ${isNow ? "text-indigo-900 dark:text-indigo-100" : "text-slate-800 dark:text-slate-100"}`}>
                            {event.title}
                          </p>
                          {isNow && (
                            <span className="flex-shrink-0 text-[9px] font-bold bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                              Live
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 dark:text-slate-300">
                            <Clock size={9} /> {timeStr}
                          </span>
                          {event.location && (
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 dark:text-slate-300">
                              <MapPin size={9} /> {event.location}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Category chip */}
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

            {/* Alert cards */}
            {(delayedTasks.length > 0 || abandonedTasks.length > 0) && (
              <div className="grid grid-cols-2 gap-4">
                {delayedTasks.length > 0 && (
                  <div className="bg-white rounded-2xl border border-rose-100 overflow-hidden shadow-sm dark:bg-slate-900 dark:border-rose-500/20">
                    <div className="px-4 py-3 bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-100 flex items-center justify-between dark:from-rose-500/12 dark:to-pink-500/10 dark:border-rose-500/20">
                      <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-rose-100 rounded-md flex items-center justify-center dark:bg-rose-500/15">
                          <History size={12} className="text-rose-600" />
                        </div>
                        <h3 className="text-sm font-bold text-rose-800 dark:text-rose-200">
                          {language === "vi" ? "Quá hạn" : "Overdue"}
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">{delayedTasks.length}</span>
                    </div>
                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                      {delayedTasks.map(t => (
                        <div key={t.id} className="px-4 py-3 flex items-start gap-3 hover:bg-rose-50/30 transition-colors dark:hover:bg-rose-500/5">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 flex-shrink-0" />
                          <div>
                            <p className="text-[13px] font-semibold text-slate-800 line-clamp-1 dark:text-slate-100">{t.title}</p>
                            <p className="text-[11px] text-rose-500 mt-0.5 font-medium">{t.dueDate}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {abandonedTasks.length > 0 && (
                  <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden shadow-sm dark:bg-slate-900 dark:border-orange-500/20">
                    <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 flex items-center justify-between dark:from-orange-500/12 dark:to-amber-500/10 dark:border-orange-500/20">
                      <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-orange-100 rounded-md flex items-center justify-center dark:bg-orange-500/15">
                          <XCircle size={12} className="text-orange-600" />
                        </div>
                        <h3 className="text-sm font-bold text-orange-800 dark:text-orange-200">
                          {language === "vi" ? "Bỏ dở" : "Abandoned"}
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">{abandonedTasks.length}</span>
                    </div>
                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                      {abandonedTasks.map(t => (
                        <div key={t.id} className="px-4 py-3 flex items-start gap-3 hover:bg-orange-50/30 transition-colors dark:hover:bg-orange-500/5">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 flex-shrink-0" />
                          <div>
                            <p className="text-[13px] font-semibold text-slate-800 line-clamp-1 dark:text-slate-100">{t.title}</p>
                            <p className="text-[11px] text-orange-500 mt-0.5 font-medium">{t.dueDate}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-5">

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
                <Link to="/tasks" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-full hover:bg-indigo-100 transition-colors dark:bg-indigo-500/15 dark:text-indigo-200 dark:hover:bg-indigo-500/25 dark:hover:text-indigo-100">
                  {language === "vi" ? "Tất cả" : "All"}
                </Link>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {upcomingTasks.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6 dark:text-slate-300">{language === "vi" ? "Bạn đã hoàn thành mọi thứ!" : "All done!"}</p>
                ) : upcomingTasks.map(t => (
                  <div key={t.id} className="group px-4 py-3.5 flex items-start gap-3 hover:bg-slate-50/60 transition-colors cursor-pointer dark:hover:bg-slate-800/70">
                    <div className="mt-0.5 w-4 h-4 rounded-full border-2 border-slate-300 group-hover:border-indigo-400 transition-colors flex-shrink-0 dark:border-slate-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 line-clamp-1 group-hover:text-indigo-700 transition-colors dark:text-slate-100 dark:group-hover:text-indigo-200">{t.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityChip[t.priority] || "bg-slate-50 text-slate-500"}`}>
                          {t.priority}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-300">{t.dueDate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Progress */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 dark:bg-slate-900 dark:border-slate-800">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-50">
                  {language === "vi" ? "Tiến Độ Danh Mục" : "Category Progress"}
                </h3>
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full dark:bg-slate-800 dark:text-slate-200">
                  {categories.length}
                </span>
              </div>
              <div className="space-y-4">
                {categoryStats.map((cat, idx) => {
                  const colors = COLOR_MAP[cat.color];
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
        </div>
      </div>
    </div>
  );
}
