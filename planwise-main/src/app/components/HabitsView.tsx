import { Plus, Flame, Calendar, CheckCircle2 } from "lucide-react";
import { COLOR_MAP } from "../data/mockData";
import { useData } from "../context/DataContext";
import { HintBubble } from "./HintBubble";

export function HabitsView() {
  const { habits, toggleHabitDate, language } = useData();

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

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto font-sans text-slate-900">
      {/* Header */}
      <div className="pt-8 pb-6 px-8 flex items-center justify-between flex-shrink-0 border-b border-slate-200 bg-white sticky top-0 z-10">
        <div>
          <h1 className="text-[1.6rem] font-extrabold tracking-tight text-slate-900">{language === 'vi' ? "Theo dõi thói quen" : "Habit Tracker"}</h1>
          <p className="text-sm text-slate-500 mt-1">{language === 'vi' ? "Xây dựng kỷ luật hàng ngày" : "Build daily discipline"}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md shadow-indigo-200 cursor-pointer">
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
             const colors = COLOR_MAP[habit.color];
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
    </div>
  );
}
