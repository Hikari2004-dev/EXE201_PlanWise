import { useState } from "react";
import { Plus, Flame, Calendar, CheckCircle2, Sparkles, X } from "lucide-react";
import { COLOR_MAP, EventColor } from "../data/mockData";
import { useData } from "../context/DataContext";
import { HintBubble } from "./HintBubble";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";

export function HabitsView() {
  const { habits, addHabit, toggleHabitDate, language } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("daily");
  const [color, setColor] = useState<EventColor>("indigo");

  const getFrequencyLabel = (frequency: string) => {
    const labels = language === 'vi' ? {
      daily: "Hàng ngày",
      weekly: "Hàng tuần", 
      monthly: "Hàng tháng"
    } : {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly"
    };
    return labels[frequency as keyof typeof labels] || frequency;
  };

  const isCompletedToday = (habit: any) => {
    const today = new Date().toISOString().split('T')[0];
    return habit.completedDates.includes(today);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addHabit({
      title: title.trim(),
      description: description.trim(),
      frequency,
      targetCount: 1,
      color,
    });

    setTitle("");
    setDescription("");
    setFrequency("daily");
    setColor("indigo");
    setShowAddModal(false);
  };

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
              {language === 'vi' ? "Mở Khóa Giới Hạn Thói Quen" : "Unlock Unlimited Habits"}
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto">
              {language === 'vi'
                ? "Tài khoản thường bị giới hạn tối đa 3 thói quen. Hãy nâng cấp lên Premium để tạo thói quen không giới hạn!"
                : "Free accounts are limited to 3 habits. Upgrade to Premium for unlimited habits!"}
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

  const renderAddModal = () => {
    if (!showAddModal) return null;

    const colors: EventColor[] = ["indigo", "blue", "emerald", "amber", "rose", "purple", "teal", "orange"];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-4 text-slate-900 dark:text-slate-100">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/[0.05]">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {language === 'vi' ? "Tạo Thói Quen Mới" : "Create New Habit"}
            </h3>
            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleAddSubmit} className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                {language === 'vi' ? "Tên thói quen" : "Habit Title"}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={language === 'vi' ? "Ví dụ: Đọc sách, Uống nước..." : "Example: Read books, Drink water..."}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                {language === 'vi' ? "Mô tả ngắn" : "Short Description"}
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={language === 'vi' ? "Mục tiêu cụ thể mỗi ngày..." : "Specific daily target..."}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                {language === 'vi' ? "Tần suất" : "Frequency"}
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="daily" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{language === 'vi' ? "Hàng ngày" : "Daily"}</option>
                <option value="weekly" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{language === 'vi' ? "Hàng tuần" : "Weekly"}</option>
                <option value="monthly" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{language === 'vi' ? "Hàng tháng" : "Monthly"}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                {language === 'vi' ? "Màu sắc chủ đề" : "Theme Color"}
              </label>
              <div className="flex gap-2 flex-wrap">
                {colors.map((c) => {
                  const mapped = COLOR_MAP[c];
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full ${mapped.bg} flex items-center justify-center transition-all border-2 
                        ${color === c ? "border-slate-800 dark:border-white scale-110 shadow-md" : "border-transparent opacity-80 hover:opacity-100"} cursor-pointer`}
                      title={c}
                    />
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/10 cursor-pointer border border-transparent"
            >
              {language === 'vi' ? "Tạo thói quen" : "Create Habit"}
            </button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto font-sans text-slate-900">
      {/* Header */}
      <div className="pt-8 pb-6 px-8 flex items-center justify-between flex-shrink-0 border-b border-slate-200 bg-white sticky top-0 z-10">
        <div>
          <h1 className="text-[1.6rem] font-extrabold tracking-tight text-slate-900">{language === 'vi' ? "Theo dõi thói quen" : "Habit Tracker"}</h1>
          <p className="text-sm text-slate-500 mt-1">{language === 'vi' ? "Xây dựng kỷ luật hàng ngày" : "Build daily discipline"}</p>
        </div>
        <button
          onClick={() => {
            if (!user?.isPremium && habits.length >= 3) {
              setShowUpgradeModal(true);
              return;
            }
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md shadow-indigo-200 cursor-pointer"
        >
          <Plus size={16} />
          {language === 'vi' ? "Thêm thói quen" : "Add Habit"}
        </button>
      </div>

      <div className="flex-1 p-8 space-y-6 max-w-[1440px] mx-auto w-full pb-12">
        <HintBubble
          id="habits_intro"
          title={language === "vi" ? "Theo dõi thói quen" : "Habit Tracker"}
          color="emerald"
          persistent={false}
        >
          {language === "vi"
            ? "Mục này giúp bạn giữ nhịp kỷ luật mỗi ngày. Bạn có thể theo dõi chuỗi hiện tại, đánh dấu hoàn thành hôm nay và quan sát thói quen nào đang bền vững hoặc dễ bị đứt quãng."
            : "Track daily discipline, mark today's completion, and monitor which habits are building momentum."}
        </HintBubble>

        {/* Habits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {habits.map((habit) => {
             const colors = COLOR_MAP[habit.color as EventColor];
             return (
              <div key={habit.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-indigo-200 transition-all relative flex flex-col group">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 pr-3">
                    <h3 className="font-semibold text-zinc-950 text-base tracking-tight truncate group-hover:text-zinc-700 transition-colors">{habit.title}</h3>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{habit.description}</p>
                  </div>
                  <div className={`text-[10px] font-semibold px-2.5 py-1 rounded-md border ${colors.badge} bg-transparent`}>
                    {getFrequencyLabel(habit.frequency)}
                  </div>
                </div>

                <div className="space-y-4 mt-auto">
                  {/* Current Streak */}
                  <div className="flex items-center justify-between bg-zinc-50/50 rounded-lg p-3 border border-zinc-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-white border border-zinc-200 shadow-sm flex flex-shrink-0 items-center justify-center">
                        <Flame className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{language === 'vi' ? "Chuỗi hiện tại" : "Current Streak"}</span>
                         <span className="font-bold text-sm text-zinc-950">{habit.currentStreak} {language === 'vi' ? "ngày" : "days"}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block">{language === 'vi' ? "Tốt nhất" : "Best"}</span>
                      <span className="font-bold text-sm text-zinc-700">{habit.bestStreak}</span>
                    </div>
                  </div>

                  {/* Today's Status */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-semibold text-zinc-700">{language === 'vi' ? "Hôm nay" : "Today"}</span>
                    <button
                      onClick={() => toggleHabitDate(habit.id, new Date().toISOString().split('T')[0])}
                      className={`
                        text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer border
                        ${isCompletedToday(habit) 
                          ? `${colors.bg} ${colors.border} text-white shadow-sm` 
                          : "bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"}
                      `}
                    >
                      <CheckCircle2 size={14} className={isCompletedToday(habit) ? "text-white" : "text-zinc-400"} />
                      {isCompletedToday(habit) ? (language === 'vi' ? "Hoàn thành" : "Completed") : (language === 'vi' ? "Đánh dấu" : "Mark it")}
                    </button>
                  </div>

                  {/* Recent Activity */}
                  <div className="border-t border-zinc-100 pt-3 mt-3">
                    <h4 className="text-[11px] text-zinc-500 font-medium mb-3 flex items-center gap-1.5">
                      <Calendar size={12} /> {language === 'vi' ? "7 ngày gần đây" : "Last 7 days"}
                    </h4>
                    <div className="flex justify-between items-center bg-zinc-50 rounded-lg p-1.5 border border-zinc-100">
                      {Array.from({ length: 7 }, (_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() - (6 - i));
                        const dateStr = date.toISOString().split('T')[0];
                        const completed = habit.completedDates.includes(dateStr);
                        
                        return (
                          <div
                            key={i}
                            className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold transition-all ${
                              completed 
                                ? `${colors.bg} text-white shadow-sm ring-1 ring-black/5` 
                                : 'bg-transparent text-zinc-400 hover:bg-zinc-200/50'
                            }`}
                            title={date.toLocaleDateString('vi-VN')}
                          >
                             {['T2','T3','T4','T5','T6','T7','CN'][date.getDay() === 0 ? 6 : date.getDay()-1]}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
             )
          })}
        </div>
      </div>
      {renderUpgradeModal()}
      {renderAddModal()}
    </div>
  );
}
