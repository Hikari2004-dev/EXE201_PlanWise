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
  TimerReset,
  Brain,
  Zap,
  XCircle,
  AlertTriangle,
  Maximize2,
} from "lucide-react";
import { useData } from "../context/DataContext";
import { COLOR_MAP, type Task } from "../data/mockData";
import { HintBubble } from "./HintBubble";
import { PlannerAssistantButton } from "./planner-assistant";
import { TaskModal } from "./TaskModal";

// Normalize color to lowercase for consistent lookups
function normalizeColor(color: string | undefined): string {
  if (!color) return "indigo";
  return color.toLowerCase();
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

function getValidDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getRelevantTaskDate(task: Task) {
  return getValidDate(task.scheduledAt) || getValidDate(task.dueDate);
}

function getShortTaskDateLabel(task: Task, language: "vi" | "en") {
  const date = getRelevantTaskDate(task);
  if (!date) return language === "vi" ? "Không hạn" : "No date";

  const today = startOfDay(new Date());
  const taskDay = startOfDay(date);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const time = new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  if (taskDay.getTime() === today.getTime()) {
    return `${language === "vi" ? "Hôm nay" : "Today"} ${time}`;
  }

  if (taskDay.getTime() === tomorrow.getTime()) {
    return `${language === "vi" ? "Ngày mai" : "Tomorrow"} ${time}`;
  }

  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "short",
  }).format(date);
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

const PRIORITY_ORDER: Record<Task["priority"], number> = {
  Cao: 0,
  "Trung bình": 1,
  Thấp: 2,
};

function getPriorityLabel(priority: Task["priority"], language: "vi" | "en") {
  if (language === "vi") return priority;
  if (priority === "Cao") return "High";
  if (priority === "Trung bình") return "Medium";
  return "Low";
}

function compareTasksForBoard(a: Task, b: Task) {
  if (a.completed !== b.completed) return a.completed ? 1 : -1;

  const aScheduledAt = getValidDate(a.scheduledAt)?.getTime();
  const bScheduledAt = getValidDate(b.scheduledAt)?.getTime();
  const aDueDate = getValidDate(a.dueDate)?.getTime() ?? Number.POSITIVE_INFINITY;
  const bDueDate = getValidDate(b.dueDate)?.getTime() ?? Number.POSITIVE_INFINITY;
  const aPrimaryDate = aScheduledAt ?? aDueDate;
  const bPrimaryDate = bScheduledAt ?? bDueDate;

  if (aPrimaryDate !== bPrimaryDate) return aPrimaryDate - bPrimaryDate;
  if (aDueDate !== bDueDate) return aDueDate - bDueDate;

  const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  if (priorityDiff !== 0) return priorityDiff;

  return a.sortOrder - b.sortOrder;
}


// Focus Mode Constants
const MAX_PAUSE_COUNT = 3;


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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950 px-4 py-8 text-white sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.28),_transparent_32%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.18),_transparent_25%)]" />

      {/* Nút thoát - chỉ hiện khi tạm dừng hoặc đã hết lượt */}
      {(isPaused || pauseCount >= MAX_PAUSE_COUNT) && (
        <button
          onClick={endFocusMode}
          className="absolute left-4 top-4 inline-flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border border-rose-500/50 bg-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/30 hover:text-rose-200 sm:left-6 sm:top-6 sm:px-4 sm:text-sm"
        >
          <XCircle size={16} />
          Thoát focus ({MAX_PAUSE_COUNT - pauseCount + (isPaused ? 1 : 0)}/{MAX_PAUSE_COUNT})
        </button>
      )}

      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center justify-center gap-8">
        {isCompleted ? (
          <div className="space-y-6 text-center">
            <div className="mb-4 text-4xl font-bold text-emerald-400 sm:text-6xl">
              Hoàn thành!
            </div>
            <p className="mb-8 text-base text-white/70 sm:text-xl">
              Bạn đã hoàn thành phiên Focus Mode
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
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

function TaskCard({
  task,
  isExpanded = false,
  onExpandChange = () => undefined,
  onToggle,
  onDelete,
  onEdit,
  onFocus,
  onUpdate = () => undefined,
}: {
  task: Task;
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onFocus: (task: Task) => void;
  onUpdate?: (id: string, updates: Partial<Task>) => Promise<void> | void;
}) {
  const { language } = useData();
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);
  const [draftChecklist, setDraftChecklist] = useState<string[]>(task.checklist || []);
  const [checkedChecklistItems, setCheckedChecklistItems] = useState<Set<number>>(new Set());
  const DateIcon = task.scheduledAt ? TimerReset : Calendar;

  useEffect(() => {
    setDraftTitle(task.title);
  }, [task.id, task.title]);

  useEffect(() => {
    setDraftChecklist(task.checklist || []);
    setCheckedChecklistItems(new Set());
  }, [task.id, task.checklist]);

  const commitTitle = async () => {
    const nextTitle = draftTitle.trim();
    if (!nextTitle) {
      setDraftTitle(task.title);
      setIsRenaming(false);
      return;
    }

    if (nextTitle !== task.title) {
      await onUpdate(task.id, { title: nextTitle });
    }
    setIsRenaming(false);
  };

  const commitChecklist = async (items = draftChecklist) => {
    const normalized = items.map((item) => item.trim()).filter(Boolean);
    const current = task.checklist || [];

    if (normalized.join("\n") !== current.join("\n")) {
      await onUpdate(task.id, { checklist: normalized });
    }
  };

  const handleCardClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button,input,textarea,select,a")) return;
    onExpandChange(!isExpanded);
  };

  const toggleChecklistItemVisual = (index: number) => {
    setCheckedChecklistItems((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div
      onClick={handleCardClick}
      aria-expanded={isExpanded}
      className={`
        group bg-white rounded-lg border border-zinc-200 p-3 hover:border-zinc-300 hover:shadow-sm
        dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700
        transition-all duration-200 ${task.completed ? "opacity-60" : ""}
      `}
    >
      <div className="flex min-h-[56px] items-start gap-3">
        {/* Checkbox */}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggle(task.id);
          }}
          aria-label={language === "vi" ? "Đổi trạng thái công việc" : "Toggle task completion"}
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
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            {isRenaming ? (
              <input
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                onBlur={() => {
                  void commitTitle();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void commitTitle();
                  }
                  if (event.key === "Escape") {
                    setDraftTitle(task.title);
                    setIsRenaming(false);
                  }
                }}
                onClick={(event) => event.stopPropagation()}
                className="min-h-7 w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm font-semibold text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                autoFocus
              />
            ) : (
              <p
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  setIsRenaming(true);
                }}
                className={`line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 dark:text-slate-100 ${task.completed ? "line-through text-zinc-500 dark:text-slate-500" : ""}`}
                title={language === "vi" ? "Nhấp đúp để đổi tên" : "Double-click to rename"}
              >
                {task.title}
              </p>
            )}

            <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              {!task.completed && (
                <button
                  type="button"
                  title={language === "vi" ? "Chỉnh sửa" : "Edit"}
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(task);
                  }}
                  className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all flex-shrink-0 p-1 rounded hover:bg-zinc-100 dark:hover:bg-slate-800"
                >
                  <Edit2 size={13} />
                </button>
              )}
              <button
                type="button"
                title={language === "vi" ? "Xóa" : "Delete"}
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(task.id);
                }}
                className="text-zinc-400 hover:text-rose-600 transition-all flex-shrink-0 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <span className={`inline-flex min-w-0 items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold ${PRIORITY_COLORS[task.priority]}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
              <span className="truncate">{getPriorityLabel(task.priority, language)}</span>
            </span>

            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-medium text-zinc-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <DateIcon size={10} className="shrink-0" />
              <span className="truncate">{getShortTaskDateLabel(task, language)}</span>
            </span>
          </div>

          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
          >
            <div className="overflow-hidden">
              <div className="mt-3 space-y-3 border-t border-zinc-100 pt-3 dark:border-slate-800">
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase text-zinc-400 dark:text-slate-500">
                    {language === "vi" ? "Mô tả" : "Description"}
                  </div>
                  <p className="text-xs leading-relaxed text-zinc-600 dark:text-slate-300">
                    {task.description || (language === "vi" ? "Chưa có mô tả." : "No description yet.")}
                  </p>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="text-[10px] font-bold uppercase text-zinc-400 dark:text-slate-500">
                      {language === "vi" ? "Checklist" : "Checklist"}
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setDraftChecklist((items) => [...items, ""]);
                      }}
                      className="rounded-md border border-zinc-200 px-2 py-1 text-[10px] font-semibold text-zinc-600 transition hover:bg-zinc-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {language === "vi" ? "Thêm" : "Add"}
                    </button>
                  </div>

                  {draftChecklist.length > 0 ? (
                    <div className="space-y-1.5">
                      {draftChecklist.map((item, index) => (
                        <div key={`${task.id}-check-${index}`} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleChecklistItemVisual(index);
                            }}
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                              checkedChecklistItems.has(index)
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-zinc-300 bg-white text-transparent dark:border-slate-700 dark:bg-slate-950"
                            }`}
                            title={language === "vi" ? "Đánh dấu trực quan" : "Visual check"}
                          >
                            <Check size={10} />
                          </button>
                          <input
                            value={item}
                            onChange={(event) => {
                              const next = [...draftChecklist];
                              next[index] = event.target.value;
                              setDraftChecklist(next);
                            }}
                            onBlur={() => {
                              void commitChecklist();
                            }}
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                void commitChecklist();
                              }
                              if (event.key === "Escape") {
                                setDraftChecklist(task.checklist || []);
                              }
                            }}
                            className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-xs text-zinc-700 outline-none transition hover:border-zinc-200 focus:border-zinc-300 focus:bg-white dark:text-slate-300 dark:hover:border-slate-700 dark:focus:border-slate-600 dark:focus:bg-slate-950"
                            style={{ textDecoration: checkedChecklistItems.has(index) ? "line-through" : "none" }}
                            placeholder={language === "vi" ? "Checklist item" : "Checklist item"}
                          />
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              const next = draftChecklist.filter((_, itemIndex) => itemIndex !== index);
                              setDraftChecklist(next);
                              setCheckedChecklistItems(new Set());
                              void commitChecklist(next);
                            }}
                            className="rounded p-1 text-zinc-300 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                            title={language === "vi" ? "Xóa mục" : "Remove item"}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-md border border-dashed border-zinc-200 px-3 py-2 text-xs text-zinc-400 dark:border-slate-800 dark:text-slate-500">
                      {language === "vi" ? "Chưa có checklist." : "No checklist items yet."}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {!task.completed && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onFocus(task);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
                    >
                      <Play size={12} />
                      {language === "vi" ? "Bắt đầu focus" : "Start Focus"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type FilterTab = "Tất cả" | "Đang làm" | "Hoàn thành" | "Tập trung";

export function TasksView() {
  const { tasks, goals, updateTask, deleteTask, addTask, language } = useData();
  const [filter, setFilter] = useState<FilterTab>("Tất cả");
  const [priorityFilter, setPriorityFilter] = useState<string>("Tất cả");
  const [statusFilter, setStatusFilter] = useState<string>("Tất cả");
  const [calendarFilter, setCalendarFilter] = useState<string>("Tất cả");
  const [search, setSearch] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const searchQuery = search.trim().toLowerCase();

  useEffect(() => {
    if (searchQuery) {
      setExpandedTaskId(null);
    }
  }, [searchQuery]);

  const pending = tasks.filter((t) => !t.completed).length;
  const completed = tasks.filter((t) => t.completed).length;
  const highPriority = tasks.filter((t) => !t.completed && t.priority === "Cao").length;

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      const nextCompleted = !task.completed;
      updateTask(id, { completed: nextCompleted, status: nextCompleted ? "COMPLETED" : "IN_PROGRESS" });
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

  const filtered = useMemo(() => tasks.filter((t) => {
    const status = getTaskStatus(t);
    const matchFilter =
      filter === "Tất cả"
        ? true
        : filter === "Đang làm" || filter === "Tập trung"
        ? status === "IN_PROGRESS" || status === "MISSED"
        : status === "COMPLETED";
    const matchPriority = priorityFilter === "Tất cả" ? true : t.priority === priorityFilter;
    const matchStatus = statusFilter === "Tất cả" ? true : status === statusFilter;
    const matchCalendar = calendarFilter === "Tất cả"
      ? true
      : calendarFilter === "shown"
      ? t.showOnCalendar !== false
      : t.showOnCalendar === false;
    const matchSearch =
      searchQuery === "" ||
      t.title.toLowerCase().includes(searchQuery);
    return matchFilter && matchPriority && matchStatus && matchCalendar && matchSearch;
  }), [calendarFilter, filter, priorityFilter, searchQuery, statusFilter, tasks]);

  const boardColumns = useMemo(() => {
    const tasksByGoal = new Map<string, Task[]>();

    [...filtered].sort(compareTasksForBoard).forEach((task) => {
      const key = task.goalId || "__no_goal__";
      const current = tasksByGoal.get(key) || [];
      current.push(task);
      tasksByGoal.set(key, current);
    });

    return [
      {
        id: "__no_goal__",
        title: language === "vi" ? "Không thuộc goal" : "No Goal",
        tasks: tasksByGoal.get("__no_goal__") || [],
        dotClass: "bg-zinc-400",
        description: language === "vi" ? "Task chưa gắn mục tiêu" : "Tasks without an assigned goal",
        completedTasks: null,
        totalTasks: null,
        progress: null,
      },
      ...goals.map((goal) => {
        const goalColor = COLOR_MAP[normalizeColor(goal.color)] || COLOR_MAP["indigo"];
        const goalTasks = tasks.filter((task) => task.goalId === goal.id);
        const completedTasks = goalTasks.filter((task) => task.completed).length;
        const progress = goalTasks.length ? Math.round((completedTasks / goalTasks.length) * 100) : 0;

        return {
          id: goal.id,
          title: goal.title,
          tasks: tasksByGoal.get(goal.id) || [],
          dotClass: goalColor.dot,
          description: goal.description,
          completedTasks,
          totalTasks: goalTasks.length,
          progress,
        };
      }),
    ];
  }, [filtered, goals, language, tasks]);
  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-shrink-0 flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-950 sm:px-8 sm:py-3">
        <div>
          <h1 className="text-[1.4rem] sm:text-[1.6rem] font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            {language === "vi" ? "Công việc" : "Tasks"}
          </h1>

          {/* Stats bar */}
          <div className="flex flex-wrap items-center sm:pt-1 gap-4 sm:gap-4">
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

            {/* Progress bar */}
            <div className="w-full max-w-full md:w-64">
              <div className="flex justify-between text-xs font-medium text-zinc-550 mb-2 dark:text-slate-400">
                <span>{language === "vi" ? "Tiến độ tổng thể" : "Overall progress"}</span>
                <span className="text-zinc-900 dark:text-white">{tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0}%</span>
              </div>
              <div className="h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50 dark:bg-slate-800 dark:border-slate-700">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500 dark:bg-blue-400"
                  style={{ width: `${tasks.length > 0 ? (completed / tasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>

          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <PlannerAssistantButton />
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-3 py-3 sm:px-4 sm:py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md shadow-indigo-200 dark:shadow-none"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">{language === "vi" ? "Thêm công việc" : "Add Task"}</span>
          </button>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white border-b border-zinc-200 px-4 sm:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0 dark:bg-slate-950 dark:border-slate-800">
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

      {/* Goal board */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="flex h-full min-h-0 flex-col">
          <div className="shrink-0 px-4 pt-4 sm:px-8">
            <HintBubble
              id="tasks_intro"
              title="Công việc"
              color="amber"
              persistent={false}
              className="mb-4"
            >
              Mục này giúp bạn gom toàn bộ việc cần làm vào một nơi, lọc theo trạng thái hoặc mức ưu tiên, rồi xử lý từng việc theo đúng nhịp thay vì bị quá tải.
            </HintBubble>
          </div>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-x-auto px-4 pb-2 sm:px-8">
              <div className="flex h-full min-h-[400px] min-w-max snap-x snap-mandatory gap-4">
                {boardColumns.map((column) => (
                  <section
                    key={column.id}
                    className="flex h-full w-[calc(100vw-2rem)] max-w-[420px] flex-none snap-start flex-col rounded-xl border border-zinc-200 bg-zinc-100/70 dark:border-slate-800 dark:bg-slate-900/60 sm:w-[400px]"
                  >
                    <div className="border-b border-zinc-200 p-3 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-t-xl">
                      <div className="px-2 pt-1">
                        <div className="min-w-0 px-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-md font-bold text-zinc-900 dark:text-slate-50">
                              {column.title}
                            </h3>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-zinc-500 dark:text-slate-400">
                            {column.description}
                          </p>
                        </div>
                        {column.progress !== null && (
                          <div className="mt-2 px-1">
                            <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-slate-400">
                              <span>{column.completedTasks} / {column.totalTasks} {language === "vi" ? "task" : "tasks"}</span>
                              <span>{column.progress}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-slate-800">
                              <div className="h-full rounded-full bg-blue-600 transition-all duration-500 dark:bg-blue-400" style={{ width: `${column.progress}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2.5">
                      {column.tasks.length > 0 ? (
                        column.tasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            isExpanded={expandedTaskId === task.id}
                            onExpandChange={(expanded) => setExpandedTaskId(expanded ? task.id : null)}
                            onToggle={toggleTask}
                            onDelete={handleDeleteTask}
                            onEdit={setEditingTask}
                            onFocus={setFocusTask}
                            onUpdate={updateTask}
                          />
                        ))
                      ) : (
                        <div className="flex min-h-[92px] items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-white/70 px-4 text-center text-xs font-medium text-zinc-400 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-500">
                          {language === "vi" ? "Không có task khớp bộ lọc" : "No matching tasks"}
                        </div>
                      )}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
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
