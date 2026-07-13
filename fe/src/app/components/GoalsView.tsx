import { useEffect, useMemo, useState } from "react";
import { aiGoalPlannerApi } from "../api";
import type { GoalDraftResponse, GoalMilestoneDraft, GoalRoadmapDraft, GoalTaskDraft } from "../api";
import {
  Plus,
  Calendar,
  Sparkles,
  CheckCircle2,
  CircleDashed,
  Check,
  Edit2,
  MoreHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useData } from "../context/DataContext";
import { HintBubble } from "./HintBubble";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import type { Task } from "../data/mockData";

type GoalPeriod = "week" | "month" | "year";

type TaskPriority = "Cao" | "Trung bình" | "Thấp";

type AIGoalDraft = {
  title: string;
  description: string;
  categoryId: string;
  deadline?: string;
  period: GoalPeriod;
  priority: "HIGH" | "MEDIUM" | "LOW";
  constraints: string;
  availableHoursPerWeek: string;
};

const EMPTY_AI_DRAFT: AIGoalDraft = {
  title: "",
  description: "",
  categoryId: "",
  deadline: "",
  period: "month",
  priority: "MEDIUM",
  constraints: "",
  availableHoursPerWeek: "",
};

const PERIODS: Record<GoalPeriod, { labelVi: string; labelEn: string; subVi: string; subEn: string; accent: string; pill: string; input: string }> = {
  week: {
    labelVi: "Mục tiêu Tuần",
    labelEn: "Weekly Goals",
    subVi: "Hành động ngắn hạn",
    subEn: "Short-term actions",
    accent: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-100",
    input: "bg-emerald-500",
  },
  month: {
    labelVi: "Mục tiêu Tháng",
    labelEn: "Monthly Goals",
    subVi: "Xây dựng nền tảng",
    subEn: "Building foundations",
    accent: "bg-blue-500",
    pill: "bg-blue-50 text-blue-700 border-blue-100",
    input: "bg-blue-500",
  },
  year: {
    labelVi: "Mục tiêu Năm",
    labelEn: "Yearly Goals",
    subVi: "Định hướng cốt lõi",
    subEn: "Core directions",
    accent: "bg-violet-500",
    pill: "bg-violet-50 text-violet-700 border-violet-100",
    input: "bg-violet-500",
  },
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  Cao: "text-rose-600 bg-rose-50 border-rose-200",
  "Trung bình": "text-amber-600 bg-amber-50 border-amber-200",
  Thấp: "text-emerald-600 bg-emerald-50 border-emerald-200",
};

const PRIORITY_DOT: Record<TaskPriority, string> = {
  Cao: "bg-rose-500",
  "Trung bình": "bg-amber-500",
  Thấp: "bg-emerald-500",
};

const PERIOD_BADGES: Record<GoalPeriod, string> = {
  week: "border-emerald-200 bg-emerald-50 text-emerald-700",
  month: "border-blue-200 bg-blue-50 text-blue-700",
  year: "border-violet-200 bg-violet-50 text-violet-700",
};

function getValidDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatBoardDate(value: string | undefined, language: "vi" | "en") {
  const date = getValidDate(value);
  if (!date) return value || (language === "vi" ? "Không có hạn" : "No date");
  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getRelevantTaskDate(task: Pick<Task, "scheduledAt" | "dueDate">) {
  return getValidDate(task.scheduledAt) || getValidDate(task.dueDate);
}

function getShortTaskDateLabel(task: Pick<Task, "scheduledAt" | "dueDate">, language: "vi" | "en") {
  const date = getRelevantTaskDate(task);
  if (!date) return language === "vi" ? "Không hạn" : "No date";
  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function getPeriodLabel(period: GoalPeriod, language: "vi" | "en") {
  return language === "vi" ? PERIODS[period].labelVi : PERIODS[period].labelEn;
}

function getPriorityLabel(priority: TaskPriority, language: "vi" | "en") {
  if (language === "vi") return priority;
  if (priority === "Cao") return "High";
  if (priority === "Trung bình") return "Medium";
  return "Low";
}

function getMilestoneStatus(totalTasks: number, completedTasks: number, language: "vi" | "en") {
  if (totalTasks === 0) {
    return {
      label: language === "vi" ? "Chưa bắt đầu" : "Not Started",
      className: "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400",
      iconClass: "text-slate-400",
    };
  }

  if (completedTasks === totalTasks) {
    return {
      label: language === "vi" ? "Hoàn thành" : "Completed",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
      iconClass: "text-emerald-500",
    };
  }

  return {
    label: language === "vi" ? "Đang làm" : "In Progress",
    className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
    iconClass: "text-amber-500",
  };
}

function GoalTaskCard({
  task,
  isExpanded,
  onExpandChange,
  onToggle,
  onDelete,
  onUpdate,
  language,
}: {
  task: Task;
  isExpanded: boolean;
  onExpandChange: (expanded: boolean) => void;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  onUpdate: (id: string, updates: Partial<Task>) => Promise<void> | void;
  language: "vi" | "en";
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);
  const [draftChecklist, setDraftChecklist] = useState<string[]>(task.checklist || []);
  const [checkedChecklistItems, setCheckedChecklistItems] = useState<Set<number>>(new Set());

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

  const handleCardClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button,input,textarea,select,a")) return;
    onExpandChange(!isExpanded);
  };

  return (
    <div
      onClick={handleCardClick}
      aria-expanded={isExpanded}
      className={`group rounded-lg border border-zinc-200 bg-white p-3 transition-all duration-200 hover:border-zinc-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 ${task.completed ? "opacity-60" : ""}`}
    >
      <div className="flex min-h-[56px] items-start gap-3">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggle(task);
          }}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
            task.completed ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 text-transparent hover:border-zinc-500"
          }`}
          aria-label={language === "vi" ? "Đổi trạng thái task" : "Toggle task completion"}
        >
          <Check size={11} />
        </button>

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
              <h4
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  setIsRenaming(true);
                }}
                className={`line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 dark:text-slate-100 ${task.completed ? "line-through text-zinc-500 dark:text-slate-500" : ""}`}
                title={language === "vi" ? "Nhấp đúp để đổi tên" : "Double-click to rename"}
              >
                {task.title}
              </h4>
            )}

            <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              {!task.completed && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsRenaming(true);
                  }}
                  className="rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-slate-800 dark:hover:text-white"
                  title={language === "vi" ? "Sửa tiêu đề" : "Edit title"}
                >
                  <Edit2 size={13} />
                </button>
              )}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(task);
                }}
                className="rounded p-1 text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                title={language === "vi" ? "Xóa task" : "Delete task"}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <span className={`inline-flex min-w-0 items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold ${PRIORITY_COLORS[task.priority]}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
              <span className="truncate">{getPriorityLabel(task.priority, language)}</span>
            </span>
            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-medium text-zinc-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Calendar size={10} className="shrink-0" />
              <span className="truncate">{getShortTaskDateLabel(task, language)}</span>
            </span>
          </div>

          <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
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
                    <div className="text-[10px] font-bold uppercase text-zinc-400 dark:text-slate-500">Checklist</div>
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
                        <div key={`${task.id}-goal-check-${index}`} className="flex items-center gap-2">
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
                      <div className="pt-1 text-[10px] font-semibold text-zinc-400 dark:text-slate-500">
                        {checkedChecklistItems.size} / {draftChecklist.length} {language === "vi" ? "hoàn thành trực quan" : "visually checked"}
                      </div>
                    </div>
                  ) : (
                    <p className="rounded-md border border-dashed border-zinc-200 px-3 py-2 text-xs text-zinc-400 dark:border-slate-800 dark:text-slate-500">
                      {language === "vi" ? "Chưa có checklist." : "No checklist items yet."}
                    </p>
                  )}
                </div>

                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase text-zinc-400 dark:text-slate-500">
                    {language === "vi" ? "Ghi chú" : "Notes"}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-slate-400">
                    {task.contexts?.length ? task.contexts.join(", ") : (language === "vi" ? "Chưa có ghi chú." : "No notes yet.")}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggle(task);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Check size={12} />
                    {task.completed
                      ? (language === "vi" ? "Mở lại" : "Reopen")
                      : (language === "vi" ? "Hoàn thành" : "Complete")}
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(task);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
                  >
                    <Trash2 size={12} />
                    {language === "vi" ? "Xóa" : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GoalsView() {
  const {
    categories,
    goals,
    tasks,
    addGoal,
    updateGoal,
    deleteGoal,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    addTask,
    updateTask,
    deleteTask,
    language,
    refreshData,
  } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const defaultCategoryId = categories[0]?.id || "";
  const [goalDraft, setGoalDraft] = useState<{ title: string; categoryId: string; period: GoalPeriod }>({
    title: "",
    categoryId: "",
    period: "month",
  });
  const [goalEdits, setGoalEdits] = useState<Record<string, { title: string; description: string; categoryId: string; period: GoalPeriod; targetDate: string }>>({});
  const [openGoalMenuId, setOpenGoalMenuId] = useState<string | null>(null);
  const [milestoneDrafts, setMilestoneDrafts] = useState<Record<string, { title: string; description: string; targetDate: string }>>({});
  const [milestoneEdits, setMilestoneEdits] = useState<Record<string, { title: string; description: string; targetDate: string }>>({});
  const [taskDrafts, setTaskDrafts] = useState<Record<string, { title: string; priority: TaskPriority; dueDate: string }>>({});
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [aiDraft, setAiDraft] = useState<AIGoalDraft>(EMPTY_AI_DRAFT);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiApproving, setAiApproving] = useState(false);
  const [aiDraftResult, setAiDraftResult] = useState<GoalDraftResponse | null>(null);
  const [aiRoadmap, setAiRoadmap] = useState<GoalRoadmapDraft | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  type GoalItem = (typeof goals)[number];

  const totalGoals = goals.length;

  const splitConstraints = (value: string) =>
    value
      .split(/\r?\n|;/)
      .map((item) => item.trim())
      .filter(Boolean);

  const handleGenerateAIGoal = async () => {
    const { title, description, categoryId, period, deadline, priority, constraints } = aiDraft;
    if (!title.trim() || !categoryId) return;

    setAiGenerating(true);
    setAiError(null);
    try {
      const category = categories.find((item) => item.id === categoryId);
      const result = await aiGoalPlannerApi.generate({
        title: title.trim(),
        description: description.trim() || undefined,
        categoryId,
        categoryName: category?.name,
        deadline: deadline || undefined,
        period,
        targetDate: deadline || undefined,
        priority,
        constraints: splitConstraints(constraints),
        availableHoursPerWeek: aiDraft.availableHoursPerWeek ? Number(aiDraft.availableHoursPerWeek) : undefined,
      });
      setAiDraftResult(result);
      setAiRoadmap(result.roadmap);
    } catch (error) {
      console.error("Failed to generate AI goal draft", error);
      
      let message = language === "vi"? "Không thể tạo bản nháp AI. Vui lòng thử lại." : "Could not generate the AI draft. Please try again.";
      
      if (error instanceof Error) {
        switch (error.message) {
          case "Goal limit reached. Upgrade to premium to create more goals.":
            message = language === "vi" ? "Bạn đã đạt giới hạn số lượng mục tiêu. Vui lòng nâng cấp Premium để tạo thêm mục tiêu." : error.message;
            break;

          case "AI service unavailable. Please try again later.": 
            message = language === "vi" ? "Dịch vụ AI hiện không khả dụng. Vui lòng thử lại sau." : error.message;
            break;

          default:
            message = language === "vi" ? "Không thể tạo bản nháp AI. Vui lòng thử lại." : error.message;
        }
      }
      setAiError(message);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCreateFromAIDraft = async () => {
    if (!aiDraftResult || !aiRoadmap) return;
    setAiApproving(true);
    setAiError(null);
    try {
      await aiGoalPlannerApi.createGoalFromDraft({ draftId: aiDraftResult.id, roadmap: aiRoadmap });
      setAiDraft(EMPTY_AI_DRAFT);
      setAiDraftResult(null);
      setAiRoadmap(null);
      await refreshData();
    } catch (error) {
      console.error("Failed to create goal from AI draft", error);

      if (error instanceof Error) {
        if (error.message === "Goal limit reached. Upgrade to premium to create more goals.") {
          setAiError(language === "vi" ? "Bạn đã đạt giới hạn số lượng mục tiêu. Vui lòng nâng cấp Premium để tạo thêm mục tiêu." : error.message);
        } else {
          setAiError(language === "vi" ? "Không thể tạo mục tiêu từ bản nháp." : error.message);
        }
      }
    } finally {
      setAiApproving(false);
    }
  };

  const updateRoadmap = (updates: Partial<GoalRoadmapDraft>) => {
    setAiRoadmap((prev) => prev ? { ...prev, ...updates } : prev);
  };

  const updateDraftMilestone = (index: number, updates: Partial<GoalMilestoneDraft>) => {
    setAiRoadmap((prev) => {
      if (!prev) return prev;
      const milestones = [...(prev.milestones || [])];
      milestones[index] = { ...milestones[index], ...updates };
      return { ...prev, milestones };
    });
  };

  const addDraftMilestone = () => {
    setAiRoadmap((prev) => {
      if (!prev) return prev;
      const milestones = [
        ...(prev.milestones || []),
        {
          title: language === "vi" ? "Cột mốc mới" : "New milestone",
          description: "",
          targetDate: prev.targetDate,
          tasks: [],
        },
      ];
      return { ...prev, milestones };
    });
  };

  const removeDraftMilestone = (index: number) => {
    setAiRoadmap((prev) => {
      if (!prev) return prev;
      return { ...prev, milestones: (prev.milestones || []).filter((_, itemIndex) => itemIndex !== index) };
    });
  };

  const updateDraftTask = (milestoneIndex: number, taskIndex: number, updates: Partial<GoalTaskDraft>) => {
    setAiRoadmap((prev) => {
      if (!prev) return prev;
      const milestones = [...(prev.milestones || [])];
      const milestone = milestones[milestoneIndex];
      const tasks = [...(milestone.tasks || [])];
      tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
      milestones[milestoneIndex] = { ...milestone, tasks };
      return { ...prev, milestones };
    });
  };

  const addDraftTask = (milestoneIndex: number) => {
    setAiRoadmap((prev) => {
      if (!prev) return prev;
      const milestones = [...(prev.milestones || [])];
      const milestone = milestones[milestoneIndex];
      const tasks = [
        ...(milestone.tasks || []),
        {
          title: language === "vi" ? "Công việc mới" : "New task",
          description: "",
          dueDate: milestone.targetDate || prev.targetDate,
          priority: "MEDIUM" as const,
          estimatedHours: 1,
        },
      ];
      milestones[milestoneIndex] = { ...milestone, tasks };
      return { ...prev, milestones };
    });
  };

  const removeDraftTask = (milestoneIndex: number, taskIndex: number) => {
    setAiRoadmap((prev) => {
      if (!prev) return prev;
      const milestones = [...(prev.milestones || [])];
      const milestone = milestones[milestoneIndex];
      milestones[milestoneIndex] = {
        ...milestone,
        tasks: (milestone.tasks || []).filter((_, itemIndex) => itemIndex !== taskIndex),
      };
      return { ...prev, milestones };
    });
  };

  const handleAddGoal = async () => {
    const title = goalDraft.title.trim();
    const categoryId = goalDraft.categoryId || defaultCategoryId;
    if (!title || !categoryId) return;

    if (!user?.isPremium && totalGoals >= 3) {
      setShowUpgradeModal(true);
      return;
    }

    await addGoal({
      title,
      description: "",
      categoryId,
      type: "SMART",
      period: goalDraft.period,
      targetDate: "",
      color: goalDraft.period === "week" ? "emerald" : goalDraft.period === "month" ? "blue" : "purple",
    });

    setGoalDraft((prev) => ({ ...prev, title: "", categoryId }));
  };

  const beginEditGoal = (goal: GoalItem) => {
    setOpenGoalMenuId(null);
    setGoalEdits((prev) => ({
      ...prev,
      [goal.id]: {
        title: goal.title,
        description: goal.description || "",
        categoryId: goal.categoryId || defaultCategoryId,
        period: goal.period,
        targetDate: goal.targetDate || "",
      },
    }));
  };

  const cancelEditGoal = (goalId: string) => {
    setGoalEdits((prev) => {
      const next = { ...prev };
      delete next[goalId];
      return next;
    });
  };

  const saveGoalEdit = async (goalId: string) => {
    const draft = goalEdits[goalId];
    if (!draft?.title.trim()) return;
    await updateGoal(goalId, {
      title: draft.title.trim(),
      description: draft.description.trim(),
      categoryId: draft.categoryId || undefined,
      period: draft.period,
      targetDate: draft.targetDate || undefined,
    });
    cancelEditGoal(goalId);
  };

  const handleAddMilestone = async (goalId: string) => {
    const draft = milestoneDrafts[goalId] || { title: "", description: "", targetDate: "" };
    const title = draft.title.trim();
    if (!title) return;
    await addMilestone(goalId, {
      title,
      description: draft.description.trim() || undefined,
      targetDate: draft.targetDate || undefined,
    });
    setMilestoneDrafts((prev) => ({ ...prev, [goalId]: { title: "", description: "", targetDate: "" } }));
  };

  const beginEditMilestone = (_goalId: string, milestone: { id: string; title: string; description?: string; targetDate?: string }) => {
    setMilestoneEdits((prev) => ({
      ...prev,
      [milestone.id]: {
        title: milestone.title,
        description: milestone.description || "",
        targetDate: milestone.targetDate || "",
      },
    }));
  };

  const cancelEditMilestone = (milestoneId: string) => {
    setMilestoneEdits((prev) => {
      const next = { ...prev };
      delete next[milestoneId];
      return next;
    });
  };

  const saveMilestoneEdit = async (goalId: string, milestoneId: string) => {
    const draft = milestoneEdits[milestoneId];
    if (!draft?.title.trim()) return;
    await updateMilestone(goalId, milestoneId, {
      title: draft.title.trim(),
      description: draft.description.trim() || undefined,
      targetDate: draft.targetDate || undefined,
    });
    cancelEditMilestone(milestoneId);
  };

  const toggleTaskComplete = async (task: Task) => {
    const completed = !task.completed;
    await updateTask(task.id, { completed, status: completed ? "COMPLETED" : "IN_PROGRESS" });
  };

  const handleDeleteTask = async (task: Task) => {
    await deleteTask(task.id);
    if (expandedTaskId === task.id) {
      setExpandedTaskId(null);
    }
  };

  const handleAddTaskToMilestone = async (goal: GoalItem, milestone: GoalItem["milestones"][number]) => {
    const draft = taskDrafts[milestone.id] || { title: "", priority: "Trung bình" as TaskPriority, dueDate: milestone.targetDate || goal.targetDate || "" };
    const title = draft.title.trim();
    if (!title) return;

    await addTask({
      title,
      description: "",
      dueDate: draft.dueDate || milestone.targetDate || goal.targetDate || "",
      priority: draft.priority,
      status: "IN_PROGRESS",
      completed: false,
      color: goal.color || "indigo",
      categoryId: goal.categoryId || defaultCategoryId || undefined,
      goalId: goal.id,
      milestoneId: milestone.id,
      showOnCalendar: true,
      checklist: [],
      contexts: [],
      sortOrder: 0,
    });

    setTaskDrafts((prev) => ({
      ...prev,
      [milestone.id]: { title: "", priority: draft.priority, dueDate: draft.dueDate },
    }));
  };

  const renderAIPlanner = () => {
    const selectedCategory = categories.find((category) => category.id === (aiDraft.categoryId || defaultCategoryId));

    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
                <Sparkles size={16} />
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-slate-100">
                {language === "vi" ? "AI Goal Planner" : "AI Goal Planner"}
              </h2>
            </div>
          </div>
          {aiDraftResult ? (
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
              {language === "vi" ? "Bản nháp sẵn sàng" : "Draft ready"}
            </span>
          ) : null}
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
          <div className="space-y-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <input
              type="text"
              value={aiDraft.title}
              onChange={(event) => setAiDraft((prev) => ({ ...prev, title: event.target.value }))}
              placeholder={language === "vi" ? "Mục tiêu bạn muốn đạt được" : "Goal you want to achieve"}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <textarea
              value={aiDraft.description}
              onChange={(event) => setAiDraft((prev) => ({ ...prev, description: event.target.value }))}
              rows={3}
              placeholder={language === "vi" ? "Bối cảnh hoặc mô tả mục tiêu" : "Context or goal description"}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                value={aiDraft.categoryId || defaultCategoryId}
                onChange={(event) => setAiDraft((prev) => ({ ...prev, categoryId: event.target.value }))}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                disabled={!categories.length}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                value={aiDraft.period}
                onChange={(event) => setAiDraft((prev) => ({ ...prev, period: event.target.value as GoalPeriod }))}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {(Object.keys(PERIODS) as GoalPeriod[]).map((period) => (
                  <option key={period} value={period}>
                    {language === "vi" ? PERIODS[period].labelVi : PERIODS[period].labelEn}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={aiDraft.deadline}
                onChange={(event) => setAiDraft((prev) => ({ ...prev, deadline: event.target.value }))}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <select
                value={aiDraft.priority}
                onChange={(event) => setAiDraft((prev) => ({ ...prev, priority: event.target.value as AIGoalDraft["priority"] }))}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="HIGH">{language === "vi" ? "Ưu tiên cao" : "High priority"}</option>
                <option value="MEDIUM">{language === "vi" ? "Ưu tiên vừa" : "Medium priority"}</option>
                <option value="LOW">{language === "vi" ? "Ưu tiên thấp" : "Low priority"}</option>
              </select>
            </div>
            <input
              type="number"
              min="1"
              value={aiDraft.availableHoursPerWeek}
              onChange={(event) => setAiDraft((prev) => ({ ...prev, availableHoursPerWeek: event.target.value }))}
              placeholder={language === "vi" ? "Số giờ mỗi tuần có thể dành cho mục tiêu" : "Available hours per week"}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <textarea
              value={aiDraft.constraints}
              onChange={(event) => setAiDraft((prev) => ({ ...prev, constraints: event.target.value }))}
              rows={3}
              placeholder={language === "vi" ? "Các lưu ý để AI phân tích tốt hơn (mỗi dòng một ý) \nVí dụ: thời gian rảnh, tình trạng hiện tại,... " : "Constraints, one per line (e.g., available time, current situation, etc.)"}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            {aiError ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">{aiError}</div> : null}
            <button
              type="button"
              onClick={() => void handleGenerateAIGoal()}
              disabled={aiGenerating || !aiDraft.title.trim() || !(aiDraft.categoryId || defaultCategoryId)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Sparkles size={15} />
              {aiGenerating
                ? (language === "vi" ? "Đang tạo..." : "Generating...")
                : aiDraftResult
                ? (language === "vi" ? "Tạo lại lộ trình" : "Regenerate roadmap")
                : (language === "vi" ? "Tạo lộ trình bằng AI" : "Generate AI roadmap")}
            </button>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/30">
            {aiRoadmap ? (
              <div className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    value={aiRoadmap.title}
                    onChange={(event) => updateRoadmap({ title: event.target.value })}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="date"
                    value={aiRoadmap.targetDate || ""}
                    onChange={(event) => updateRoadmap({ targetDate: event.target.value })}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <textarea
                    value={aiRoadmap.summary || aiRoadmap.description || ""}
                    onChange={(event) => updateRoadmap({ summary: event.target.value, description: event.target.value })}
                    rows={2}
                    className="sm:col-span-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-3">
                  {(aiRoadmap.milestones || []).map((milestone, milestoneIndex) => (
                    <div key={`${milestone.title}-${milestoneIndex}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
                        <input
                          type="text"
                          value={milestone.title}
                          onChange={(event) => updateDraftMilestone(milestoneIndex, { title: event.target.value })}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                        <input
                          type="date"
                          value={milestone.targetDate || ""}
                          onChange={(event) => updateDraftMilestone(milestoneIndex, { targetDate: event.target.value })}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                        <button
                          type="button"
                          onClick={() => removeDraftMilestone(milestoneIndex)}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
                        >
                          {language === "vi" ? "Xóa" : "Delete"}
                        </button>
                      </div>
                      <textarea
                        value={milestone.description || ""}
                        onChange={(event) => updateDraftMilestone(milestoneIndex, { description: event.target.value })}
                        rows={2}
                        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                      <div className="mt-3 space-y-2">
                        {(milestone.tasks || []).map((task, taskIndex) => (
                          <div key={`${task.title}-${taskIndex}`} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950 sm:grid-cols-[minmax(0,1fr)_8rem_7rem_4rem_auto]">
                            <input
                              type="text"
                              value={task.title}
                              onChange={(event) => updateDraftTask(milestoneIndex, taskIndex, { title: event.target.value })}
                              className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            />
                            <input
                              type="date"
                              value={task.dueDate || ""}
                              onChange={(event) => updateDraftTask(milestoneIndex, taskIndex, { dueDate: event.target.value })}
                              className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            />
                            <select
                              value={task.priority || "MEDIUM"}
                              onChange={(event) => updateDraftTask(milestoneIndex, taskIndex, { priority: event.target.value as GoalTaskDraft["priority"] })}
                              className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            >
                              <option value="HIGH">HIGH</option>
                              <option value="MEDIUM">MEDIUM</option>
                              <option value="LOW">LOW</option>
                            </select>
                            <input
                              type="number"
                              min="1"
                              value={task.estimatedHours || ""}
                              onChange={(event) => updateDraftTask(milestoneIndex, taskIndex, { estimatedHours: Number(event.target.value) || undefined })}
                              className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            />
                            <button
                              type="button"
                              onClick={() => removeDraftTask(milestoneIndex, taskIndex)}
                              className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
                            >
                              {language === "vi" ? "Xóa" : "Delete"}
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => addDraftTask(milestoneIndex)}
                        className="mt-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                      >
                        <Plus size={13} />
                        {language === "vi" ? "Thêm task" : "Add task"}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={addDraftMilestone}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                  >
                    <Plus size={14} />
                    {language === "vi" ? "Thêm milestone" : "Add milestone"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCreateFromAIDraft()}
                    disabled={aiApproving}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 size={14} />
                    {aiApproving ? (language === "vi" ? "Đang tạo..." : "Creating...") : (language === "vi" ? "Duyệt và tạo goal" : "Approve and create goal")}
                  </button>
                </div>
              </div>
            ) : aiGenerating ? (
              <div className="flex min-h-[22rem] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 px-4 text-center dark:border-indigo-500/20 dark:bg-indigo-500/5">
                <div className="relative flex h-14 w-14 items-center justify-center">
                  <span className="absolute h-14 w-14 animate-ping rounded-full bg-indigo-400/40" />
                  <span className="absolute h-14 w-14 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                  <Sparkles size={22} className="relative text-indigo-500" />
                </div>
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-300">
                  {language === "vi" ? "AI đang xây dựng lộ trình cho bạn..." : "AI is building your roadmap..."}
                </p>
                <p className="max-w-xs text-xs text-slate-500 dark:text-slate-400">
                  {language === "vi"
                    ? "Quá trình này có thể mất vài giây, vui lòng chờ trong giây lát."
                    : "This may take a few seconds, please hold on."}
                </p>
              </div>
            ) : (
              <div className="flex min-h-[22rem] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                {language === "vi"
                  ? "Bản nháp AI sẽ xuất hiện ở đây để bạn chỉnh sửa trước khi tạo mục tiêu."
                  : "The AI draft will appear here so you can edit it before creating the goal."}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderGoalCard = (goal: GoalItem) => {
    const goalTasks = tasks.filter((task) => task.goalId === goal.id);
    const completedTasks = goalTasks.filter((task) => task.completed).length;
    const progress = goalTasks.length ? Math.round((completedTasks / goalTasks.length) * 100) : 0;
    const category = categories.find((item) => item.id === goal.categoryId);
    const categoryLabel = goal.categoryName || category?.name || (language === "vi" ? "Không danh mục" : "No category");
    const goalColor = goal.color || "indigo";
    const goalPriority: TaskPriority = goalTasks.some((task) => task.priority === "Cao")
      ? "Cao"
      : goalTasks.some((task) => task.priority === "Trung bình")
      ? "Trung bình"
      : "Thấp";
    const editingGoal = goalEdits[goal.id];

    return (
      <section key={goal.id} className="flex h-full w-[calc(100vw-2rem)] max-w-[420px] flex-none snap-start flex-col rounded-xl border border-zinc-200 bg-zinc-100/70 dark:border-slate-800 dark:bg-slate-900/60 sm:w-[400px]">
        <div className="rounded-t-xl border-b border-zinc-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          {editingGoal ? (
            <div className="space-y-3">
              <input
                value={editingGoal.title}
                onChange={(event) => setGoalEdits((prev) => ({ ...prev, [goal.id]: { ...editingGoal, title: event.target.value } }))}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base font-bold text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
              />
              <textarea
                value={editingGoal.description}
                onChange={(event) => setGoalEdits((prev) => ({ ...prev, [goal.id]: { ...editingGoal, description: event.target.value } }))}
                rows={2}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-700 outline-none transition focus:border-zinc-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <div className="grid gap-2 sm:grid-cols-3">
                <select
                  value={editingGoal.categoryId}
                  onChange={(event) => setGoalEdits((prev) => ({ ...prev, [goal.id]: { ...editingGoal, categoryId: event.target.value } }))}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {categories.map((categoryItem) => (
                    <option key={categoryItem.id} value={categoryItem.id}>{categoryItem.name}</option>
                  ))}
                </select>
                <select
                  value={editingGoal.period}
                  onChange={(event) => setGoalEdits((prev) => ({ ...prev, [goal.id]: { ...editingGoal, period: event.target.value as GoalPeriod } }))}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {(Object.keys(PERIODS) as GoalPeriod[]).map((period) => (
                    <option key={period} value={period}>{getPeriodLabel(period, language)}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={editingGoal.targetDate}
                  onChange={(event) => setGoalEdits((prev) => ({ ...prev, [goal.id]: { ...editingGoal, targetDate: event.target.value } }))}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void saveGoalEdit(goal.id)}
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-800 dark:bg-slate-100 dark:text-slate-950"
                >
                  {language === "vi" ? "Lưu goal" : "Save goal"}
                </button>
                <button
                  type="button"
                  onClick={() => cancelEditGoal(goal.id)}
                  className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  {language === "vi" ? "Hủy" : "Cancel"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <h3 className="line-clamp-2 text-lg font-bold leading-tight text-zinc-950 dark:text-slate-50">
                      {goal.title}
                    </h3>
                    <button
                      type="button"
                      onClick={() => beginEditGoal(goal)}
                      className="mt-0.5 rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                      title={language === "vi" ? "Sửa goal" : "Edit goal"}
                    >
                      <Edit2 size={15} />
                    </button>
                  </div>
                  <div className="mt-2 inline-flex rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-bold text-zinc-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    {categoryLabel}
                  </div>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenGoalMenuId(openGoalMenuId === goal.id ? null : goal.id)}
                    className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    title={language === "vi" ? "Tác vụ khác" : "More actions"}
                  >
                    <MoreHorizontal size={17} />
                  </button>
                  {openGoalMenuId === goal.id ? (
                    <div className="absolute right-0 top-8 z-20 w-36 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenGoalMenuId(null);
                          void deleteGoal(goal.id);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 size={13} />
                        {language === "vi" ? "Xóa goal" : "Delete goal"}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-zinc-600 dark:text-slate-300">
                {goal.description || (language === "vi" ? "Goal chưa có mô tả." : "No goal description yet.")}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-bold ${PRIORITY_COLORS[goalPriority]}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[goalPriority]}`} />
                  {getPriorityLabel(goalPriority, language)}
                </span>
                <span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-bold ${PERIOD_BADGES[goal.period]}`}>
                  {getPeriodLabel(goal.period, language)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-bold text-zinc-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  <Calendar size={10} />
                  {formatBoardDate(goal.targetDate, language)}
                </span>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-slate-400">
                  <span>{completedTasks} / {goalTasks.length} {language === "vi" ? "task" : "tasks"}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-slate-800">
                  <div className={`h-full rounded-full transition-all duration-500 bg-blue-600 dark:bg-blue-400`} style={{ width: `${progress}%` }} />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          {goal.milestones?.length ? goal.milestones.map((milestone) => {
            const milestoneTasks = goalTasks.filter((task) => task.milestoneId === milestone.id);
            const milestoneCompletedTasks = milestoneTasks.filter((task) => task.completed).length;
            const milestoneProgress = milestoneTasks.length ? Math.round((milestoneCompletedTasks / milestoneTasks.length) * 100) : 0;
            const status = getMilestoneStatus(milestoneTasks.length, milestoneCompletedTasks, language);
            const editing = milestoneEdits[milestone.id];
            const taskDraft = taskDrafts[milestone.id] || { title: "", priority: "Trung bình" as TaskPriority, dueDate: milestone.targetDate || goal.targetDate || "" };

            return (
              <div key={milestone.id} className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/60">
                {editing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editing.title}
                      onChange={(event) => setMilestoneEdits((prev) => ({ ...prev, [milestone.id]: { ...editing, title: event.target.value } }))}
                      className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-semibold text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <textarea
                      value={editing.description}
                      onChange={(event) => setMilestoneEdits((prev) => ({ ...prev, [milestone.id]: { ...editing, description: event.target.value } }))}
                      rows={2}
                      placeholder={language === "vi" ? "Mô tả milestone" : "Milestone description"}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <input
                      type="date"
                      value={editing.targetDate}
                      onChange={(event) => setMilestoneEdits((prev) => ({ ...prev, [milestone.id]: { ...editing, targetDate: event.target.value } }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void saveMilestoneEdit(goal.id, milestone.id)}
                        className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-800 dark:bg-slate-100 dark:text-slate-950"
                      >
                        {language === "vi" ? "Lưu" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelEditMilestone(milestone.id)}
                        className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                      >
                        {language === "vi" ? "Hủy" : "Cancel"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {milestoneTasks.length > 0 && milestoneCompletedTasks === milestoneTasks.length
                            ? <CheckCircle2 size={15} className={status.iconClass} />
                            : <CircleDashed size={15} className={status.iconClass} />}
                          <h4 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{milestone.title}</h4>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          {milestone.description || (language === "vi" ? "Milestone chưa có mô tả." : "No milestone description yet.")}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => beginEditMilestone(goal.id, milestone)}
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                        >
                          {language === "vi" ? "Sửa" : "Edit"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteMilestone(goal.id, milestone.id)}
                          className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
                        >
                          {language === "vi" ? "Xóa" : "Delete"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        <Calendar size={10} />
                        {formatBoardDate(milestone.targetDate, language)}
                      </span>
                      <span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-bold ${status.className}`}>
                        {status.label}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {milestoneCompletedTasks}/{milestoneTasks.length} {language === "vi" ? "task" : "tasks"}
                      </span>
                    </div>
                  </>
                )}

                <div className="mt-3 space-y-2">
                  {milestoneTasks.length ? milestoneTasks.map((task) => (
                    <GoalTaskCard
                      key={task.id}
                      task={task}
                      language={language}
                      isExpanded={expandedTaskId === task.id}
                      onExpandChange={(expanded) => setExpandedTaskId(expanded ? task.id : null)}
                      onToggle={(item) => void toggleTaskComplete(item)}
                      onDelete={(item) => void handleDeleteTask(item)}
                      onUpdate={updateTask}
                    />
                  )) : (
                    <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-3 py-3 text-xs text-zinc-400 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-500">
                      {language === "vi" ? "Chưa có task" : "No tasks"}
                    </div>
                  )}

                  <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-2 dark:border-slate-800 dark:bg-slate-900/50">
                    <div className="mb-2 text-[10px] font-bold uppercase text-zinc-400 dark:text-slate-500">
                      {language === "vi" ? "Thêm task" : "Add task"}
                    </div>
                    <div className="grid gap-2">
                      <input
                        type="text"
                        value={taskDraft.title}
                        onChange={(event) => setTaskDrafts((prev) => ({ ...prev, [milestone.id]: { ...taskDraft, title: event.target.value } }))}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            void handleAddTaskToMilestone(goal, milestone);
                          }
                        }}
                        placeholder={language === "vi" ? "Tên task" : "Task title"}
                        className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                        <select
                          value={taskDraft.priority}
                          onChange={(event) => setTaskDrafts((prev) => ({ ...prev, [milestone.id]: { ...taskDraft, priority: event.target.value as TaskPriority } }))}
                          className="min-w-0 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        >
                          <option value="Cao">{language === "vi" ? "Cao" : "High"}</option>
                          <option value="Trung bình">{language === "vi" ? "Trung bình" : "Medium"}</option>
                          <option value="Thấp">{language === "vi" ? "Thấp" : "Low"}</option>
                        </select>
                        <input
                          type="date"
                          value={taskDraft.dueDate}
                          onChange={(event) => setTaskDrafts((prev) => ({ ...prev, [milestone.id]: { ...taskDraft, dueDate: event.target.value } }))}
                          className="min-w-0 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                        <button
                          type="button"
                          onClick={() => void handleAddTaskToMilestone(goal, milestone)}
                          className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-800 dark:bg-slate-100 dark:text-slate-950"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-4 py-6 text-center text-sm text-zinc-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
              <div className="font-semibold">{language === "vi" ? "Chưa có milestone" : "No milestones yet"}</div>
              <div className="mt-1 text-xs text-zinc-400">{language === "vi" ? "Thêm milestone bên dưới để bắt đầu phân rã goal." : "Add a milestone below to start breaking down this goal."}</div>
            </div>
          )}

          <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="mb-2 text-[10px] font-bold uppercase text-zinc-400 dark:text-slate-500">
              {language === "vi" ? "Thêm milestone" : "Add milestone"}
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={milestoneDrafts[goal.id]?.title || ""}
                onChange={(event) => setMilestoneDrafts((prev) => ({
                  ...prev,
                  [goal.id]: { title: event.target.value, description: prev[goal.id]?.description || "", targetDate: prev[goal.id]?.targetDate || "" },
                }))}
                placeholder={language === "vi" ? "Tên milestone" : "Milestone title"}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
              <textarea
                value={milestoneDrafts[goal.id]?.description || ""}
                onChange={(event) => setMilestoneDrafts((prev) => ({
                  ...prev,
                  [goal.id]: { title: prev[goal.id]?.title || "", description: event.target.value, targetDate: prev[goal.id]?.targetDate || "" },
                }))}
                placeholder={language === "vi" ? "Mô tả milestone" : "Milestone description"}
                rows={2}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={milestoneDrafts[goal.id]?.targetDate || ""}
                  onChange={(event) => setMilestoneDrafts((prev) => ({
                    ...prev,
                    [goal.id]: { title: prev[goal.id]?.title || "", description: prev[goal.id]?.description || "", targetDate: event.target.value },
                  }))}
                  className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => void handleAddMilestone(goal.id)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-slate-100 dark:text-slate-950"
                >
                  <Plus size={14} />
                  {language === "vi" ? "Thêm" : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderUpgradeModal = () => {
    if (!showUpgradeModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-indigo-500/35 bg-slate-900 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
              <Sparkles size={28} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold tracking-tight text-white">
                {language === "vi" ? "Mở Khóa Giới Hạn Mục Tiêu" : "Unlock Unlimited Goals"}
              </h3>
              <p className="mx-auto max-w-xs text-xs leading-relaxed text-slate-400">
                {language === "vi"
                  ? "Tài khoản thường bị giới hạn tối đa 3 mục tiêu. Hãy nâng cấp lên Premium để lập kế hoạch không giới hạn!"
                  : "Free accounts are limited to 3 goals. Upgrade to Premium for unlimited planning!"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.04] bg-slate-950/40 p-4 text-left text-xs space-y-2 text-slate-300">
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-400">✓</span>
                <span>{language === "vi" ? "Không giới hạn Mục tiêu & Thói quen" : "Unlimited Goals & Habits"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-400">✓</span>
                <span>{language === "vi" ? "Biểu đồ phân tích tiến độ nâng cao" : "Advanced progress charts"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-400">✓</span>
                <span>{language === "vi" ? "Trợ lý AI lập kế hoạch thông minh" : "AI Coach scheduling mentor"}</span>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 rounded-xl border border-white/[0.05] bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/10"
              >
                {language === "vi" ? "Để sau" : "Maybe Later"}
              </button>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  navigate("/pricing");
                }}
                className="flex-1 rounded-xl border border-transparent bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-center text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-600 hover:to-violet-700"
              >
                {language === "vi" ? "Nâng cấp ngay" : "Upgrade Now"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="sticky top-0 z-10 flex flex-shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 pb-5 pt-6 dark:border-slate-800 dark:bg-slate-950 sm:px-8 sm:pb-6 sm:pt-8">
        <div>
          <h1 className="text-[1.3rem] font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-[1.6rem]">
            {language === "vi" ? "Mục tiêu & AI Planner" : "Goals & AI Planner"}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            {language === "vi" ? "Tạo mục tiêu thông minh bằng AI, sau đó phân rã thành hành động cụ thể" : "Create smart goals with AI, then break them down into specific actions"}
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1440px] flex-1 space-y-8 px-4 pb-12 pt-4 sm:space-y-10 sm:px-8">
        <HintBubble id="goals_intro" title={language === "vi" ? "Mục tiêu & AI Planner" : "Goals & AI Planner"} color="violet" persistent={false}>
          {language === "vi"
            ? "Nhập mô tả mục tiêu của bạn, và AI sẽ tự động tạo ra một lộ trình chi tiết với các cột mốc, nhiệm vụ và thời gian ước tính. Sau đó bạn có thể duyệt lại, chỉnh sửa hoặc phê duyệt để tạo goal thực."
            : "Describe your goal, and AI will automatically generate a detailed roadmap with milestones, tasks, and time estimates. Then review, edit, or approve to create a real goal."}
        </HintBubble>

        {renderAIPlanner()}

        <div className="pb-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <Calendar className="h-4 w-4 text-zinc-600 dark:text-slate-350" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-slate-100">
                  {language === "vi" ? "Phân Rã Mục Tiêu" : "Goal Breakdown"}
                </h2>
        
              </div>
            </div>
          </div>

          <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:-mx-8 sm:px-8">
            <div className="flex h-[min(78vh,900px)] min-h-[620px] min-w-max snap-x snap-mandatory gap-4 pb-2">
              {goals.length ? goals.map(renderGoalCard) : (
                <div className="flex h-full w-[calc(100vw-2rem)] max-w-[420px] flex-none items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-white px-6 text-center text-sm text-zinc-500 dark:border-slate-800 dark:bg-slate-900 sm:w-[400px]">
                  {language === "vi" ? "Chưa có goal nào. Tạo goal đầu tiên ở cột bên cạnh." : "No goals yet. Create your first goal in the next column."}
                </div>              )}

              <section className="flex h-full w-[calc(100vw-2rem)] max-w-[420px] flex-none snap-start flex-col rounded-xl border border-dashed border-zinc-300 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:w-[400px]">
                <div className=" px-1 mb-3">
                  <h3 className="text-base font-bold text-zinc-950 dark:text-slate-50">
                    {language === "vi" ? "Tạo goal mới" : "Create a new goal"}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-slate-400">
                    {language === "vi" ? "Goal mới sẽ xuất hiện như một cột riêng." : "New goals appear as their own columns."}
                  </p>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={goalDraft.title}
                    onChange={(event) => setGoalDraft((prev) => ({ ...prev, title: event.target.value }))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleAddGoal();
                      }
                    }}
                    placeholder={language === "vi" ? "Ví dụ: Đạt IELTS 7.5" : "Example: Reach IELTS 7.5"}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                  <select
                    value={goalDraft.categoryId || defaultCategoryId}
                    onChange={(event) => setGoalDraft((prev) => ({ ...prev, categoryId: event.target.value }))}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    disabled={!categories.length}
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  <select
                    value={goalDraft.period}
                    onChange={(event) => setGoalDraft((prev) => ({ ...prev, period: event.target.value as GoalPeriod }))}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    {(Object.keys(PERIODS) as GoalPeriod[]).map((period) => (
                      <option key={period} value={period}>{getPeriodLabel(period, language)}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void handleAddGoal()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-950"
                    disabled={!goalDraft.title.trim() || !(goalDraft.categoryId || defaultCategoryId)}
                  >
                    <Plus size={14} />
                    {language === "vi" ? "Thêm goal" : "Add goal"}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {renderUpgradeModal()}
    </div>
  );
}
