import { NavLink } from "react-router";
import {
  LayoutDashboard, Calendar, CheckSquare, FolderKanban,
  ChevronLeft, ChevronRight, User, Tag, Plus, Target,
  Activity, Globe, BarChart2, Sparkles, Moon, Sun,
} from "lucide-react";
import { useState } from "react";
import { useData } from "../context/DataContext";
import { COLOR_MAP } from "../data/mockData";
import { CategoryModal } from "./CategoryModal";
import { useTheme } from "next-themes";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const MARCH_2026 = { startDay: 0, totalDays: 31, today: 12 };

function MiniCalendar() {
  const days = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  const cells: (number | null)[] = [];
  for (let i = 0; i < MARCH_2026.startDay; i++) cells.push(null);
  for (let i = 1; i <= MARCH_2026.totalDays; i++) cells.push(i);

  return (
    <div className="px-3 pb-4">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mar 2026</span>
        <div className="flex gap-0.5">
          <button className="text-slate-500 hover:text-slate-200 transition-colors p-0.5 rounded">
            <ChevronLeft size={12} />
          </button>
          <button className="text-slate-500 hover:text-slate-200 transition-colors p-0.5 rounded">
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map(d => (
          <div key={d} className="text-center text-[9px] text-slate-600 font-semibold py-0.5 uppercase">{d}</div>
        ))}
        {cells.map((day, i) => (
          <div
            key={i}
            className={`text-center text-[11px] py-[3px] rounded cursor-pointer leading-5 transition-colors ${
              day === null ? "" : "hover:bg-white/10 text-slate-400"
            } ${day === MARCH_2026.today
                ? "!bg-indigo-500 !text-white font-bold shadow-sm shadow-indigo-900"
                : ""
            } ${day !== null && day >= 9 && day <= 15 && day !== MARCH_2026.today
                ? "bg-white/5 !text-slate-300"
                : ""
            }`}
          >
            {day ?? ""}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { categories, language, toggleLanguage } = useData();
  const { theme, setTheme } = useTheme();
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const navItems = [
    { path: "/",          label: language === "vi" ? "Bảng điều khiển"        : "Dashboard",       icon: LayoutDashboard },
    { path: "/tasks",     label: language === "vi" ? "Công việc"              : "Tasks",           icon: CheckSquare     },
    { path: "/timetable", label: language === "vi" ? "Lịch làm việc"         : "Calendar",        icon: Calendar        },
    { path: "/goals",     label: language === "vi" ? "Tầm nhìn & Mục tiêu"   : "Vision & Goals",  icon: Target          },
    { path: "/habits",    label: language === "vi" ? "Theo dõi thói quen"     : "Habits",          icon: Activity        },
    { path: "/analytics", label: language === "vi" ? "Phân tích"             : "Analytics",       icon: BarChart2       },
  ];

  return (
    <div
      className={`relative flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out
        ${isOpen ? "w-[230px]" : "w-16"}
        bg-[#0F1629] border-r border-white/[0.05]`}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/[0.06] h-16">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-900/40">
          <Sparkles size={14} className="text-white" />
        </div>
        {isOpen && (
          <div className="min-w-0">
            <div className="text-white font-black text-[15px] tracking-tight leading-tight" style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>
              Plan<span className="text-indigo-400">Wise</span>
            </div>
            <div className="text-slate-500 text-[9px] uppercase tracking-[0.15em] font-bold mt-0.5">
              {language === "vi" ? "Quản lý thời gian" : "Time manager"}
            </div>
          </div>
        )}
      </div>

      {/* ── Collapse toggle ── */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-[26px] w-6 h-6 bg-[#1e2a45] border border-white/10 rounded-full flex items-center justify-center text-slate-400 shadow-lg hover:bg-indigo-600 hover:text-white hover:border-indigo-500 z-20 transition-all"
      >
        {isOpen ? <ChevronLeft size={11} /> : <ChevronRight size={11} />}
      </button>

      {/* ── Navigation ── */}
      <nav className="py-5 px-2.5 space-y-0.5">
        {isOpen && (
          <div className="px-2.5 mb-2">
            <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">
              {language === "vi" ? "Điều hướng" : "Main"}
            </span>
          </div>
        )}
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150
              ${isActive
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 shadow-sm"
                : "text-slate-500 hover:bg-white/5 hover:text-slate-200 border border-transparent"
              }
            `}
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={`flex-shrink-0 ${isActive ? "text-indigo-400" : ""}`} />
                {isOpen && (
                  <span className={`text-[13px] font-semibold tracking-tight ${isActive ? "text-indigo-200" : ""}`}>
                    {label}
                  </span>
                )}
                {isOpen && isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Divider ── */}
      {isOpen && <div className="mx-4 border-t border-white/[0.05] my-1" />}

      {/* ── Categories ── */}
      {isOpen && (
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2.5">
            <Tag size={11} className="text-slate-600" />
            <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold flex-1">
              {language === "vi" ? "Danh mục" : "Categories"}
            </span>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="text-slate-600 hover:text-slate-200 transition-colors p-0.5 rounded hover:bg-white/10"
            >
              <Plus size={11} />
            </button>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {categories.map(cat => {
              const colors = COLOR_MAP[cat.color];
              return (
                <div key={cat.id} className="flex items-center gap-2.5 group cursor-pointer px-1.5 py-1 rounded-lg hover:bg-white/5 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
                  <span className="text-[12px] text-slate-500 truncate flex-1 group-hover:text-slate-300 transition-colors font-medium">{cat.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1" />

      {/* ── Mini Calendar ── */}
      {isOpen && (
        <div className="border-t border-white/[0.05] pt-4 mx-1">
          <div className="px-3 mb-2">
            <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">
              {language === "vi" ? "Tháng này" : "This month"}
            </span>
          </div>
          <MiniCalendar />
        </div>
      )}

      {/* ── User profile ── */}
      <div className="border-t border-white/[0.05] p-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-600/30 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <User size={14} className="text-indigo-300" />
          </div>
          {isOpen && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-slate-200 font-semibold truncate tracking-tight">Nguyễn Văn A</div>
                <div className="text-[10px] text-slate-600 truncate">{language === "vi" ? "Người dùng" : "User"}</div>
              </div>
              <button
                onClick={toggleLanguage}
                title={language === "vi" ? "Switch to English" : "Chuyển tiếng Việt"}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-indigo-600 hover:border-indigo-500 transition-all group"
              >
                <Globe size={11} className="text-slate-400 group-hover:text-white transition-colors" />
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-white transition-colors">
                  {language === "vi" ? "VI" : "EN"}
                </span>
              </button>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title={theme === "dark" ? "Chuyển light mode" : "Chuyển dark mode"}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-indigo-600 hover:border-indigo-500 transition-all group"
              >
                {theme === "dark" ? (
                  <Sun size={11} className="text-slate-400 group-hover:text-white transition-colors" />
                ) : (
                  <Moon size={11} className="text-slate-400 group-hover:text-white transition-colors" />
                )}
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-white transition-colors">
                  {theme === "dark" ? "Light" : "Dark"}
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {showCategoryModal && <CategoryModal onClose={() => setShowCategoryModal(false)} />}
    </div>
  );
}
