import { useState } from "react";
import { Plus, Target, Calendar, Briefcase, HeartPulse, Wallet, BookOpen } from "lucide-react";
import { useData } from "../context/DataContext";
import { HintBubble } from "./HintBubble";

export function GoalsView() {
  const { language } = useData();
  const VISION_ITEMS = [
    { id: 1, title: "Senior Developer", description: "Làm chủ công nghệ và dẫn dắt đội ngũ", icon: Briefcase, color: "text-blue-500", bg: "bg-blue-50" },
    { id: 2, title: "Khỏe mạnh & Năng động", description: "Duy trì thói quen chạy bộ và ăn uống lành mạnh", icon: HeartPulse, color: "text-emerald-500", bg: "bg-emerald-50" },
    { id: 3, title: "Tự do Tài chính", description: "Có khoản đầu tư sinh lời và quỹ dự phòng", icon: Wallet, color: "text-amber-500", bg: "bg-amber-50" },
    { id: 4, title: "Học tập không ngừng", description: "Mỗi năm học thêm 1 ngôn ngữ hoặc kỹ năng mới", icon: BookOpen, color: "text-purple-500", bg: "bg-purple-50" }
  ];

  const [weeklyGoals, setWeeklyGoals] = useState([
    { id: 11, title: language === 'vi' ? "Đọc xong cuốn Atomic Habits" : "Finish Atomic Habits book", progress: 50, color: "bg-purple-500", text: "text-purple-600", bgSoft: "bg-purple-50" },
    { id: 12, title: language === 'vi' ? "Chạy bộ tổng cộng 15km" : "Run 15km in total", progress: 80, color: "bg-emerald-500", text: "text-emerald-600", bgSoft: "bg-emerald-50" },
  ]);
  const [monthlyGoals, setMonthlyGoals] = useState([
    { id: 21, title: language === 'vi' ? "Hoàn thành khóa học React" : "Complete React course", progress: 65, color: "bg-blue-500", text: "text-blue-600", bgSoft: "bg-blue-50" },
    { id: 22, title: language === 'vi' ? "Tiết kiệm 5 triệu" : "Save $200", progress: 40, color: "bg-amber-500", text: "text-amber-600", bgSoft: "bg-amber-50" },
  ]);
  const [yearlyGoals, setYearlyGoals] = useState([
    { id: 31, title: language === 'vi' ? "Đạt IELTS 7.0" : "Achieve IELTS 7.0", progress: 35, color: "bg-indigo-500", text: "text-indigo-600", bgSoft: "bg-indigo-50" },
    { id: 32, title: language === 'vi' ? "Du lịch Nhật Bản" : "Travel to Japan", progress: 10, color: "bg-rose-500", text: "text-rose-600", bgSoft: "bg-rose-50" },
  ]);
  const [draftGoals, setDraftGoals] = useState({
    week: "",
    month: "",
    year: "",
  });

  const addGoal = (type: 'week' | 'month' | 'year') => {
    const title = draftGoals[type].trim();
    if (!title) return;
    const newGoal = { id: Date.now(), title, progress: 0, color: "bg-cyan-500", text: "text-cyan-600", bgSoft: "bg-cyan-50" };
    if (type === 'week') setWeeklyGoals([...weeklyGoals, newGoal]);
    if (type === 'month') setMonthlyGoals([...monthlyGoals, newGoal]);
    if (type === 'year') setYearlyGoals([...yearlyGoals, newGoal]);
    setDraftGoals((prev) => ({ ...prev, [type]: "" }));
  };
  
  const incrementProgress = (type: 'week' | 'month' | 'year', id: number) => {
    const updateFn = (goals: any[]) => goals.map(g => g.id === id ? { ...g, progress: Math.min(100, g.progress + 10) } : g);
    if (type === 'week') setWeeklyGoals(updateFn);
    if (type === 'month') setMonthlyGoals(updateFn);
    if (type === 'year') setYearlyGoals(updateFn);
  };

  const renderGoalCard = (goal: any, type: 'week'|'month'|'year') => (
    <div key={goal.id}
      onClick={() => incrementProgress(type, goal.id)}
      className="p-4 rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-sm transition-all bg-white cursor-pointer group"
      title={language === 'vi' ? "Nhấp để tăng tiến độ" : "Click to increase progress"}
    >
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-semibold text-sm text-slate-800 leading-tight pr-4 group-hover:text-indigo-700 transition-colors truncate">{goal.title}</h4>
        <div className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ${goal.bgSoft} ${goal.text}`}>
          {goal.progress}%
        </div>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${goal.color}`} style={{ width: `${goal.progress}%` }} />
      </div>
      {goal.progress === 100 && (
        <p className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-1">✓ {language === 'vi' ? 'Hoàn thành!' : 'Done!'}</p>
      )}
    </div>
  );

  const renderInlineGoalInput = (type: 'week'|'month'|'year', placeholder: string) => (
    <div className="mt-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/70 p-3">
      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {language === 'vi' ? "Nhập trực tiếp mục tiêu mới" : "Type a new goal"}
      </label>
      <div className="flex gap-2">
        <input
          id={`goal-input-${type}`}
          type="text"
          value={draftGoals[type]}
          onChange={(e) => setDraftGoals({ ...draftGoals, [type]: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addGoal(type);
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
        />
        <button
          onClick={() => addGoal(type)}
          className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          <Plus size={14} />
          {language === 'vi' ? "Thêm" : "Add"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto font-sans text-slate-900">
      {/* Header */}
      <div className="pt-8 pb-6 px-8 flex items-center justify-between flex-shrink-0 border-b border-slate-200 bg-white sticky top-0 z-10">
        <div>
          <h1 className="text-[1.6rem] font-extrabold tracking-tight text-slate-900">{language === 'vi' ? "Bảng tầm nhìn và mục tiêu" : "Vision Board & Goals"}</h1>
          <p className="text-sm text-slate-500 mt-1">{language === 'vi' ? "La bàn định hướng và phân rã mục tiêu dài hạn" : "Compass for long-term goal breakdown"}</p>
        </div>
        <button
          onClick={() => {
            const el = document.getElementById("goal-input-year");
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
            (el as HTMLInputElement | null)?.focus();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md shadow-indigo-200"
        >
          <Plus size={16} />
          {language === 'vi' ? "Thêm mục tiêu" : "Add Goal"}
        </button>
      </div>

      <div className="flex-1 p-8 space-y-10 max-w-[1440px] mx-auto w-full pb-12">
        <HintBubble 
          id="goals_intro" 
          title={language === 'vi' ? "Tầm nhìn & Mục tiêu" : "Vision & Goals"}
          color="violet"
          persistent={false}
        >
          {language === 'vi' 
            ? "Mục này giúp bạn nối tầm nhìn dài hạn với hành động cụ thể. Hãy bắt đầu từ điều bạn muốn đạt được, rồi chia nhỏ thành mục tiêu năm, tháng và tuần để dễ theo dõi hơn."
            : "Start with a big vision, then break it down into yearly, monthly, and weekly goals to step-by-step realize your dreams."}
        </HintBubble>
        {/* Tiêu điểm Tầm nhìn */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg border border-zinc-200 bg-white shadow-sm flex items-center justify-center">
              <Target className="w-4 h-4 text-zinc-600" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
              {language === 'vi' ? "Bảng Tầm Nhìn" : "Vision Board"}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {VISION_ITEMS.map(item => (
              <div key={item.id} className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col hover:border-zinc-300 hover:shadow-md transition-all">
                <div className={`w-10 h-10 rounded-lg ${item.bg} border ${item.color.replace('text-', 'border-').replace('500', '200')} flex items-center justify-center mb-3 mt-1`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <h3 className="font-semibold text-zinc-950 text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed min-h-[40px]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mục tiêu Phân rã */}
        <div className="pb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg border border-zinc-200 bg-white shadow-sm flex items-center justify-center">
              <Calendar className="w-4 h-4 text-zinc-600" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
              {language === 'vi' ? "Phân Rã Mục Tiêu" : "Goal Breakdown"}
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Tuần */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-zinc-200 bg-zinc-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-zinc-950 flex items-center gap-2 text-sm tracking-tight">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {language === 'vi' ? "Mục tiêu Tuần" : "Weekly Goals"}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">{language === 'vi' ? "Hành động ngắn hạn" : "Short-term actions"}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">{weeklyGoals.length}</span>
                </div>
              </div>
              <div className="p-5 space-y-3 flex-1 bg-white">
                {weeklyGoals.map(g => renderGoalCard(g, 'week'))}
                {renderInlineGoalInput('week', language === 'vi' ? "Ví dụ: Hoàn thành 3 buổi tập trong tuần" : "Example: Finish 3 workouts this week")}
              </div>
            </div>

            {/* Tháng */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-zinc-200 bg-zinc-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-zinc-950 flex items-center gap-2 text-sm tracking-tight">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      {language === 'vi' ? "Mục tiêu Tháng" : "Monthly Goals"}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">{language === 'vi' ? "Xây dựng nền tảng" : "Building foundations"}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">{monthlyGoals.length}</span>
                </div>
              </div>
              <div className="p-5 space-y-3 flex-1 bg-white">
                {monthlyGoals.map(g => renderGoalCard(g, 'month'))}
                {renderInlineGoalInput('month', language === 'vi' ? "Ví dụ: Hoàn thành khóa học React trong tháng" : "Example: Finish React course this month")}
              </div>
            </div>

            {/* Năm */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-zinc-200 bg-zinc-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-zinc-950 flex items-center gap-2 text-sm tracking-tight">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      {language === 'vi' ? "Mục tiêu Năm" : "Yearly Goals"}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">{language === 'vi' ? "Định hướng cốt lõi" : "Core directions"}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100">{yearlyGoals.length}</span>
                </div>
              </div>
              <div className="p-5 space-y-3 flex-1 bg-white">
                {yearlyGoals.map(g => renderGoalCard(g, 'year'))}
                {renderInlineGoalInput('year', language === 'vi' ? "Ví dụ: Đạt chứng chỉ hoặc hoàn thành mục tiêu lớn trong năm" : "Example: Reach a major goal this year")}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
