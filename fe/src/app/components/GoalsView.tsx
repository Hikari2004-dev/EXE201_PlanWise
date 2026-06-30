import { useMemo, useState } from "react";
import { aiGoalPlannerApi } from "../api";
import type { GoalDraftResponse, GoalMilestoneDraft, GoalRoadmapDraft, GoalTaskDraft } from "../api";
import {
  Plus,
  Target,
  Calendar,
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

export function GoalsView() {
  const { categories, goals, tasks, addGoal, updateGoal, addMilestone, updateMilestone, deleteMilestone, language, refreshData } = useData();
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
  const [aiDraft, setAiDraft] = useState<AIGoalDraft>(EMPTY_AI_DRAFT);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiApproving, setAiApproving] = useState(false);
  const [aiDraftResult, setAiDraftResult] = useState<GoalDraftResponse | null>(null);
  const [aiRoadmap, setAiRoadmap] = useState<GoalRoadmapDraft | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

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
      setAiError(language === "vi" ? "Không thể tạo bản nháp AI. Vui lòng thử lại." : "Could not generate the AI draft. Please try again.");
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
      setAiError(language === "vi" ? "Không thể tạo mục tiêu từ bản nháp." : "Could not create the goal from this draft.");
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
