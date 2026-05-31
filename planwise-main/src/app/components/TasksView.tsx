import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Check,
  Trash2,
  X,
  Flag,
  Calendar,
  FolderKanban,
  AlertCircle,
  Circle,
  Edit2,
  Play,
  Pause,
  RotateCcw,
  TimerReset,
  Brain,
  Zap,
  XCircle,
} from "lucide-react";
import { useData } from "../context/DataContext";
import { COLOR_MAP, type Task, type EventColor } from "../data/mockData";
import { FocusView } from "./FocusView";
import { HintBubble } from "./HintBubble";

const PRIORITY_COLORS: Record<string, string> = {
  Cao: "text-rose-600 bg-rose-50 border-rose-200",
  "Trung bình": "text-amber-600 bg-amber-50 border-amber-200",
  Thấp: "text-emerald-600 bg-emerald-50 border-emerald-200",
};

const PRIORITY_DOT: Record<string, string> = {
  Cao: "bg-rose-500",
  "Trung bình": "bg-amber-500",
  Thấp: "bg-emerald-500",
};

const EVENT_COLORS: EventColor[] = ["indigo", "blue", "emerald", "amber", "rose", "purple", "teal", "orange"];

interface TaskModalProps {
  task?: Task;
  onClose: () => void;
  onSave: (task: Omit<Task, "id"> | Task) => void;
}

type FocusMethodKey = "pomodoro" | "sprint" | "deep";

const FOCUS_METHODS: Record<
  FocusMethodKey,
  { label: string; minutes: number; helper: string; accent: string }
> = {
  pomodoro: {
    label: "Pomodoro 25'",
    minutes: 25,
    helper: "Phù hợp để vào việc nhanh và giữ nhịp đều.",
    accent: "from-rose-500 to-orange-400",
  },
  sprint: {
    label: "Sprint 50'",
    minutes: 50,
    helper: "Lý tưởng cho một phiên làm việc sâu vừa phải.",
    accent: "from-indigo-500 to-violet-500",
  },
  deep: {
    label: "Deep Work 90'",
    minutes: 90,
    helper: "Dành cho việc quan trọng cần tập trung dài hơi.",
    accent: "from-emerald-500 to-teal-400",
  },
};

function formatFocusTime(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function FocusSessionOverlay({
  task,
  onClose,
  onCompleteTask,
}: {
  task: Task;
  onClose: () => void;
  onCompleteTask: (id: number) => void;
}) {
  const [selectedMethod, setSelectedMethod] = useState<FocusMethodKey>("pomodoro");
  const [isRunning, setIsRunning] = useState(false);
  const initialSeconds = FOCUS_METHODS[selectedMethod].minutes * 60;
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    setTimeLeft(FOCUS_METHODS[selectedMethod].minutes * 60);
    setIsRunning(false);
  }, [selectedMethod, task.id]);

  useEffect(() => {
    if (!isRunning) return;
    if (timeLeft <= 0) {
      setIsRunning(false);
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning, timeLeft]);

  const method = FOCUS_METHODS[selectedMethod];
  const progress = useMemo(() => {
    const total = method.minutes * 60;
    return ((total - timeLeft) / total) * 100;
  }, [method.minutes, timeLeft]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950 px-6 py-8 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.28),_transparent_32%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.18),_transparent_25%)]" />
      <button
        onClick={onClose}
        className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
      >
        <XCircle size={16} />
        Thoát focus
      </button>

      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center justify-center gap-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200/80">Focus Mode</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white">{task.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
            {task.description || "Chỉ giữ lại một việc quan trọng này trên màn hình để bạn bắt đầu tập trung ngay."}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {(Object.entries(FOCUS_METHODS) as [FocusMethodKey, (typeof FOCUS_METHODS)[FocusMethodKey]][]).map(([key, option]) => (
            <button
              key={key}
              onClick={() => setSelectedMethod(key)}
              className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                selectedMethod === key
                  ? "border-white/20 bg-white text-slate-950 shadow-[0_12px_40px_-18px_rgba(255,255,255,0.55)]"
                  : "border-white/10 bg-white/5 text-white/85 hover:bg-white/10"
              }`}
            >
              <div className="text-sm font-bold">{option.label}</div>
              <div className={`mt-2 h-1.5 rounded-full bg-gradient-to-r ${option.accent}`} />
              <div className={`mt-2 text-xs leading-relaxed ${selectedMethod === key ? "text-slate-600" : "text-slate-300"}`}>
                {option.helper}
              </div>
            </button>
          ))}
        </div>

        <div className="relative flex h-[360px] w-[360px] items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-[0_30px_120px_-40px_rgba(79,70,229,0.65)] backdrop-blur">
          <div
            className="absolute inset-3 rounded-full"
            style={{
              background: `conic-gradient(rgba(255,255,255,0.95) ${progress}%, rgba(255,255,255,0.06) ${progress}% 100%)`,
              mask: "radial-gradient(farthest-side, transparent calc(100% - 16px), black calc(100% - 15px))",
              WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 16px), black calc(100% - 15px))",
            }}
          />
          <div className="relative flex h-[300px] w-[300px] flex-col items-center justify-center rounded-full border border-white/10 bg-slate-950/80 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200">
              <Brain size={13} />
              {method.label}
            </div>
            <div className="text-6xl font-black tracking-tight text-white sm:text-7xl">{formatFocusTime(timeLeft)}</div>
            <p className="mt-3 max-w-[220px] text-sm leading-relaxed text-slate-300">{method.helper}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setIsRunning((prev) => !prev)}
            className={`inline-flex min-w-[170px] items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-extrabold shadow-[0_18px_40px_-20px_rgba(99,102,241,0.9)] transition ${
              isRunning
                ? "border border-amber-300/30 bg-gradient-to-r from-amber-300 via-orange-300 to-amber-200 text-slate-950 hover:brightness-105"
                : "bg-gradient-to-r from-white via-indigo-50 to-violet-100 text-indigo-950 hover:brightness-105"
            }`}
          >
            {isRunning ? <Pause size={17} className="text-slate-950" /> : <Play size={17} className="text-indigo-700" />}
            {isRunning ? "Tạm dừng" : "Bắt đầu"}
          </button>
          <button
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(method.minutes * 60);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <RotateCcw size={15} />
            Làm lại
          </button>
          <button
            onClick={() => onCompleteTask(task.id)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
          >
            <Check size={16} />
            Đánh dấu hoàn thành
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
            <TimerReset size={13} />
            Hạn: {task.dueDate}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
            <Zap size={13} />
            Ưu tiên: {task.priority}
          </span>
        </div>
      </div>
    </div>
  );
}

function TaskModal({ task, onClose, onSave }: TaskModalProps) {
  const { categories } = useData();
  const [form, setForm] = useState({
    title: task?.title || "",
    categoryId: task?.categoryId || (categories[0]?.id || 0),
    dueDate: task?.dueDate || "",
    priority: (task?.priority || "Trung bình") as Task["priority"],
    color: task?.color || "indigo" as EventColor,
    description: task?.description || "",
    completed: task?.completed || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    
    if (task) {
      onSave({ ...task, ...form });
    } else {
      onSave({
        title: form.title,
        categoryId: form.categoryId,
        dueDate: form.dueDate || "Chưa có",
        priority: form.priority,
        completed: false,
        color: form.color,
        description: form.description,
      });
    }
    onClose();
  };

  const selectedCategory = categories.find(c => c.id === form.categoryId);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="bg-white rounded-xl shadow-2xl w-[420px] overflow-hidden border border-zinc-200 ring-1 ring-black/5" onClick={(e) => e.stopPropagation()}>
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50/50">
          <div>
            <h3 className="text-base font-semibold text-zinc-950 tracking-tight">
              {task ? "Chỉnh sửa công việc" : "Thêm công việc mới"}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">{task ? "Cập nhật thông tin task" : "Điền thông tin để tạo task mới"}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 p-1.5 rounded-md hover:bg-zinc-100 transition-colors">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-600 mb-1.5 block uppercase tracking-wider">Tiêu đề *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="VD: Hoàn thành báo cáo"
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:border-zinc-400 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1.5 block uppercase tracking-wider">Danh mục</label>
              <select
                value={form.categoryId}
                onChange={(e) => {
                  const catId = parseInt(e.target.value);
                  const cat = categories.find(c => c.id === catId);
                  setForm({ ...form, categoryId: catId, color: cat?.color || form.color });
                }}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:border-zinc-400 transition-all bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1.5 block uppercase tracking-wider">Hạn chót</label>
              <input
                type="text"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                placeholder="VD: 20 Th3"
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:border-zinc-400 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-600 mb-2 block uppercase tracking-wider">Mức độ ưu tiên</label>
            <div className="flex gap-2">
              {(["Cao", "Trung bình", "Thấp"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm({ ...form, priority: p })}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    form.priority === p ? PRIORITY_COLORS[p] : "border-zinc-200 text-zinc-500 bg-white hover:bg-zinc-50 hover:border-zinc-300"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-600 mb-1.5 block uppercase tracking-wider">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Thêm chi tiết..."
              rows={2}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:border-zinc-400 transition-all resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2 border-t border-zinc-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-zinc-300 text-zinc-700 text-sm font-semibold py-2 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 bg-zinc-900 text-white text-sm font-semibold py-2 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              {task ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onToggle,
  onDelete,
  onEdit,
  onFocus,
}: {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (task: Task) => void;
  onFocus: (task: Task) => void;
}) {
  const { categories } = useData();
  const category = categories.find(c => c.id === task.categoryId);
  const colors = category ? COLOR_MAP[category.color] : COLOR_MAP[task.color];

  return (
    <div
      className={`
        group bg-white rounded-lg border border-zinc-200 p-4 hover:border-zinc-300 hover:shadow-sm
        transition-all duration-150 ${task.completed ? "opacity-50 grayscale" : ""}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id)}
          className={`
            mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all
            ${task.completed
              ? `bg-zinc-900 border-zinc-900`
              : "border-zinc-300 hover:border-zinc-500"
            }
          `}
        >
          {task.completed && <Check size={11} className="text-white" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0" onClick={() => !task.completed && onEdit(task)} style={{ cursor: task.completed ? 'default' : 'pointer' }}>
          <div className="flex items-start justify-between gap-2">
            <h4
              className={`text-sm font-semibold tracking-tight text-zinc-900 leading-tight ${task.completed ? "line-through text-zinc-500" : ""}`}
            >
              {task.title}
            </h4>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!task.completed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                  className="text-zinc-400 hover:text-zinc-900 transition-all flex-shrink-0 p-1 rounded hover:bg-zinc-100"
                >
                  <Edit2 size={13} />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                className="text-zinc-400 hover:text-rose-600 transition-all flex-shrink-0 p-1 rounded hover:bg-rose-50"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

            <p className="text-xs text-zinc-500 mt-1 leading-relaxed line-clamp-2">{task.description}</p>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {/* Category badge */}
            {category && (
              <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-md font-semibold border ${colors.badge} bg-transparent`}>
                <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                {category.name}
              </span>
            )}

            {/* Due date */}
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-zinc-600 bg-zinc-100 px-2 py-1 rounded-md border border-zinc-200">
              <Calendar size={10} />
              {task.dueDate}
            </span>

            {/* Priority */}
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-md border font-semibold ${PRIORITY_COLORS[task.priority].replace('bg-', 'bg-transparent text-').replace('text-', '')}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
              {task.priority}
            </span>

            {!task.completed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFocus(task);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
              >
                <Play size={10} />
                Bắt đầu tập trung
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type FilterTab = "Tất cả" | "Đang làm" | "Hoàn thành" | "Tập trung";

export function TasksView() {
  const { tasks, categories, updateTask, deleteTask, addTask } = useData();
  const [filter, setFilter] = useState<FilterTab>("Tất cả");
  const [priorityFilter, setPriorityFilter] = useState<string>("Tất cả");
  const [search, setSearch] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [focusTask, setFocusTask] = useState<Task | null>(null);

  const toggleTask = (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      updateTask(id, { completed: !task.completed });
    }
  };

  const handleDeleteTask = (id: number) => {
    deleteTask(id);
  };

  const handleSaveTask = (taskData: Omit<Task, "id"> | Task) => {
    if ('id' in taskData) {
      // Editing existing task
      updateTask(taskData.id, taskData);
    } else {
      // Adding new task
      addTask(taskData);
    }
  };

  const filtered = tasks.filter((t) => {
    const matchFilter =
      filter === "Tất cả"
        ? true
        : filter === "Đang làm" || filter === "Tập trung"
        ? !t.completed
        : t.completed;
    const matchPriority = priorityFilter === "Tất cả" ? true : t.priority === priorityFilter;
    const matchSearch =
      search === "" ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchPriority && matchSearch;
  });

  const pending = tasks.filter((t) => !t.completed).length;
  const completed = tasks.filter((t) => t.completed).length;
  const highPriority = tasks.filter((t) => !t.completed && t.priority === "Cao").length;

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-[1.6rem] font-extrabold tracking-tight text-slate-900">Công việc</h1>
          <p className="text-sm text-slate-500 mt-1">{pending} đang làm · {completed} hoàn thành</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md shadow-indigo-200"
        >
          <Plus size={16} />
          Thêm công việc
        </button>
      </div>

      {/* Stats bar */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 text-sm text-slate-600">
            <div className="w-8 h-8 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-center shadow-sm">
              <AlertCircle size={14} className="text-rose-500" />
            </div>
            <span className="text-sm"><span className="font-bold text-slate-900">{highPriority}</span> ưu tiên cao</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-slate-600">
            <div className="w-8 h-8 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center shadow-sm">
              <Circle size={14} className="text-amber-500" />
            </div>
            <span className="text-sm"><span className="font-bold text-slate-900">{pending}</span> đang làm</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center shadow-sm">
              <Check size={14} className="text-emerald-500" />
            </div>
            <span className="text-sm"><span className="font-bold text-slate-900">{completed}</span> hoàn thành</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-64 max-w-full">
          <div className="flex justify-between text-xs font-medium text-zinc-500 mb-2">
            <span>Tiến độ tổng thể</span>
            <span className="text-zinc-900">{tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0}%</span>
          </div>
          <div className="h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50">
            <div
              className="h-full bg-zinc-900 rounded-full transition-all duration-500"
              style={{ width: `${tasks.length > 0 ? (completed / tasks.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white border-b border-zinc-200 px-8 py-4 flex items-center justify-between gap-4 flex-shrink-0">
        {/* Status tabs */}
        <div className="flex items-center bg-zinc-100/80 rounded-lg p-1 border border-zinc-200">
          {(["Tất cả", "Đang làm", "Hoàn thành", "Tập trung"] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                filter === tab ? "bg-white shadow-sm text-zinc-950 ring-1 ring-zinc-200" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Priority filter */}
          <div className="flex items-center gap-2 px-3 py-1.5 border border-zinc-200 rounded-md bg-zinc-50">
            <Flag size={14} className="text-zinc-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-sm font-medium border-none bg-transparent text-zinc-700 focus:outline-none cursor-pointer"
            >
              <option value="Tất cả">Tất cả mức độ</option>
              <option value="Cao">Cao</option>
              <option value="Trung bình">Trung bình</option>
              <option value="Thấp">Thấp</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-md px-3 py-1.5 w-64 shadow-sm focus-within:ring-1 focus-within:ring-zinc-400 focus-within:border-zinc-400 transition-all">
            <Search size={14} className="text-zinc-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Tìm kiếm công việc..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm font-medium focus:outline-none flex-1 placeholder:text-zinc-400 text-zinc-900"
            />
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[1000px] mx-auto">
        <HintBubble
          id="tasks_intro"
          title="Công việc"
          color="amber"
          persistent={false}
          className="mb-6"
        >
          Mục này giúp bạn gom toàn bộ việc cần làm vào một nơi, lọc theo trạng thái hoặc mức ưu tiên, rồi xử lý từng việc theo đúng nhịp thay vì bị quá tải.
        </HintBubble>
        {filter === "Tập trung" ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50 p-5 shadow-sm dark:border-indigo-500/20 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950/60">
              <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">Chọn một task để vào Focus Mode</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Mỗi công việc đều có nút <span className="font-semibold text-indigo-600 dark:text-indigo-300">Bắt đầu tập trung</span>. Khi bấm vào, màn hình sẽ chuyển sang giao diện chỉ còn đồng hồ và phương pháp làm việc bạn chọn.
              </p>
            </div>
            <FocusView />
            <div className="space-y-3">
              {tasks
                .filter((t) => !t.completed)
                .sort((a, b) => {
                  const order = { Cao: 0, "Trung bình": 1, Thấp: 2 };
                  return order[a.priority as keyof typeof order] - order[b.priority as keyof typeof order];
                })
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onDelete={handleDeleteTask}
                    onEdit={setEditingTask}
                    onFocus={setFocusTask}
                  />
                ))}
            </div>
            </div>
          ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-4">
            <div className="w-16 h-16 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 flex items-center justify-center">
              <FolderKanban size={24} className="text-zinc-400" />
            </div>
            <p className="text-sm font-medium">Không có công việc nào thoả mãn</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-sm font-semibold text-zinc-900 transition-colors border border-zinc-200 rounded-md px-4 py-2 hover:bg-zinc-100 shadow-sm"
            >
              Thêm công việc mới
            </button>
          </div>
        ) : (
          <>
            {/* Pending tasks */}
            {filter !== "Hoàn thành" && filtered.filter((t) => !t.completed).length > 0 && (
              <div className="mb-8">
                {filter === "Tất cả" && (
                  <h3 className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-4 px-1 flex items-center gap-2">
                    Đang làm <span className="bg-zinc-200 text-zinc-700 rounded-full px-2 py-0.5 text-[10px]">{filtered.filter((t) => !t.completed).length}</span>
                  </h3>
                )}
                <div className="space-y-3">
                  {filtered
                    .filter((t) => !t.completed)
                    .sort((a, b) => {
                      const order = { Cao: 0, "Trung bình": 1, Thấp: 2 };
                      return order[a.priority as keyof typeof order] - order[b.priority as keyof typeof order];
                    })
                    .map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={toggleTask}
                        onDelete={handleDeleteTask}
                        onEdit={setEditingTask}
                        onFocus={setFocusTask}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Completed tasks */}
            {filter !== "Đang làm" && filtered.filter((t) => t.completed).length > 0 && (
              <div>
                {filter === "Tất cả" && (
                  <h3 className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-4 px-1 flex items-center gap-2">
                    Hoàn thành <span className="bg-zinc-200 text-zinc-700 rounded-full px-2 py-0.5 text-[10px]">{filtered.filter((t) => t.completed).length}</span>
                  </h3>
                )}
                <div className="space-y-3">
                  {filtered
                    .filter((t) => t.completed)
                    .map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={toggleTask}
                        onDelete={handleDeleteTask}
                        onEdit={setEditingTask}
                        onFocus={setFocusTask}
                      />
                    ))}
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </div>

      {showAddModal && (
        <TaskModal onClose={() => setShowAddModal(false)} onSave={handleSaveTask} />
      )}
      {editingTask && (
        <TaskModal task={editingTask} onClose={() => setEditingTask(null)} onSave={handleSaveTask} />
      )}
      {focusTask && (
        <FocusSessionOverlay
          task={focusTask}
          onClose={() => setFocusTask(null)}
          onCompleteTask={(id) => {
            updateTask(id, { completed: true });
            setFocusTask(null);
          }}
        />
      )}
    </div>
  );
}
