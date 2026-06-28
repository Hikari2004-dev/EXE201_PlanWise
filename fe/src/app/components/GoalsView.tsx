import { useMemo, useState } from "react";
import { visionApi } from "../api";
import { COLOR_MAP } from "../data/mockData";
import {
  Plus,
  Target,
  Calendar,
  Briefcase,
  HeartPulse,
  Wallet,
  BookOpen,
  Sparkles,
  CheckCircle2,
  CircleDashed,
  ArrowUpRight,
} from "lucide-react";
import { useData } from "../context/DataContext";
import { HintBubble } from "./HintBubble";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";

type GoalPeriod = "week" | "month" | "year";

type VisionDraft = {
  title: string;
  description: string;
  categoryId: string;
  imageUrl: string;
  quote: string;
};

const EMPTY_VISION_DRAFT: VisionDraft = {
  title: "",
  description: "",
  categoryId: "",
  imageUrl: "",
  quote: "",
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

export function GoalsView() {
  const { categories, goals, tasks, visionItems, addGoal, updateGoal, addMilestone, updateMilestone, deleteMilestone, addVisionItem, updateVisionItem, deleteVisionItem, language } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const defaultCategoryId = categories[0]?.id || "";
  const [draftGoals, setDraftGoals] = useState<Record<GoalPeriod, { title: string; categoryId: string }>>({
    week: { title: "", categoryId: "" },
    month: { title: "", categoryId: "" },
    year: { title: "", categoryId: "" },
  });
  const [milestoneDrafts, setMilestoneDrafts] = useState<Record<string, { title: string; description: string; targetDate: string }>>({});
  const [milestoneEdits, setMilestoneEdits] = useState<Record<string, { title: string; description: string; targetDate: string }>>({});
  const [visionDraft, setVisionDraft] = useState<VisionDraft>(EMPTY_VISION_DRAFT);
  const [editingVisionId, setEditingVisionId] = useState<string | null>(null);
  const [visionUploading, setVisionUploading] = useState(false);

  const VISION_ICON_MAP = {
    career: { icon: Briefcase, color: "text-blue-500", bg: "bg-blue-50" },
    health: { icon: HeartPulse, color: "text-emerald-500", bg: "bg-emerald-50" },
    finance: { icon: Wallet, color: "text-amber-500", bg: "bg-amber-50" },
    learning: { icon: BookOpen, color: "text-purple-500", bg: "bg-purple-50" },
    default: { icon: Target, color: "text-slate-500", bg: "bg-slate-50" },
  } as const;

  const groupedGoals = useMemo(
    () => ({
      week: goals.filter((goal) => goal.period === "week"),
      month: goals.filter((goal) => goal.period === "month"),
      year: goals.filter((goal) => goal.period === "year"),
    }),
    [goals],
  );

  type GoalItem = (typeof goals)[number];
  type TaskItem = (typeof tasks)[number];

  const totalGoals = goals.length;

  const resolveVisionCategory = (categoryId: string) => categories.find((category) => category.id === categoryId);

  const handleVisionImageSelect = async (file: File | null) => {
    if (!file) return;

    setVisionUploading(true);
    try {
      const { uploadUrl, publicUrl } = await visionApi.presignImageUpload({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      });

      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error("Failed to upload vision image");
      }

      setVisionDraft((prev) => ({ ...prev, imageUrl: publicUrl }));
    } finally {
      setVisionUploading(false);
    }
  };

  const handleAddGoal = async (period: GoalPeriod) => {
    const title = draftGoals[period].title.trim();
    const categoryId = draftGoals[period].categoryId || defaultCategoryId;
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
      period,
      targetDate: "",
      color: period === "week" ? "emerald" : period === "month" ? "blue" : "violet",
    });

    setDraftGoals((prev) => ({ ...prev, [period]: { title: "", categoryId } }));
  };

  const bumpProgress = (goal: GoalItem) => {
    updateGoal(goal.id, { progress: Math.min(100, goal.progress + 10) });
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

  const beginEditVisionItem = (item: { id: string; title: string; description?: string; categoryId?: string; imageUrl?: string; quote?: string }) => {
    setEditingVisionId(item.id);
    setVisionDraft({
      title: item.title,
      description: item.description || "",
      categoryId: item.categoryId || defaultCategoryId,
      imageUrl: item.imageUrl || "",
      quote: item.quote || "",
    });
  };

  const cancelEditVisionItem = () => {
    setEditingVisionId(null);
    setVisionDraft(EMPTY_VISION_DRAFT);
  };

  const saveVisionItem = async () => {
    const title = visionDraft.title.trim();
    const categoryId = visionDraft.categoryId || defaultCategoryId;
    const category = resolveVisionCategory(categoryId);
    if (!title || !categoryId || !category) return;

    if (editingVisionId) {
      await updateVisionItem(editingVisionId, {
        title,
        description: visionDraft.description.trim() || undefined,
        categoryId,
        categoryName: category.name,
        categoryColor: category.color,
        imageUrl: visionDraft.imageUrl.trim() || undefined,
        quote: visionDraft.quote.trim() || undefined,
      });
      cancelEditVisionItem();
      return;
    }

    await addVisionItem({
      title,
      description: visionDraft.description.trim(),
      categoryId,
      categoryName: category.name,
      categoryColor: category.color,
      imageUrl: visionDraft.imageUrl.trim() || undefined,
      quote: visionDraft.quote.trim() || undefined,
    });
    setVisionDraft(EMPTY_VISION_DRAFT);
  };

  const renderTaskRow = (task: TaskItem, compact = false) => {
    const statusLabel = task.completed ? (language === "vi" ? "Hoàn thành" : "Done") : (language === "vi" ? "Đang làm" : "In progress");

    return (
      <div key={task.id} className={`rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200 ${compact ? "" : "shadow-sm"}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`mt-0.5 h-2 w-2 rounded-full ${task.completed ? "bg-emerald-500" : "bg-indigo-500"}`} />
              <span className="truncate font-medium">{task.title}</span>
            </div>
            {task.description ? <p className="mt-1 line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400">{task.description}</p> : null}
          </div>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${task.completed ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}>
            {statusLabel}
          </span>
        </div>
      </div>
    );
  };

  const renderGoalCard = (goal: GoalItem) => {
    const goalTasks = tasks.filter((task) => task.goalId === goal.id);
    const completedTasks = goalTasks.filter((task) => task.completed).length;

    return (
      <div key={goal.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50">{goal.title}</h3>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {goal.type}
                </span>
              </div>
              {goal.description ? <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{goal.description}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => bumpProgress(goal)}
              className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
            >
              <ArrowUpRight size={12} />
              +10%
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2 py-1 dark:border-slate-700">
              <Calendar size={12} />
              {goal.targetDate || (language === "vi" ? "Chưa có hạn" : "No due date")}
            </span>
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {completedTasks}/{goalTasks.length} {language === "vi" ? "task hoàn thành" : "tasks done"}
            </span>
          </div>

          <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
            <div className={`h-full rounded-full ${PERIODS[goal.period].accent}`} style={{ width: `${Math.min(100, Math.max(0, goal.progress || 0))}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span>{goal.progress}%</span>
            <span>{goal.categoryName}</span>
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div className="space-y-3">
            {goal.milestones?.length ? goal.milestones.map((milestone) => {
              const milestoneTasks = goalTasks.filter((task) => task.milestoneId === milestone.id);
              const editing = milestoneEdits[milestone.id];
              return (
                <div key={milestone.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                  {editing ? (
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <CircleDashed size={14} className="text-slate-400" />
                            <input
                              type="text"
                              value={editing.title}
                              onChange={(e) => setMilestoneEdits((prev) => ({ ...prev, [milestone.id]: { ...editing, title: e.target.value } }))}
                              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-semibold text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => void saveMilestoneEdit(goal.id, milestone.id)}
                            className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
                          >
                            {language === "vi" ? "Lưu" : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => cancelEditMilestone(milestone.id)}
                            className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                          >
                            {language === "vi" ? "Hủy" : "Cancel"}
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={editing.description}
                        onChange={(e) => setMilestoneEdits((prev) => ({ ...prev, [milestone.id]: { ...editing, description: e.target.value } }))}
                        rows={2}
                        placeholder={language === "vi" ? "Mô tả milestone" : "Milestone description"}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                      />
                      <input
                        type="date"
                        value={editing.targetDate}
                        onChange={(e) => setMilestoneEdits((prev) => ({ ...prev, [milestone.id]: { ...editing, targetDate: e.target.value } }))}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {milestone.completed ? <CheckCircle2 size={14} className="text-emerald-500" /> : <CircleDashed size={14} className="text-slate-400" />}
                            <h4 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{milestone.title}</h4>
                          </div>
                          {milestone.description ? <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{milestone.description}</p> : null}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => beginEditMilestone(goal.id, milestone)}
                            className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                          >
                            {language === "vi" ? "Sửa" : "Edit"}
                          </button>
                          <button
                            type="button"
                            onClick={() => updateMilestone(goal.id, milestone.id, { completed: !milestone.completed })}
                            className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                          >
                            {milestone.completed ? (language === "vi" ? "Bỏ hoàn thành" : "Undo") : (language === "vi" ? "Hoàn thành" : "Done")}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteMilestone(goal.id, milestone.id)}
                            className="rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
                          >
                            {language === "vi" ? "Xóa" : "Delete"}
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{milestone.targetDate || (language === "vi" ? "Không có hạn" : "No date")}</span>
                        <span>{milestone.completed ? (language === "vi" ? "Đã xong" : "Completed") : (language === "vi" ? "Chưa xong" : "Open")}</span>
                      </div>
                    </>
                  )}

                  <div className="mt-3 space-y-2">
                    {milestoneTasks.length ? milestoneTasks.map((task) => renderTaskRow(task, true)) : (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-400 dark:border-slate-800 dark:bg-slate-900/60">
                        {language === "vi" ? "Chưa có task nào" : "No tasks yet"}
                      </div>
                    )}
                  </div>
                </div>
              );
            }) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                {language === "vi" ? "Chưa có milestone" : "No milestones yet"}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {language === "vi" ? "Thêm milestone" : "Add milestone"}
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={milestoneDrafts[goal.id]?.title || ""}
                onChange={(e) => setMilestoneDrafts((prev) => ({
                  ...prev,
                  [goal.id]: { title: e.target.value, description: prev[goal.id]?.description || "", targetDate: prev[goal.id]?.targetDate || "" },
                }))}
                placeholder={language === "vi" ? "Ví dụ: Chạy 5km liên tục" : "Example: Run 5km continuously"}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
              <textarea
                value={milestoneDrafts[goal.id]?.description || ""}
                onChange={(e) => setMilestoneDrafts((prev) => ({
                  ...prev,
                  [goal.id]: { title: prev[goal.id]?.title || "", description: e.target.value, targetDate: prev[goal.id]?.targetDate || "" },
                }))}
                placeholder={language === "vi" ? "Mô tả milestone" : "Milestone description"}
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={milestoneDrafts[goal.id]?.targetDate || ""}
                  onChange={(e) => setMilestoneDrafts((prev) => ({
                    ...prev,
                    [goal.id]: { title: prev[goal.id]?.title || "", description: prev[goal.id]?.description || "", targetDate: e.target.value },
                  }))}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => void handleAddMilestone(goal.id)}
                  className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-white transition-colors ${PERIODS[goal.period].input}`}
                >
                  <Plus size={14} />
                  {language === "vi" ? "Thêm" : "Add"}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
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
            {language === "vi" ? "Bảng tầm nhìn và mục tiêu" : "Vision Board & Goals"}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            {language === "vi" ? "La bàn định hướng và phân rã mục tiêu dài hạn" : "Compass for long-term goal breakdown"}
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1440px] flex-1 space-y-8 px-4 pb-12 pt-4 sm:space-y-10 sm:px-8">
        <HintBubble id="goals_intro" title={language === "vi" ? "Tầm nhìn & Mục tiêu" : "Vision & Goals"} color="violet" persistent={false}>
          {language === "vi"
            ? "Mục này giúp bạn nối tầm nhìn dài hạn với hành động cụ thể. Hãy bắt đầu từ điều bạn muốn đạt được, rồi chia nhỏ thành mục tiêu năm, tháng và tuần để dễ theo dõi hơn."
            : "Start with a big vision, then break it down into yearly, monthly, and weekly goals to step-by-step realize your dreams."}
        </HintBubble>

        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Target className="h-4 w-4 text-zinc-600 dark:text-slate-350" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-slate-100">
              {language === "vi" ? "Bảng Tầm Nhìn" : "Vision Board"}
            </h2>
          </div>
          <div className="mb-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-slate-400">
              {editingVisionId ? (language === "vi" ? "Sửa vision item" : "Edit vision item") : (language === "vi" ? "Thêm vision item" : "Add vision item")}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                type="text"
                value={visionDraft.title}
                onChange={(e) => setVisionDraft((prev) => ({ ...prev, title: e.target.value }))}
                placeholder={language === "vi" ? "Tiêu đề vision" : "Vision title"}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <select
                value={visionDraft.categoryId || defaultCategoryId}
                onChange={(e) => setVisionDraft((prev) => ({ ...prev, categoryId: e.target.value }))}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 transition-all focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                disabled={!categories.length}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <textarea
                value={visionDraft.description}
                onChange={(e) => setVisionDraft((prev) => ({ ...prev, description: e.target.value }))}
                rows={2}
                placeholder={language === "vi" ? "Mô tả ngắn" : "Short description"}
                className="sm:col-span-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => void handleVisionImageSelect(e.target.files?.[0] || null)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 transition-all file:mr-3 file:rounded-md file:border-0 file:bg-violet-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-violet-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:file:bg-violet-500/10 dark:file:text-violet-200"
                  disabled={visionUploading}
                />
                <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                  {visionUploading
                    ? (language === "vi" ? "Đang tải ảnh lên R2..." : "Uploading image to R2...")
                    : visionDraft.imageUrl
                    ? visionDraft.imageUrl
                    : (language === "vi" ? "Chưa có ảnh nào được chọn" : "No image selected")}
                </div>
              </div>
              <input
                type="text"
                value={visionDraft.quote}
                onChange={(e) => setVisionDraft((prev) => ({ ...prev, quote: e.target.value }))}
                placeholder={language === "vi" ? "Câu trích dẫn" : "Quote"}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => void saveVisionItem()}
                className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
              >
                <Plus size={14} />
                {editingVisionId ? (language === "vi" ? "Lưu" : "Save") : (language === "vi" ? "Thêm" : "Add")}
              </button>
              {editingVisionId ? (
                <button
                  type="button"
                  onClick={cancelEditVisionItem}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  {language === "vi" ? "Hủy" : "Cancel"}
                </button>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {visionItems.length ? visionItems.map((item) => {
              const iconKey = item.categoryName.trim().toLowerCase() as keyof typeof VISION_ICON_MAP;
              const iconConfig = VISION_ICON_MAP[iconKey] || VISION_ICON_MAP.default;
              const Icon = iconConfig.icon;
              const colorConfig = COLOR_MAP[item.categoryColor || "indigo"] || COLOR_MAP.indigo;
              return (
                <div key={item.id} className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`mb-3 mt-1 flex h-10 w-10 items-center justify-center rounded-lg ${iconConfig.bg} dark:bg-slate-850 border ${iconConfig.color.replace("text-", "border-").replace("500", "200")} dark:border-slate-800`}>
                      <Icon className={`h-5 w-5 ${iconConfig.color}`} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => beginEditVisionItem(item)}
                        className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                      >
                        {language === "vi" ? "Sửa" : "Edit"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteVisionItem(item.id)}
                        className="rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
                      >
                        {language === "vi" ? "Xóa" : "Delete"}
                      </button>
                    </div>
                  </div>
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="mb-3 h-32 w-full rounded-lg object-cover"
                    />
                  ) : null}
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${colorConfig.badge}`}>
                      {item.categoryName || (language === "vi" ? "Chưa chọn danh mục" : "No category")}
                    </span>
                  </div>
                  <h3 className="mb-1 text-sm font-semibold text-zinc-950 dark:text-slate-100">{item.title}</h3>
                  <p className="min-h-[40px] text-xs leading-relaxed text-zinc-500 dark:text-slate-400">{item.description || (language === "vi" ? "Chưa có mô tả" : "No description yet")}</p>
                  {item.quote ? <p className="mt-3 line-clamp-3 text-[11px] italic leading-relaxed text-zinc-400 dark:text-slate-500">“{item.quote}”</p> : null}
                </div>
              );
            }) : (
              <div className="col-span-full rounded-xl border border-dashed border-zinc-200 bg-white p-5 text-sm text-zinc-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                {language === "vi" ? "Chưa có vision item nào" : "No vision items yet"}
              </div>
            )}
          </div>
        </div>

        <div className="pb-8">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Calendar className="h-4 w-4 text-zinc-600 dark:text-slate-350" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-slate-100">
              {language === "vi" ? "Phân Rã Mục Tiêu" : "Goal Breakdown"}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {(Object.keys(PERIODS) as GoalPeriod[]).map((period) => {
              const config = PERIODS[period];
              const periodGoals = groupedGoals[period];

              return (
                <div key={period} className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="border-b border-zinc-200 bg-zinc-50/50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/55">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-zinc-950 dark:text-slate-100">
                          <span className={`h-2 w-2 rounded-full ${config.accent}`} />
                          {language === "vi" ? config.labelVi : config.labelEn}
                        </h3>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-slate-400">
                          {language === "vi" ? config.subVi : config.subEn}
                        </p>
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${config.pill}`}>{periodGoals.length}</span>
                    </div>
                  </div>

                  <div className="space-y-3 p-5">
                    {periodGoals.length ? periodGoals.map(renderGoalCard) : (
                      <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-sm text-zinc-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
                        {language === "vi" ? "Chưa có mục tiêu nào" : "No goals yet"}
                      </div>
                    )}

                    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-slate-400">
                        {language === "vi" ? "Nhập trực tiếp mục tiêu mới" : "Type a new goal"}
                      </label>
                      <div className="space-y-2">
                        <input
                          id={`goal-input-${period}`}
                          type="text"
                          value={draftGoals[period].title}
                          onChange={(e) => setDraftGoals((prev) => ({ ...prev, [period]: { ...prev[period], title: e.target.value } }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void handleAddGoal(period);
                            }
                          }}
                          placeholder={
                            period === "week"
                              ? (language === "vi" ? "Ví dụ: Hoàn thành 3 buổi tập trong tuần" : "Example: Finish 3 workouts this week")
                              : period === "month"
                              ? (language === "vi" ? "Ví dụ: Hoàn thành khóa học React trong tháng" : "Example: Finish React course this month")
                              : (language === "vi" ? "Ví dụ: Đạt chứng chỉ hoặc hoàn thành mục tiêu lớn trong năm" : "Example: Reach a major goal this year")
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                        />
                        <select
                          value={draftGoals[period].categoryId || defaultCategoryId}
                          onChange={(e) => setDraftGoals((prev) => ({ ...prev, [period]: { ...prev[period], categoryId: e.target.value } }))}
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          disabled={!categories.length}
                        >
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => void handleAddGoal(period)}
                          className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-white transition-colors hover:opacity-95 ${config.input}`}
                        >
                          <Plus size={14} />
                          {language === "vi" ? "Thêm" : "Add"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {renderUpgradeModal()}
    </div>
  );
}
