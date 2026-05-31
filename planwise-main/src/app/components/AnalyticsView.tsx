import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import { TrendingUp, Calendar, MessageSquare, Smile, Frown, Meh, Flame, Save, Sparkles, Bot, ArrowRight } from "lucide-react";
import { DAILY_REFLECTIONS, HABITS } from "../data/mockData";
import { useData } from "../context/DataContext";
import { HintBubble } from "./HintBubble";

export function AnalyticsView() {
  const { language } = useData();
  const [recapRange, setRecapRange] = useState<"week" | "month">("week");
  const [reflections] = useState(DAILY_REFLECTIONS);
  const [newReflection, setNewReflection] = useState({
    completed: "",
    obstacles: "",
    improvements: "",
    energyLevel: 7,
    mood: "good" as const
  });

  const weeklyProgress = [
    { day: "T2", completed: 3, total: 5, energy: 7 },
    { day: "T3", completed: 4, total: 6, energy: 8 },
    { day: "T4", completed: 2, total: 4, energy: 6 },
    { day: "T5", completed: 5, total: 7, energy: 9 },
    { day: "T6", completed: 3, total: 5, energy: 7 },
    { day: "T7", completed: 4, total: 4, energy: 8 },
    { day: "CN", completed: 2, total: 3, energy: 6 },
  ];

  const categoryData = [
    { name: "Công việc", value: 35, color: "#6366f1" },
    { name: "Học tập",   value: 25, color: "#8b5cf6" },
    { name: "Sức khỏe",  value: 20, color: "#10b981" },
    { name: "Gia đình",  value: 15, color: "#f43f5e" },
    { name: "Tài chính", value: 5,  color: "#f59e0b" },
  ];

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case "great":   return <Smile className="w-5 h-5 text-emerald-500" />;
      case "good":    return <Smile className="w-5 h-5 text-blue-500" />;
      case "okay":    return <Meh   className="w-5 h-5 text-amber-500" />;
      case "bad":     return <Frown className="w-5 h-5 text-orange-500" />;
      case "terrible":return <Frown className="w-5 h-5 text-rose-500" />;
      default:        return <Meh   className="w-5 h-5 text-zinc-400" />;
    }
  };

  const getMoodLabel = (mood: string) => {
    const labels: Record<string, string> = {
      great: "Tuyệt vời", good: "Tốt", okay: "Bình thường", bad: "Không tốt", terrible: "Tệ"
    };
    return labels[mood] || mood;
  };

  const MOOD_OPTIONS = ["great", "good", "okay", "bad", "terrible"] as const;

  const weeklyCompleted = weeklyProgress.reduce((sum, item) => sum + item.completed, 0);
  const weeklyTotal = weeklyProgress.reduce((sum, item) => sum + item.total, 0);
  const weeklyCompletionRate = Math.round((weeklyCompleted / weeklyTotal) * 100);
  const weeklyEnergyAverage = Number((weeklyProgress.reduce((sum, item) => sum + item.energy, 0) / weeklyProgress.length).toFixed(1));
  const bestDay = weeklyProgress.reduce((best, item) => (item.completed > best.completed ? item : best), weeklyProgress[0]);
  const lowestEnergyDay = weeklyProgress.reduce((lowest, item) => (item.energy < lowest.energy ? item : lowest), weeklyProgress[0]);
  const topCategory = categoryData.reduce((top, item) => (item.value > top.value ? item : top), categoryData[0]);
  const strongestHabit = HABITS.reduce((top, item) => (item.currentStreak > top.currentStreak ? item : top), HABITS[0]);
  const reflectionMood = reflections[0]?.mood ?? "good";
  const recentObstacle = reflections[0]?.obstacles ?? "";

  const weeklyRecap = {
    summary:
      language === "vi"
        ? `Tuần này bạn hoàn thành ${weeklyCompleted}/${weeklyTotal} đầu việc, tương đương ${weeklyCompletionRate}%. Năng lượng trung bình ở mức ${weeklyEnergyAverage}/10 và ngày làm tốt nhất là ${bestDay.day}.`
        : `You completed ${weeklyCompleted}/${weeklyTotal} tasks this week, with an average energy of ${weeklyEnergyAverage}/10.`,
    observation:
      language === "vi"
        ? `AI thấy bạn đạt đỉnh hiệu suất vào ${bestDay.day}, nhưng năng lượng giảm rõ ở ${lowestEnergyDay.day}. Danh mục chiếm nhiều thời gian nhất hiện là ${topCategory.name} (${topCategory.value}%).`
        : `Your best day was ${bestDay.day}, while energy dipped on ${lowestEnergyDay.day}.`,
    suggestions: language === "vi"
      ? [
          `Chuyển các việc cần tập trung sâu sang khung giống ${bestDay.day} để tận dụng nhịp hiệu suất cao.`,
          `Ở ${lowestEnergyDay.day}, hãy giảm bớt việc nặng hoặc chèn một block nghỉ ngắn để tránh tụt năng lượng.`,
          `Nếu ${topCategory.name} đang chiếm quá nhiều thời gian, hãy giới hạn rõ thời lượng để các danh mục khác không bị lấn át.`,
        ]
      : [
          "Move deep-focus work into your strongest day pattern.",
          "Protect low-energy periods with lighter tasks.",
          "Rebalance time if one category is dominating.",
        ],
  };

  const monthlyRecap = {
    summary:
      language === "vi"
        ? `Nhìn theo tháng, AI ước tính bạn đang giữ nhịp khá ổn ở nhóm thói quen và công việc cốt lõi. Chuỗi tốt nhất hiện tại là "${strongestHabit.title}" với ${strongestHabit.currentStreak} ngày liên tiếp.`
        : `On a monthly view, your consistency is strongest around ${strongestHabit.title}.`,
    observation:
      language === "vi"
        ? `Tâm trạng gần đây được ghi nhận là "${getMoodLabel(reflectionMood)}", và trở ngại nổi bật nhất là: ${recentObstacle || "chưa có dữ liệu trở ngại cụ thể"}.`
        : `Recent mood is ${getMoodLabel(reflectionMood)}.`,
    suggestions: language === "vi"
      ? [
          `Giữ đà cho thói quen "${strongestHabit.title}" bằng cách neo nó vào một khung giờ cố định trong tháng.`,
          `Tạo 1 mục tiêu cải thiện nhỏ dựa trên trở ngại "${recentObstacle || "sự phân tâm"}" để đo được tiến triển mỗi tuần.`,
          `Dành thêm thời gian cho các danh mục dưới 20% nếu bạn muốn cân bằng hơn giữa công việc, sức khỏe và học tập.`,
        ]
      : [
          "Protect your strongest habit with a fixed time slot.",
          "Turn your main obstacle into one measurable improvement goal.",
          "Rebalance categories that receive too little time.",
        ],
  };

  const activeRecap = recapRange === "week" ? weeklyRecap : monthlyRecap;

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto font-sans text-slate-900">
      {/* Page Header */}
      <div className="pt-8 pb-6 px-8 flex items-center justify-between flex-shrink-0 border-b border-slate-200 bg-white sticky top-0 z-10">
        <div>
          <h1 className="text-[1.6rem] font-extrabold tracking-tight text-slate-900">
            {language === "vi" ? "Phân Tích & Đánh Giá" : "Analytics & Review"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {language === "vi" ? "Nhật ký cuối ngày và biểu đồ hiệu suất" : "Daily journal and performance charts"}
          </p>
        </div>
      </div>

      <div className="flex-1 p-8 space-y-8 max-w-[1400px] mx-auto w-full pb-12">
        <HintBubble
          id="analytics_intro"
          title={language === "vi" ? "Phân tích & Đánh giá" : "Analytics & Review"}
          color="blue"
          persistent={false}
        >
          {language === "vi"
            ? "Mục này giúp bạn nhìn lại cách mình làm việc: hôm nay đã hoàn thành gì, điều gì gây trì hoãn, năng lượng biến động ra sao và thời gian của bạn đang được dồn vào đâu."
            : "Review what you completed, what slowed you down, and how your energy and time are trending."}
        </HintBubble>

        <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm dark:border-indigo-500/20 dark:bg-slate-950">
          <div className="flex flex-col gap-4 border-b border-indigo-100 bg-gradient-to-r from-slate-950 via-indigo-950 to-violet-900 px-6 py-5 text-white dark:border-indigo-500/20 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 text-yellow-300 ring-1 ring-white/15">
                <Bot size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight">
                    {language === "vi" ? "AI Recap & Gợi Ý Cải Thiện" : "AI Recap & Suggestions"}
                  </h2>
                  <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]">
                    AI
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-indigo-100">
                  {language === "vi"
                    ? "Khung này tóm tắt các tín hiệu chính từ biểu đồ và nhật ký, sau đó gợi ý các hướng cải thiện cụ thể theo tuần hoặc theo tháng."
                    : "This panel summarizes key signals from your analytics and turns them into concrete suggestions."}
                </p>
              </div>
            </div>

            <div className="inline-flex w-fit items-center rounded-2xl border border-white/10 bg-white/8 p-1">
              {[
                { key: "week", label: language === "vi" ? "Tuần" : "Week" },
                { key: "month", label: language === "vi" ? "Tháng" : "Month" },
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => setRecapRange(option.key as "week" | "month")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                    recapRange === option.key
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-white/75 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 px-6 py-6 dark:bg-slate-950 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-200">
                  <Sparkles size={16} />
                </div>
                <div className="max-w-3xl rounded-2xl rounded-tl-sm border border-indigo-100 bg-indigo-50/70 px-4 py-3 dark:border-indigo-500/20 dark:bg-slate-900/95">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">
                    {language === "vi" ? "Tóm tắt" : "Summary"}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-slate-100">{activeRecap.summary}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-200">
                  <TrendingUp size={16} />
                </div>
                <div className="max-w-3xl rounded-2xl rounded-tl-sm border border-violet-100 bg-violet-50/70 px-4 py-3 dark:border-violet-500/20 dark:bg-slate-900/95">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-300">
                    {language === "vi" ? "Điều AI nhận thấy" : "AI Observation"}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-slate-100">{activeRecap.observation}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-200">
                  <ArrowRight size={16} />
                </div>
                <div className="max-w-3xl rounded-2xl rounded-tl-sm border border-emerald-100 bg-emerald-50/80 px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-950/30">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                    {language === "vi" ? "Hướng cải thiện nên thử" : "Suggested Improvements"}
                  </p>
                  <div className="mt-2 space-y-2">
                    {activeRecap.suggestions.map((suggestion) => (
                      <div key={suggestion} className="rounded-xl bg-white/80 px-3 py-2 text-sm leading-relaxed text-zinc-700 dark:bg-slate-900 dark:text-slate-100">
                        {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5 dark:border-slate-700 dark:bg-slate-900/95">
              <h3 className="text-sm font-bold tracking-tight text-zinc-950 dark:text-slate-50">
                {language === "vi" ? "Chỉ số AI đang dựa vào" : "Signals Behind This Recap"}
              </h3>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-slate-400">
                    {recapRange === "week"
                      ? language === "vi" ? "Tỷ lệ hoàn thành tuần" : "Weekly completion"
                      : language === "vi" ? "Thói quen mạnh nhất" : "Strongest habit"}
                  </p>
                  <p className="mt-1 text-lg font-bold text-zinc-950 dark:text-slate-50">
                    {recapRange === "week" ? `${weeklyCompletionRate}%` : `${strongestHabit.title} · ${strongestHabit.currentStreak} ngày`}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-slate-400">
                    {recapRange === "week"
                      ? language === "vi" ? "Năng lượng trung bình" : "Average energy"
                      : language === "vi" ? "Tâm trạng gần nhất" : "Recent mood"}
                  </p>
                  <p className="mt-1 text-lg font-bold text-zinc-950 dark:text-slate-50">
                    {recapRange === "week" ? `${weeklyEnergyAverage}/10` : getMoodLabel(reflectionMood)}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-slate-400">
                    {language === "vi" ? "Danh mục chiếm nhiều thời gian nhất" : "Top category"}
                  </p>
                  <p className="mt-1 text-lg font-bold text-zinc-950 dark:text-slate-50">
                    {topCategory.name} · {topCategory.value}%
                  </p>
                </div>
                <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/70 px-4 py-3 dark:border-indigo-500/30 dark:bg-indigo-500/10">
                  <p className="text-sm font-medium leading-relaxed text-indigo-700 dark:text-indigo-100">
                    {language === "vi"
                      ? "Gợi ý này là mô phỏng AI từ dữ liệu trong mục Phân tích. Khi bạn cập nhật thêm nhật ký và thống kê, recap sẽ thay đổi theo."
                      : "This recap is generated from your analytics data and will change as your stats evolve."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Daily Reflection ── */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/50 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-zinc-600" />
            <h2 className="text-base font-semibold tracking-tight text-zinc-950">
              {language === "vi" ? "Nhật ký cuối ngày" : "Daily Reflection"}
            </h2>
          </div>
          <div className="p-6 space-y-5">
            {/* Three textareas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: "completed"   as const, label: language === "vi" ? "Hôm nay đã hoàn thành gì?" : "What did you complete?",        placeholder: language === "vi" ? "Liệt kê những việc đã xong..." : "List completed tasks...",       color: "focus:ring-emerald-300 focus:border-emerald-400" },
                { key: "obstacles"   as const, label: language === "vi" ? "Điều gì làm mình trì hoãn?" : "What caused procrastination?",  placeholder: language === "vi" ? "Những trở ngại, phân tâm..." : "Obstacles, distractions...",        color: "focus:ring-rose-300 focus:border-rose-400"     },
                { key: "improvements"as const, label: language === "vi" ? "Cải thiện gì cho ngày mai?" : "What to improve tomorrow?",     placeholder: language === "vi" ? "Kế hoạch cải thiện..." : "Improvement plan...",                      color: "focus:ring-blue-300 focus:border-blue-400"     },
              ].map(({ key, label, placeholder, color }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5 block">{label}</label>
                  <textarea
                    rows={3}
                    placeholder={placeholder}
                    value={newReflection[key]}
                    onChange={(e) => setNewReflection({ ...newReflection, [key]: e.target.value })}
                    className={`w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 ${color} transition-all resize-none`}
                  />
                </div>
              ))}
            </div>

            {/* Mood & Energy */}
            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-zinc-100">
              {/* Energy level */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider whitespace-nowrap">
                  {language === "vi" ? "Năng lượng" : "Energy"}
                </span>
                <div className="flex gap-1">
                  {[1,2,3,4,5,6,7,8,9,10].map(level => (
                    <button
                      key={level}
                      onClick={() => setNewReflection({ ...newReflection, energyLevel: level })}
                      className={`w-7 h-7 rounded-md text-xs font-bold transition-all border ${
                        level <= newReflection.energyLevel
                          ? "bg-blue-500 border-blue-500 text-white shadow-sm"
                          : "bg-zinc-100 border-zinc-200 text-zinc-500 hover:bg-zinc-200"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider whitespace-nowrap">
                  {language === "vi" ? "Tâm trạng" : "Mood"}
                </span>
                <div className="flex gap-1.5">
                  {MOOD_OPTIONS.map(mood => (
                    <button
                      key={mood}
                      onClick={() => setNewReflection({ ...newReflection, mood: mood as any })}
                      title={getMoodLabel(mood)}
                      className={`p-2 rounded-lg border transition-all ${
                        newReflection.mood === mood
                          ? "bg-zinc-100 border-zinc-300 shadow-sm"
                          : "border-transparent hover:bg-zinc-100"
                      }`}
                    >
                      {getMoodIcon(mood)}
                    </button>
                  ))}
                </div>
              </div>

              <button className="ml-auto flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md shadow-indigo-200">
                <Save size={14} className="text-zinc-400" />
                {language === "vi" ? "Lưu nhật ký" : "Save Journal"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Charts Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Progress Bar Chart */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/50 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-semibold tracking-tight text-zinc-950">
                {language === "vi" ? "Tiến độ tuần này" : "Weekly Progress"}
              </h3>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={weeklyProgress} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#71717a", fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#71717a" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e7", boxShadow: "0 4px 12px rgba(0,0,0,.06)", fontSize: 12, fontWeight: 600 }}
                    cursor={{ fill: "#f4f4f5" }}
                  />
                  <Bar dataKey="completed" fill="#6366f1" name="Hoàn thành" radius={[4,4,0,0]} />
                  <Bar dataKey="total"     fill="#e4e4e7" name="Tổng số"     radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Energy Level Line Chart */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/50 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-semibold tracking-tight text-zinc-950">
                {language === "vi" ? "Biến động năng lượng" : "Energy Trend"}
              </h3>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={weeklyProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#71717a", fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: "#71717a" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e7", boxShadow: "0 4px 12px rgba(0,0,0,.06)", fontSize: 12, fontWeight: 600 }}
                    cursor={{ stroke: "#d4d4d8", strokeWidth: 1 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="energy"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    name={language === "vi" ? "Mức năng lượng" : "Energy Level"}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution Pie */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/50 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-semibold tracking-tight text-zinc-950">
                {language === "vi" ? "Phân bổ thời gian theo danh mục" : "Time by Category"}
              </h3>
            </div>
            <div className="p-6 flex gap-6">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={90} innerRadius={48} dataKey="value" paddingAngle={3}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e7", boxShadow: "0 4px 12px rgba(0,0,0,.06)", fontSize: 12, fontWeight: 600 }}
                    formatter={(val) => [`${val}%`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col justify-center gap-2.5">
                {categoryData.map(cat => (
                  <div key={cat.name} className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: cat.color }} />
                    <span className="text-sm font-medium text-zinc-700">{cat.name}</span>
                    <span className="text-xs font-bold text-zinc-500 ml-auto pl-3">{cat.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Habit Streaks */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/50 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-semibold tracking-tight text-zinc-950">
                {language === "vi" ? "Chuỗi thói quen" : "Habit Streaks"}
              </h3>
            </div>
            <div className="divide-y divide-zinc-100">
              {HABITS.map(habit => (
                <div key={habit.id} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50/50 transition-colors">
                  <div className="min-w-0 flex-1 mr-4">
                    <h4 className="text-sm font-semibold text-zinc-950 truncate">{habit.title}</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {language === "vi" ? "Hiện tại:" : "Current:"}&nbsp;
                      <span className="font-bold text-zinc-900">{habit.currentStreak}</span> {language === "vi" ? "ngày" : "days"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-8 h-8 rounded-md bg-orange-50 border border-orange-100 flex items-center justify-center shadow-sm">
                      <Flame className="w-4 h-4 text-orange-500" />
                    </div>
                    <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md border border-zinc-200 bg-zinc-50 text-zinc-700">
                      {language === "vi" ? "Tốt nhất:" : "Best:"} {habit.bestStreak}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent Reflections ── */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/50 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-600" />
            <h2 className="text-base font-semibold tracking-tight text-zinc-950">
              {language === "vi" ? "Nhật ký gần đây" : "Recent Journal Entries"}
            </h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {reflections.map(reflection => (
              <div key={reflection.id} className="px-6 py-5 hover:bg-zinc-50/30 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-zinc-950">
                    {new Date(reflection.date).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      {getMoodIcon(reflection.mood)}
                      <span className="text-xs font-semibold text-zinc-700">{getMoodLabel(reflection.mood)}</span>
                    </div>
                    <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md border border-blue-100 bg-blue-50 text-blue-700">
                      {language === "vi" ? "Năng lượng:" : "Energy:"} {reflection.energyLevel}/10
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3">
                    <h5 className="font-semibold text-emerald-700 mb-1.5 text-xs uppercase tracking-wider">
                      {language === "vi" ? "✓ Hoàn thành" : "✓ Completed"}
                    </h5>
                    <p className="text-zinc-700 text-xs leading-relaxed">{reflection.completed}</p>
                  </div>
                  <div className="bg-rose-50/50 border border-rose-100 rounded-lg p-3">
                    <h5 className="font-semibold text-rose-700 mb-1.5 text-xs uppercase tracking-wider">
                      {language === "vi" ? "⚠ Trở ngại" : "⚠ Obstacles"}
                    </h5>
                    <p className="text-zinc-700 text-xs leading-relaxed">{reflection.obstacles}</p>
                  </div>
                  <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3">
                    <h5 className="font-semibold text-blue-700 mb-1.5 text-xs uppercase tracking-wider">
                      {language === "vi" ? "↑ Cải thiện" : "↑ Improvements"}
                    </h5>
                    <p className="text-zinc-700 text-xs leading-relaxed">{reflection.improvements}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
