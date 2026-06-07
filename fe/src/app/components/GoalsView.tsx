import { useState } from "react";
import { Plus, Target, Calendar, Briefcase, HeartPulse, Wallet, BookOpen, Sparkles } from "lucide-react";
import { useData } from "../context/DataContext";
import { HintBubble } from "./HintBubble";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";

export function GoalsView() {
  const { language } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
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

    // Limit check: FREE users are limited to 3 goals total
    const totalGoals = weeklyGoals.length + monthlyGoals.length + yearlyGoals.length;
    if (!user?.isPremium && totalGoals >= 3) {
      setShowUpgradeModal(true);
      return;
    }

    const newGoal = { id: Date.now(), title, progress: 0, color: "bg-cyan-500", text: "text-cyan-600", bgSoft: "bg-cyan-50" };
    if (type === 'week') setWeeklyGoals([...weeklyGoals, newGoal]);
    if (type === 'month') setMonthlyGoals([...monthlyGoals, newGoal]);
    if (type === 'year') setYearlyGoals([...yearlyGoals, newGoal]);
    setDraftGoals((prev) => ({ ...prev, [type]: "" }));
  };
  
  const incrementProgress = (type: 'week' | 'month' | 'year', id: string) => {
    const updateFn = (goals: any[]) => goals.map(g => g.id === id ? { ...g, progress: Math.min(100, g.progress + 10) } : g);
    if (type === 'week') setWeeklyGoals(updateFn);
    if (type === 'month') setMonthlyGoals(updateFn);
    if (type === 'year') setYearlyGoals(updateFn);
  };

  const renderGoalCard = (goal: any, type: 'week'|'month'|'year') => (
    <div key={goal.id}
      onClick={() => incrementProgress(type, goal.id)}
      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-sm transition-all bg-white dark:bg-slate-850 cursor-pointer group"
      title={language === 'vi' ? "Nhấp để tăng tiến độ" : "Click to increase progress"}
    >
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100 leading-tight pr-4 group-hover:text-indigo-700 dark:group-hover:text-indigo-350 transition-colors truncate">{goal.title}</h4>
        <div className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ${goal.bgSoft} ${goal.text} dark:bg-indigo-500/10 dark:text-indigo-300 dark:border dark:border-indigo-500/20`}>
          {goal.progress}%
        </div>
      </div>
      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${goal.color}`} style={{ width: `${goal.progress}%` }} />
      </div>
      {goal.progress === 100 && (
        <p className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-1">✓ {language === 'vi' ? 'Hoàn thành!' : 'Done!'}</p>
      )}
    </div>
  );

  const renderInlineGoalInput = (type: 'week'|'month'|'year', placeholder: string) => (
    <div className="mt-2 rounded-xl border border-dashed border-zinc-300 dark:border-slate-800 bg-zinc-50/70 dark:bg-slate-900/50 p-3">
      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-slate-400">
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
          className="flex-1 rounded-lg border border-zinc-300 dark:border-slate-700 bg-white dark:bg-slate-850 px-3 py-2 text-sm font-medium text-zinc-900 dark:text-slate-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
        />
        <button
          onClick={() => addGoal(type)}
          className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 dark:bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:hover:bg-indigo-705 cursor-pointer shrink-0"
        >
          <Plus size={14} />
          {language === 'vi' ? "Thêm" : "Add"}
        </button>
      </div>
    </div>
  );

  const renderUpgradeModal = () => {
    if (!showUpgradeModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-slate-900 border border-indigo-500/35 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl"></div>

          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto animate-pulse">
            <Sparkles size={28} />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold tracking-tight text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {language === 'vi' ? "Mở Khóa Giới Hạn Mục Tiêu" : "Unlock Unlimited Goals"}
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto">
              {language === 'vi'
                ? "Tài khoản thường bị giới hạn tối đa 3 mục tiêu. Hãy nâng cấp lên Premium để lập kế hoạch không giới hạn!"
                : "Free accounts are limited to 3 goals. Upgrade to Premium for unlimited planning!"}
            </p>
          </div>

          <div className="bg-slate-950/40 border border-white/[0.04] rounded-2xl p-4 text-left text-xs space-y-2 text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-indigo-400 font-bold">✓</span>
              <span>{language === 'vi' ? "Không giới hạn Mục tiêu & Thói quen" : "Unlimited Goals & Habits"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-400 font-bold">✓</span>
              <span>{language === 'vi' ? "Biểu đồ phân tích tiến độ nâng cao" : "Advanced progress charts"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-400 font-bold">✓</span>
              <span>{language === 'vi' ? "Trợ lý AI lập kế hoạch thông minh" : "AI Coach scheduling mentor"}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold transition-all border border-white/[0.05] cursor-pointer"
            >
              {language === 'vi' ? "Để sau" : "Maybe Later"}
            </button>
            <button
              onClick={() => {
                setShowUpgradeModal(false);
                navigate("/pricing");
              }}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 text-center flex items-center justify-center cursor-pointer border border-transparent"
            >
              {language === 'vi' ? "Nâng cấp ngay" : "Upgrade Now"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto font-sans text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="pt-6 sm:pt-8 pb-5 sm:pb-6 px-4 sm:px-8 flex items-center justify-between flex-shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-10 gap-3">
        <div>
          <h1 className="text-[1.3rem] sm:text-[1.6rem] font-extrabold tracking-tight text-slate-900 dark:text-slate-50">{language === 'vi' ? "Bảng tầm nhìn và mục tiêu" : "Vision Board & Goals"}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 dark:text-slate-400">{language === 'vi' ? "La bàn định hướng và phân rã mục tiêu dài hạn" : "Compass for long-term goal breakdown"}</p>
        </div>
        <button
          onClick={() => {
            const totalGoals = weeklyGoals.length + monthlyGoals.length + yearlyGoals.length;
            if (!user?.isPremium && totalGoals >= 3) {
              setShowUpgradeModal(true);
              return;
            }
            const el = document.getElementById("goal-input-year");
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
            (el as HTMLInputElement | null)?.focus();
          }}
          className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md shadow-indigo-200 dark:shadow-none cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">{language === 'vi' ? "Thêm mục tiêu" : "Add Goal"}</span>
          <span className="sm:hidden">+</span>
        </button>
      </div>

      <div className="flex-1 p-4 sm:p-8 space-y-8 sm:space-y-10 max-w-[1440px] mx-auto w-full pb-12">
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
            <div className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center">
              <Target className="w-4 h-4 text-zinc-600 dark:text-slate-350" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-slate-100">
              {language === 'vi' ? "Bảng Tầm Nhìn" : "Vision Board"}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {VISION_ITEMS.map(item => (
              <div key={item.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-zinc-200 dark:border-slate-800 shadow-sm flex flex-col hover:border-zinc-300 dark:hover:border-slate-700 hover:shadow-md transition-all">
                <div className={`w-10 h-10 rounded-lg ${item.bg} dark:bg-slate-850 border ${item.color.replace('text-', 'border-').replace('500', '200')} dark:border-slate-800 flex items-center justify-center mb-3 mt-1`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <h3 className="font-semibold text-zinc-950 dark:text-slate-100 text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-zinc-500 dark:text-slate-400 leading-relaxed min-h-[40px]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mục tiêu Phân rã */}
        <div className="pb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center">
              <Calendar className="w-4 h-4 text-zinc-600 dark:text-slate-350" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-slate-100">
              {language === 'vi' ? "Phân Rã Mục Tiêu" : "Goal Breakdown"}
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Tuần */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-zinc-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-zinc-200 dark:border-slate-800 bg-zinc-50/50 dark:bg-slate-900/55">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-zinc-950 dark:text-slate-100 flex items-center gap-2 text-sm tracking-tight">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {language === 'vi' ? "Mục tiêu Tuần" : "Weekly Goals"}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1">{language === 'vi' ? "Hành động ngắn hạn" : "Short-term actions"}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-55 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/20">{weeklyGoals.length}</span>
                </div>
              </div>
              <div className="p-5 space-y-3 flex-1 bg-white dark:bg-slate-900">
                {weeklyGoals.map(g => renderGoalCard(g, 'week'))}
                {renderInlineGoalInput('week', language === 'vi' ? "Ví dụ: Hoàn thành 3 buổi tập trong tuần" : "Example: Finish 3 workouts this week")}
              </div>
            </div>

            {/* Tháng */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-zinc-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-zinc-200 dark:border-slate-800 bg-zinc-50/50 dark:bg-slate-900/55">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-zinc-950 dark:text-slate-100 flex items-center gap-2 text-sm tracking-tight">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      {language === 'vi' ? "Mục tiêu Tháng" : "Monthly Goals"}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1">{language === 'vi' ? "Xây dựng nền tảng" : "Building foundations"}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-55 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-500/20">{monthlyGoals.length}</span>
                </div>
              </div>
              <div className="p-5 space-y-3 flex-1 bg-white dark:bg-slate-900">
                {monthlyGoals.map(g => renderGoalCard(g, 'month'))}
                {renderInlineGoalInput('month', language === 'vi' ? "Ví dụ: Hoàn thành khóa học React trong tháng" : "Example: Finish React course this month")}
              </div>
            </div>

            {/* Năm */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-zinc-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-zinc-200 dark:border-slate-800 bg-zinc-50/50 dark:bg-slate-900/55">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-zinc-950 dark:text-slate-100 flex items-center gap-2 text-sm tracking-tight">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      {language === 'vi' ? "Mục tiêu Năm" : "Yearly Goals"}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1">{language === 'vi' ? "Định hướng cốt lõi" : "Core directions"}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-55 dark:bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-100 dark:border-purple-500/20">{yearlyGoals.length}</span>
                </div>
              </div>
              <div className="p-5 space-y-3 flex-1 bg-white dark:bg-slate-900">
                {yearlyGoals.map(g => renderGoalCard(g, 'year'))}
                {renderInlineGoalInput('year', language === 'vi' ? "Ví dụ: Đạt chứng chỉ hoặc hoàn thành mục tiêu lớn trong năm" : "Example: Reach a major goal this year")}
              </div>
            </div>

          </div>
        </div>
      </div>
      {renderUpgradeModal()}
    </div>
  );
}
