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
  ArrowRight,
  Sparkles,
  Target,
  AlertTriangle,
  Maximize2,
} from "lucide-react";
import { useData } from "../context/DataContext";
import { COLOR_MAP, type Task, type EventColor } from "../data/mockData";
import { HintBubble } from "./HintBubble";

// Normalize color to lowercase for consistent lookups
function normalizeColor(color: string | undefined): string {
  if (!color) return "indigo";
  return color.toLowerCase();
}

function toDateTimeLocalValue(value?: string) {
  if (!value) return "";
  const trimmed = value.trim();
  const dateOnly = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    return `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}T00:00`;
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDueDateLabel(dueDate?: string) {
  if (!dueDate) return "";
  const date = new Date(dueDate);
  if (Number.isNaN(date.getTime())) return dueDate;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date).replace(",", "");
}


function formatScheduledAtLabel(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date).replace(",", "");
}

function normalizeChecklistItems(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getTaskStatus(task: Task) {
  if (task.status) return task.status;
  if (task.completed) return "COMPLETED";

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  if (dueDate && !Number.isNaN(dueDate.getTime()) && dueDate < new Date()) {
    return "MISSED";
  }

  return "IN_PROGRESS";
}

function getTaskStatusLabel(status: string, language: "vi" | "en") {
  if (language === "en") {
    if (status === "COMPLETED") return "Completed";
    if (status === "MISSED") return "Missed";
    return "In Progress";
  }
  if (status === "COMPLETED") return "Hoàn thành";
  if (status === "MISSED") return "Trễ hạn";
  return "Đang làm";
}

function getTaskStatusClasses(status: string) {
  if (status === "COMPLETED") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "MISSED") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

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

// Focus Mode Constants
const MAX_PAUSE_COUNT = 3;

interface TaskModalProps {
  task?: Task;
  onClose: () => void;
  onSave: (task: Omit<Task, "id"> | Task) => Promise<void>;
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
  onCompleteTask: (id: string) => Promise<void>;
}) {
  const [selectedMethod, setSelectedMethod] = useState<FocusMethodKey>("pomodoro");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseCount, setPauseCount] = useState(0);
  const [showPreFocusDialog, setShowPreFocusDialog] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(FOCUS_METHODS["pomodoro"].minutes * 60);

  const method = FOCUS_METHODS[selectedMethod];
  const progress = useMemo(() => {
    const total = method.minutes * 60;
    return ((total - timeLeft) / total) * 100;
  }, [method.minutes, timeLeft]);

  // Fullscreen handlers
  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (err) {
      console.log("Fullscreen not supported or denied");
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (err) {
      console.log("Exit fullscreen error");
    }
  };

  // Prevent browser close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Bạn đang trong Focus Mode. Bạn có chắc muốn rời đi?";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

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

  const startFocusMode = async () => {
    setShowPreFocusDialog(false);
    await enterFullscreen();
    setIsRunning(true);
  };

  const handlePause = () => {
    if (isRunning) {
      // Đang chạy -> tạm dừng (chưa dùng lượt)
      if (pauseCount < MAX_PAUSE_COUNT) {
        setIsRunning(false);
        setIsPaused(true);
        setPauseCount((prev) => prev + 1);
        exitFullscreen();
      }
    } else if (isPaused) {
      // Đang tạm dừng -> tiếp tục (vẫn còn lượt)
      if (pauseCount < MAX_PAUSE_COUNT) {
        setIsPaused(false);
        setIsRunning(true);
        enterFullscreen();
      }
    }
  };

  const endFocusMode = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
    setIsRunning(false);
    setIsPaused(false);
    onClose();
  };

  // Pre-focus Dialog
  if (showPreFocusDialog) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
          <div className="p-6 text-center border-b border-slate-100 dark:border-slate-800">
            <div className="mx-auto mb-4 w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Chuẩn bị vào Focus Mode</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Task: <strong>{task.title}</strong>
            </p>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Lưu ý quan trọng
              </h4>
              <ul className="space-y-2 text-sm text-amber-700">
                <li className="flex items-start gap-2">
                  <span className="font-bold">1.</span>
                  <span>
                    <strong>Fullscreen:</strong> Trình duyệt sẽ tự động chuyển sang toàn màn hình.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">2.</span>
                  <span>
                    <strong>Tạm dừng:</strong> Không giới hạn - bạn có thể ra ngoài làm việc riêng bất cứ lúc nào.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">3.</span>
                  <span>
                    <strong>Tiếp tục:</strong> Khi quay lại, bấm <strong>Tiếp tục</strong> để chạy tiếp timer.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">4.</span>
                  <span>
                    <strong>Thời gian:</strong> Mặc định <strong>25 phút</strong> (Pomodoro).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">5.</span>
                  <span>
                    <strong>Cảnh báo:</strong> Trình duyệt sẽ cảnh báo nếu bạn cố đóng tab.
                  </span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={startFocusMode}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold hover:from-indigo-700 hover:to-violet-700 transition flex items-center justify-center gap-2"
              >
                <Maximize2 size={18} />
                Bắt đầu
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Focus Mode Fullscreen View
  const isCompleted = timeLeft === 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950 px-6 py-8 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.28),_transparent_32%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.18),_transparent_25%)]" />

      {/* Nút thoát - chỉ hiện khi tạm dừng hoặc đã hết lượt */}
      {(isPaused || pauseCount >= MAX_PAUSE_COUNT) && (
        <button
          onClick={endFocusMode}
          className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full border border-rose-500/50 bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/30 hover:text-rose-200"
        >
          <XCircle size={16} />
          Thoát focus ({MAX_PAUSE_COUNT - pauseCount + (isPaused ? 1 : 0)}/{MAX_PAUSE_COUNT})
        </button>
      )}

      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center justify-center gap-8">
        {isCompleted ? (
          <div className="text-center space-y-6">
            <div className="text-6xl font-bold text-emerald-400 mb-4">
              Hoàn thành!
            </div>
            <p className="text-xl text-white/70 mb-8">
              Bạn đã hoàn thành phiên Focus Mode
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={async () => { await onCompleteTask(task.id); }}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
              >
                Đánh dấu hoàn thành
              </button>
              <button
                onClick={endFocusMode}
                className="px-6 py-3 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition"
              >
                Thoát
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200/80">Focus Mode</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white">{task.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
                {task.description || "Chỉ giữ lại một việc quan trọng này trên màn hình để bạn bắt đầu tập trung ngay."}
              </p>
            </div>

            <div className="relative flex h-[280px] w-[280px] sm:h-[360px] sm:w-[360px] items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-[0_30px_120px_-40px_rgba(79,70,229,0.65)] backdrop-blur flex-shrink-0">
              <div
                className="absolute inset-3 rounded-full"
                style={{
                  background: `conic-gradient(rgba(255,255,255,0.95) ${progress}%, rgba(255,255,255,0.06) ${progress}% 100%)`,
                  mask: "radial-gradient(farthest-side, transparent calc(100% - 16px), black calc(100% - 15px))",
                  WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 16px), black calc(100% - 15px))",
                }}
              />
              <div className="relative flex h-[230px] w-[230px] sm:h-[300px] sm:w-[300px] flex-col items-center justify-center rounded-full border border-white/10 bg-slate-950/80 text-center">
                <div className="mb-2 sm:mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200">
                  <Brain size={13} />
                  {method.label}
                </div>
                <div className="text-5xl font-black tracking-tight text-white sm:text-7xl">{formatFocusTime(timeLeft)}</div>
                <p className="mt-2 sm:mt-3 max-w-[180px] sm:max-w-[220px] text-xs sm:text-sm leading-relaxed text-slate-300">{method.helper}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {isPaused ? (
                <button
                  onClick={handlePause}
                  className="inline-flex min-w-[170px] items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-extrabold bg-gradient-to-r from-white via-indigo-50 to-violet-100 text-indigo-950 hover:brightness-105 shadow-[0_18px_40px_-20px_rgba(99,102,241,0.9)] transition"
                >
                  <Play size={17} className="text-indigo-700" />
                  Tiếp tục ({MAX_PAUSE_COUNT - pauseCount} lượt)
                </button>
              ) : pauseCount >= MAX_PAUSE_COUNT ? (
                <button
                  disabled
                  className="inline-flex min-w-[170px] items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-extrabold opacity-50 cursor-not-allowed border border-white/15 bg-white/5 text-white/50"
                >
                  <Pause size={17} />
                  Hết lượt
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="inline-flex min-w-[170px] items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-extrabold shadow-[0_18px_40px_-20px_rgba(99,102,241,0.9)] transition border border-amber-300/30 bg-gradient-to-r from-amber-300 via-orange-300 to-amber-200 text-slate-950 hover:brightness-105"
                >
                  <Pause size={17} className="text-slate-950" />
                  Tạm dừng ({MAX_PAUSE_COUNT - pauseCount} lượt)
                </button>
              )}
              <button
                onClick={async () => { await onCompleteTask(task.id); }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
              >
                <Check size={16} />
                Đánh dấu hoàn thành
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <TimerReset size={13} />
                Hạn: {formatDueDateLabel(task.dueDate)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <Zap size={13} />
                Ưu tiên: {task.priority}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TaskModal({ task, onClose, onSave }: TaskModalProps) {
  const { categories, goals, addCategory } = useData();
  const resolvedCategoryId = task?.categoryId || categories[0]?.id || "";
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: "", color: "indigo" as EventColor });
  const [form, setForm] = useState({
    title: task?.title || "",
    categoryId: resolvedCategoryId,
    dueDate: task?.dueDate ? toDateTimeLocalValue(task.dueDate) : "",
    scheduledAt: toDateTimeLocalValue(task?.scheduledAt),
    priority: (task?.priority || "Trung bình") as Task["priority"],
    color: normalizeColor(task?.color) || "indigo" as EventColor,
    description: task?.description || "",
    status: task?.status || (task?.completed ? "COMPLETED" : "IN_PROGRESS"),
    eisenhowerMatrix: task?.eisenhowerMatrix || "",
    estimatedTime: task?.estimatedTime || "",
    contexts: task?.contexts || [] as string[],
    checklist: task?.checklist?.join("\n") || "",
    goalId: task?.goalId || "",
    milestoneId: task?.milestoneId || "",
    showOnCalendar: task?.showOnCalendar ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const selectedGoal = goals.find((goal) => goal.id === form.goalId);
  const selectedMilestones = selectedGoal?.milestones || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || isSubmitting) return;
    
    const taskData = {
      title: form.title,
      categoryId: form.categoryId || categories[0]?.id || undefined,
      dueDate: form.dueDate,
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
      priority: form.priority,
      completed: form.status === "COMPLETED",
      status: form.status,
      color: form.color,
      description: form.description,
      eisenhowerMatrix: form.eisenhowerMatrix || undefined,
      estimatedTime: form.estimatedTime ? Number(form.estimatedTime) : undefined,
      contexts: form.contexts.length > 0 ? form.contexts : undefined,
      checklist: normalizeChecklistItems(form.checklist),
      goalId: form.goalId || undefined,
      milestoneId: form.milestoneId || undefined,
      showOnCalendar: form.showOnCalendar,
    };

    try {
      setIsSubmitting(true);
      if (task) {
        await onSave({
          ...task,
          ...taskData,
        });
      } else {
        await onSave({
          ...taskData,
          sortOrder: 0,
        });
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryForm.name.trim() || isCreatingCategory) return;

    try {
      setCategoryError(null);
      setIsCreatingCategory(true);
      const createdCategory = await addCategory({ name: categoryForm.name.trim(), color: categoryForm.color });
      setCategoryForm({ name: "", color: "indigo" });
      setShowCategoryPopup(false);
      setForm((prev) => ({
        ...prev,
        categoryId: createdCategory.id,
        color: normalizeColor(createdCategory.color) as EventColor,
      }));
    } catch (error) {
      setCategoryError(error instanceof Error ? error.message : "Không thể tạo danh mục");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const selectedCategory = categories.find(c => c.id === (form.categoryId || categories[0]?.id || ""));

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[420px] overflow-hidden border border-zinc-200 ring-1 ring-black/5 dark:bg-slate-900 dark:border-slate-800 dark:ring-white/5" onClick={(e) => e.stopPropagation()}>
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50/50 dark:bg-slate-900/50 dark:border-slate-850">
          <div>
            <h3 className="text-base font-semibold text-zinc-950 dark:text-slate-50 tracking-tight">
              {task ? "Chỉnh sửa công việc" : "Thêm công việc mới"}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">{task ? "Cập nhật thông tin task" : "Điền thông tin để tạo task mới"}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-slate-850 transition-colors">
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
                value={form.categoryId || categories[0]?.id || ""}
                onChange={(e) => {
                  const catId = e.target.value;
                  if (catId === "__other__") {
                    setCategoryError(null);
                    setShowCategoryPopup(true);
                    return;
                  }
                  const cat = categories.find(c => c.id === catId);
                  setForm({ ...form, categoryId: catId, color: normalizeColor(cat?.color) as EventColor || form.color });
                }}
                className="w-full border border-zinc-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:border-zinc-400 transition-all bg-white"
              >
                {categories.length === 0 && <option value="">Đang tải danh mục...</option>}
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="dark:bg-slate-900">{cat.name}</option>
                ))}
                <option value="__other__" className="dark:bg-slate-900">Khác</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1.5 block uppercase tracking-wider">Hạn chót</label>
              <input
                type="datetime-local"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:border-zinc-400 transition-all bg-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1.5 block uppercase tracking-wider">Trạng thái</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:border-zinc-400 transition-all bg-white"
              >
                <option value="IN_PROGRESS">Đang làm</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="MISSED">Trễ hạn</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1.5 block uppercase tracking-wider">Thời gian diễn ra</label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:border-zinc-400 transition-all bg-white"
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1.5 block uppercase tracking-wider">Goal</label>
              <select
                value={form.goalId}
                onChange={(e) => setForm({ ...form, goalId: e.target.value, milestoneId: "" })}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:border-zinc-400 transition-all bg-white"
              >
                <option value="">Không thuộc goal</option>
                {goals.map((goal) => (
                  <option key={goal.id} value={goal.id}>{goal.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1.5 block uppercase tracking-wider">Milestone</label>
              <select
                value={form.milestoneId}
                onChange={(e) => setForm({ ...form, milestoneId: e.target.value })}
                disabled={!selectedGoal}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:border-zinc-400 transition-all bg-white disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
              >
                <option value="">Không thuộc milestone</option>
                {selectedMilestones.map((milestone) => (
                  <option key={milestone.id} value={milestone.id}>{milestone.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1.5 block uppercase tracking-wider">Calendar</label>
              <label className="flex h-[42px] items-center gap-2 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700">
                <input
                  type="checkbox"
                  checked={form.showOnCalendar}
                  onChange={(e) => setForm({ ...form, showOnCalendar: e.target.checked })}
                  className="rounded border-zinc-300"
                />
                Hiển thị trên lịch
              </label>
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
          <div>
            <label className="text-xs font-semibold text-zinc-600 mb-1.5 block uppercase tracking-wider">Checklist</label>
            <textarea
              value={form.checklist}
              onChange={(e) => setForm({ ...form, checklist: e.target.value })}
              placeholder="Mỗi dòng là một checklist item"
              rows={3}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:border-zinc-400 transition-all resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2 border-t border-zinc-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-zinc-300 text-zinc-700 text-sm font-semibold py-2 rounded-lg hover:bg-zinc-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 bg-zinc-900 text-white text-sm font-semibold py-2 rounded-lg hover:bg-zinc-800 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang lưu..." : task ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
      {showCategoryPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => {
          setCategoryError(null);
          setShowCategoryPopup(false);
          setCategoryForm({ name: "", color: "indigo" });
        }}>
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-semibold text-zinc-900">Tạo danh mục mới</h4>
                <p className="mt-1 text-xs text-zinc-500">Danh mục này sẽ thuộc tài khoản hiện tại của bạn.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCategoryError(null);
                  setShowCategoryPopup(false);
                  setCategoryForm({ name: "", color: "indigo" });
                }}
                className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-600">Tên danh mục</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => {
                    setCategoryError(null);
                    setCategoryForm({ ...categoryForm, name: e.target.value });
                  }}
                  placeholder="VD: Việc cá nhân"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-600">Màu danh mục</label>
                <div className="flex flex-wrap gap-2">
                  {(["indigo", "blue", "emerald", "amber", "rose", "purple", "teal", "orange"] as EventColor[]).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCategoryForm({ ...categoryForm, color })}
                      className={`h-7 w-7 rounded-full ${COLOR_MAP[color].bg} transition-all ${categoryForm.color === color ? `ring-2 ring-offset-2 ${COLOR_MAP[color].ring}` : ""}`}
                    />
                  ))}
                </div>
              </div>
              {categoryError && <p className="text-xs font-medium text-rose-600">{categoryError}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryError(null);
                    setShowCategoryPopup(false);
                    setCategoryForm({ name: "", color: "indigo" });
                  }}
                  className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="flex-1 rounded-lg bg-zinc-900 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!categoryForm.name.trim() || isCreatingCategory}
                >
                  {isCreatingCategory ? "Đang tạo..." : "Tạo danh mục"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onFocus: (task: Task) => void;
}) {
  const { categories, goals, language } = useData();
  const category = categories.find(c => c.id === task.categoryId);
  const goal = goals.find((item) => item.id === task.goalId);
  const status = getTaskStatus(task);
  const normalizedColor = normalizeColor(task.color);
  const colors = category ? COLOR_MAP[normalizeColor(category.color)] : COLOR_MAP[normalizedColor];

  return (
    <div
      className={`
        group bg-white rounded-lg border border-zinc-200 p-4 hover:border-zinc-300 hover:shadow-sm
        dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700
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
              className={`text-sm font-semibold tracking-tight text-zinc-900 dark:text-slate-100 leading-tight ${task.completed ? "line-through text-zinc-500" : ""}`}
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
                  className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all flex-shrink-0 p-1 rounded hover:bg-zinc-100 dark:hover:bg-slate-800"
                >
                  <Edit2 size={13} />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                className="text-zinc-400 hover:text-rose-600 transition-all flex-shrink-0 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

            <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">{task.description}</p>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-md border font-semibold ${getTaskStatusClasses(status)}`}>
              {getTaskStatusLabel(status, language)}
            </span>

            {(task.categoryName || category) && (
              <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-md font-semibold border ${colors.badge} bg-transparent`}>
                <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                {task.categoryName || category?.name}
              </span>
            )}

            {task.dueDate && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-zinc-600 bg-zinc-100 dark:bg-slate-800 dark:text-slate-300 px-2 py-1 rounded-md border border-zinc-200 dark:border-slate-700">
                <Calendar size={10} />
                {formatDueDateLabel(task.dueDate)}
              </span>
            )}

            {task.scheduledAt && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-zinc-600 bg-zinc-100 dark:bg-slate-800 dark:text-slate-300 px-2 py-1 rounded-md border border-zinc-200 dark:border-slate-700">
                <TimerReset size={10} />
                {formatScheduledAtLabel(task.scheduledAt)}
              </span>
            )}

            <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-md border font-semibold ${PRIORITY_COLORS[task.priority].replace('bg-', 'bg-transparent text-').replace('text-', '')}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
              {task.priority}
            </span>

            {goal && (
              <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-md font-semibold border border-violet-200 bg-violet-50 text-violet-700">
                <Target size={10} />
                {goal.title}
              </span>
            )}

            <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-md font-semibold border ${task.showOnCalendar === false ? "border-zinc-200 bg-zinc-50 text-zinc-500" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
              {task.showOnCalendar === false
                ? (language === "vi" ? "Ẩn lịch" : "Hidden from calendar")
                : (language === "vi" ? "Hiện trên lịch" : "On calendar")}
            </span>

            {task.checklist && task.checklist.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-md font-semibold border border-amber-200 bg-amber-50 text-amber-700">
                <Check size={10} />
                {language === "vi" ? `${task.checklist.length} checklist` : `${task.checklist.length} checklist items`}
              </span>
            )}

            {!task.completed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFocus(task);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
              >
                <Play size={10} />
                {language === "vi" ? "Bắt đầu tập trung" : "Start Focus"}
              </button>
            )}
          </div>
          {task.checklist && task.checklist.length > 0 && (
            <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
              <div className="font-semibold mb-1">Checklist</div>
              <ul className="space-y-1 list-disc pl-4">
                {task.checklist.slice(0, 3).map((item, index) => (
                  <li key={`${task.id}-check-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type FilterTab = "Tất cả" | "Đang làm" | "Hoàn thành" | "Tập trung";

export function TasksView() {
  const { tasks, categories, goals, updateTask, deleteTask, addTask, language } = useData();
  const [filter, setFilter] = useState<FilterTab>("Tất cả");
  const [priorityFilter, setPriorityFilter] = useState<string>("Tất cả");
  const [statusFilter, setStatusFilter] = useState<string>("Tất cả");
  const [goalFilter, setGoalFilter] = useState<string>("Tất cả");
  const [calendarFilter, setCalendarFilter] = useState<string>("Tất cả");
  const [search, setSearch] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [focusTask, setFocusTask] = useState<Task | null>(null);

  const pending = tasks.filter((t) => !t.completed).length;
  const completed = tasks.filter((t) => t.completed).length;
  const highPriority = tasks.filter((t) => !t.completed && t.priority === "Cao").length;
  const focusTasks = tasks
    .filter((t) => {
      const status = getTaskStatus(t);
      const matchPriority = priorityFilter === "Tất cả" ? true : t.priority === priorityFilter;
      const matchSearch =
        search === "" ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.description || "").toLowerCase().includes(search.toLowerCase());
      return status === "IN_PROGRESS" && matchPriority && matchSearch;
    })
    .sort((a, b) => {
      const order = { Cao: 0, "Trung bình": 1, Thấp: 2 };
      const priorityDiff = order[a.priority as keyof typeof order] - order[b.priority as keyof typeof order];
      if (priorityDiff !== 0) return priorityDiff;
      if (a.estimatedTime && b.estimatedTime) return a.estimatedTime - b.estimatedTime;
      if (a.estimatedTime) return -1;
      if (b.estimatedTime) return 1;
      return a.sortOrder - b.sortOrder;
    });
  const recommendedFocusTask = focusTasks[0] ?? null;

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      updateTask(id, { completed: !task.completed });
    }
  };

  const handleDeleteTask = (id: string) => {
    deleteTask(id);
  };

  const handleSaveTask = async (taskData: Omit<Task, "id"> | Task) => {
    if ('id' in taskData) {
      // Editing existing task
      await updateTask(taskData.id, taskData);
    } else {
      // Adding new task
      await addTask(taskData);
    }
  };

  const filtered = tasks.filter((t) => {
    const status = getTaskStatus(t);
    const matchFilter =
      filter === "Tất cả"
        ? true
        : filter === "Đang làm" || filter === "Tập trung"
        ? status === "IN_PROGRESS" || status === "MISSED"
        : status === "COMPLETED";
    const matchPriority = priorityFilter === "Tất cả" ? true : t.priority === priorityFilter;
    const matchStatus = statusFilter === "Tất cả" ? true : status === statusFilter;
    const matchGoal = goalFilter === "Tất cả" ? true : (goalFilter === "none" ? !t.goalId : t.goalId === goalFilter);
    const matchCalendar = calendarFilter === "Tất cả"
      ? true
      : calendarFilter === "shown"
      ? t.showOnCalendar !== false
      : t.showOnCalendar === false;
    const matchSearch =
      search === "" ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchPriority && matchStatus && matchGoal && matchCalendar && matchSearch;
  });
  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between flex-shrink-0 dark:bg-slate-950 dark:border-slate-800 gap-3">
        <div>
          <h1 className="text-[1.4rem] sm:text-[1.6rem] font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            {language === "vi" ? "Công việc" : "Tasks"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 dark:text-slate-400">
            {language === "vi"
              ? `${pending} đang làm · ${completed} hoàn thành`
              : `${pending} pending · ${completed} completed`}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md shadow-indigo-200 dark:shadow-none"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">{language === "vi" ? "Thêm công việc" : "Add Task"}</span>
        </button>
      </div>

      {/* Stats bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0 dark:bg-slate-950 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-350">
            <div className="w-8 h-8 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-center shadow-sm dark:bg-rose-500/15 dark:border-rose-500/30">
              <AlertCircle size={14} className="text-rose-500" />
            </div>
            <span className="text-xs sm:text-sm">
              <span className="font-bold text-slate-900 dark:text-white">{highPriority}</span>{" "}
              {language === "vi" ? "ưu tiên cao" : "high priority"}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-350">
            <div className="w-8 h-8 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center shadow-sm dark:bg-amber-500/15 dark:border-amber-500/30">
              <Circle size={14} className="text-amber-500" />
            </div>
            <span className="text-xs sm:text-sm">
              <span className="font-bold text-slate-900 dark:text-white">{pending}</span>{" "}
              {language === "vi" ? "đang làm" : "pending"}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-350">
            <div className="w-8 h-8 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center shadow-sm dark:bg-emerald-500/15 dark:border-emerald-500/30">
              <Check size={14} className="text-emerald-500" />
            </div>
            <span className="text-xs sm:text-sm">
              <span className="font-bold text-slate-900 dark:text-white">{completed}</span>{" "}
              {language === "vi" ? "hoàn thành" : "completed"}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full md:w-64 max-w-full">
          <div className="flex justify-between text-xs font-medium text-zinc-550 mb-2 dark:text-slate-400">
            <span>{language === "vi" ? "Tiến độ tổng thể" : "Overall progress"}</span>
            <span className="text-zinc-900 dark:text-white">{tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0}%</span>
          </div>
          <div className="h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50 dark:bg-slate-800 dark:border-slate-700">
            <div
              className="h-full bg-zinc-900 rounded-full transition-all duration-500 dark:bg-indigo-500"
              style={{ width: `${tasks.length > 0 ? (completed / tasks.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white border-b border-zinc-200 px-4 sm:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0 dark:bg-slate-950 dark:border-slate-800">
        {/* Status tabs */}
        <div className="flex items-center bg-zinc-100/80 rounded-lg p-1 border border-zinc-200 dark:bg-slate-900 dark:border-slate-850 overflow-x-auto w-full md:w-auto shrink-0 scrollbar-none">
          {(["Tất cả", "Đang làm", "Hoàn thành", "Tập trung"] as FilterTab[]).map((tab) => {
            const mappedTabLabel =
              language === "vi"
                ? tab
                : tab === "Tất cả"
                ? "All"
                : tab === "Đang làm"
                ? "Pending"
                : tab === "Hoàn thành"
                ? "Completed"
                : "Focus";
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`flex-1 md:flex-initial px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  filter === tab
                    ? "bg-white shadow-sm text-zinc-950 ring-1 ring-zinc-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50"
                }`}
              >
                {mappedTabLabel}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 border border-zinc-200 rounded-md bg-zinc-50 dark:bg-slate-900 dark:border-slate-800 w-full sm:w-auto">
            <Flag size={14} className="text-zinc-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs sm:text-sm font-medium border-none bg-transparent text-zinc-700 dark:text-slate-300 focus:outline-none cursor-pointer w-full"
            >
              <option value="Tất cả" className="dark:bg-slate-900">{language === "vi" ? "Tất cả mức độ" : "All Priorities"}</option>
              <option value="Cao" className="dark:bg-slate-900">{language === "vi" ? "Cao" : "High"}</option>
              <option value="Trung bình" className="dark:bg-slate-900">{language === "vi" ? "Trung bình" : "Medium"}</option>
              <option value="Thấp" className="dark:bg-slate-900">{language === "vi" ? "Thấp" : "Low"}</option>
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 border border-zinc-200 rounded-md bg-zinc-50 dark:bg-slate-900 dark:border-slate-800 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs sm:text-sm font-medium border-none bg-transparent text-zinc-700 dark:text-slate-300 focus:outline-none cursor-pointer w-full"
            >
              <option value="Tất cả">{language === "vi" ? "Tất cả trạng thái" : "All Statuses"}</option>
              <option value="IN_PROGRESS">{language === "vi" ? "Đang làm" : "In Progress"}</option>
              <option value="COMPLETED">{language === "vi" ? "Hoàn thành" : "Completed"}</option>
              <option value="MISSED">{language === "vi" ? "Trễ hạn" : "Missed"}</option>
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 border border-zinc-200 rounded-md bg-zinc-50 dark:bg-slate-900 dark:border-slate-800 w-full sm:w-auto">
            <select
              value={goalFilter}
              onChange={(e) => setGoalFilter(e.target.value)}
              className="text-xs sm:text-sm font-medium border-none bg-transparent text-zinc-700 dark:text-slate-300 focus:outline-none cursor-pointer w-full"
            >
              <option value="Tất cả">{language === "vi" ? "Tất cả goal" : "All Goals"}</option>
              <option value="none">{language === "vi" ? "Không thuộc goal" : "No Goal"}</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>{goal.title}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 border border-zinc-200 rounded-md bg-zinc-50 dark:bg-slate-900 dark:border-slate-800 w-full sm:w-auto">
            <select
              value={calendarFilter}
              onChange={(e) => setCalendarFilter(e.target.value)}
              className="text-xs sm:text-sm font-medium border-none bg-transparent text-zinc-700 dark:text-slate-300 focus:outline-none cursor-pointer w-full"
            >
              <option value="Tất cả">{language === "vi" ? "Tất cả lịch" : "All Calendar"}</option>
              <option value="shown">{language === "vi" ? "Đang hiện trên lịch" : "Shown on calendar"}</option>
              <option value="hidden">{language === "vi" ? "Đang ẩn khỏi lịch" : "Hidden from calendar"}</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-md px-3 py-1.5 w-full sm:w-64 shadow-sm focus-within:ring-1 focus-within:ring-zinc-400 focus-within:border-zinc-400 transition-all dark:bg-slate-900 dark:border-slate-800 dark:focus-within:ring-indigo-500">
            <Search size={14} className="text-zinc-400 flex-shrink-0" />
            <input
              type="text"
              placeholder={language === "vi" ? "Tìm kiếm công việc..." : "Search tasks..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-medium focus:outline-none flex-1 placeholder:text-zinc-400 text-zinc-900 dark:text-slate-100"
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
          <div className="space-y-5">
            <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5 shadow-sm dark:border-indigo-500/20 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950/60">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-400/20 dark:bg-white/5 dark:text-indigo-200">
                    <Sparkles size={14} />
                    {language === "vi" ? "Chế độ tập trung" : "Focus mode"}
                  </div>
                  <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                    {language === "vi" ? "Chọn đúng một việc để bắt đầu sâu hơn" : "Pick one task to enter deep work"}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {language === "vi"
                      ? "Tab này chỉ giữ lại những công việc chưa hoàn thành và ưu tiên việc quan trọng nhất trước. Hãy chọn một task, bấm Bắt đầu tập trung và làm đến khi xong hoặc hết phiên."
                      : "This tab keeps only unfinished tasks and surfaces the best candidate first. Choose one task, start focus mode, and work until the session ends or the task is done."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
                  <div className="rounded-2xl border border-white/70 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                      {language === "vi" ? "Sẵn sàng focus" : "Ready to focus"}
                    </div>
                    <div className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">{focusTasks.length}</div>
                  </div>
                  <div className="rounded-2xl border border-white/70 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                      {language === "vi" ? "Ưu tiên cao" : "High priority"}
                    </div>
                    <div className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">{highPriority}</div>
                  </div>
                </div>
              </div>
            </div>

            {recommendedFocusTask ? (
              <div className="rounded-3xl border border-indigo-200 bg-white p-5 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200">
                      <Target size={14} />
                      {language === "vi" ? "Đề xuất bắt đầu ngay" : "Best task to start now"}
                    </div>
                    <h4 className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-50">{recommendedFocusTask.title}</h4>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {recommendedFocusTask.description || (language === "vi" ? "Không có mô tả, hãy tập trung hoàn thành từng bước nhỏ của task này." : "No description yet, focus on completing this task one small step at a time.")}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 ${PRIORITY_COLORS[recommendedFocusTask.priority]}`}>
                        <Zap size={12} />
                        {language === "vi" ? `Ưu tiên ${recommendedFocusTask.priority}` : recommendedFocusTask.priority}
                      </span>
                      {recommendedFocusTask.estimatedTime ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <TimerReset size={12} />
                          {language === "vi" ? `${recommendedFocusTask.estimatedTime} phút dự kiến` : `${recommendedFocusTask.estimatedTime} min estimate`}
                        </span>
                      ) : null}
                      {recommendedFocusTask.dueDate ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <Calendar size={12} />
                          {language === "vi" ? `Hạn ${formatDueDateLabel(recommendedFocusTask.dueDate)}` : `Due ${formatDueDateLabel(recommendedFocusTask.dueDate)}`}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <button
                    onClick={() => setFocusTask(recommendedFocusTask)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:brightness-105 dark:shadow-none"
                  >
                    <Play size={16} />
                    {language === "vi" ? "Bắt đầu với task này" : "Start this task"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/70 px-6 py-14 text-center dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <Check size={28} className="text-emerald-500" />
                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-50">
                  {language === "vi" ? "Bạn không còn task nào để tập trung" : "No tasks left to focus on"}
                </h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {language === "vi"
                    ? "Mọi công việc hiện tại đã hoàn thành. Hãy thêm task mới hoặc quay lại tab Công việc để lên kế hoạch tiếp theo."
                    : "All current tasks are completed. Add a new task or go back to plan your next step."}
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-400/20 dark:bg-slate-900 dark:text-emerald-200"
                >
                  <Plus size={15} />
                  {language === "vi" ? "Thêm công việc mới" : "Add a new task"}
                </button>
              </div>
            )}

            {focusTasks.length > 0 && (
              <div>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                      {language === "vi" ? "Danh sách phù hợp để tập trung" : "Focus-ready tasks"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {language === "vi"
                        ? "Các task được sắp theo độ ưu tiên rồi đến thời lượng ước tính để bạn chọn nhanh hơn."
                        : "Tasks are ordered by priority, then estimated duration so you can choose faster."}
                    </p>
                  </div>
                  <div className="hidden sm:inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    <ArrowRight size={12} />
                    {language === "vi" ? "Nhấn vào task hoặc nút focus" : "Click a task or start focus"}
                  </div>
                </div>
                <div className="space-y-3">
                  {focusTasks.map((task) => (
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
          onCompleteTask={async (id) => {
            await updateTask(id, { completed: true });
            setFocusTask(null);
          }}
        />
      )}
    </div>
  );
}
