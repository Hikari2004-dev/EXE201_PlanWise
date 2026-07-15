import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  aiPlannerAssistantApi,
  type PlannerDraftPlan,
  type PlannerDraftResponse,
  type PlannerEventDraft,
  type PlannerHabitDraft,
  type PlannerTaskDraft,
} from "../../api";
import { useData } from "../../context/DataContext";
import { ConversationPanel, type ConversationMessage } from "./ConversationPanel";
import { PreviewPanel } from "./PreviewPanel";

interface PlannerAssistantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const loadingSteps = {
  vi: ["Đang hiểu yêu cầu...", "Đang kiểm tra lịch...", "Đang dựng kế hoạch..."],
  en: ["Understanding request...", "Checking calendar...", "Building plan..."],
};

export function PlannerAssistantModal({ open, onOpenChange }: PlannerAssistantModalProps) {
  const { language, refreshData } = useData();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState("");
  const [draft, setDraft] = useState<PlannerDraftResponse | null>(null);
  const draftPlanRef = useRef<PlannerDraftPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setStepIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setStepIndex((current) => (current + 1) % loadingSteps[language].length);
    }, 1100);
    return () => window.clearInterval(interval);
  }, [isGenerating, language]);

  const loadingText = loadingSteps[language][stepIndex];
  const plan = draft?.plan || null;

  useEffect(() => {
    draftPlanRef.current = plan;
  }, [plan]);

  const sendRequest = async (value: string) => {
    const message = value.trim();
    if (!message || isGenerating) return;

    setInput("");
    setIsGenerating(true);
    setApplied(false);
    setError(null);
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: message }]);

    try {
      const response = await aiPlannerAssistantApi.generate({ message });
      const normalized = normalizeDraftResponse(response);
      draftPlanRef.current = normalized.plan;
      setDraft(normalized);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: buildAssistantSummary(normalized.plan, language),
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : language === "vi" ? "Không thể tạo kế hoạch." : "Could not build plan.";
      setError(message);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: language === "vi" ? "Mình chưa tạo được bản nháp. Hãy thử mô tả hẹp hơn một chút." : "I could not create a draft yet. Try narrowing the request a bit.",
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyPlan = async () => {
    if (!draft || isApplying) return;
    setIsApplying(true);
    setError(null);
    try {
      const editedPlan = normalizePlan(draftPlanRef.current || draft.plan);
      await aiPlannerAssistantApi.approve(draft.id, { plan: stripClientOnlyFields(editedPlan) });
      await refreshData();
      setApplied(true);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: language === "vi" ? "Kế hoạch đã được áp dụng vào PlanWise." : "The plan has been applied to PlanWise.",
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : language === "vi" ? "Không thể áp dụng kế hoạch." : "Could not apply plan.");
    } finally {
      setIsApplying(false);
    }
  };

  const updateEventItem = (index: number, item: PlannerEventDraft) => updateDraftPlan((plan) => ({
    ...plan,
    events: replaceAt(plan.events || [], index, item),
  }));

  const updateTaskItem = (index: number, item: PlannerTaskDraft) => updateDraftPlan((plan) => ({
    ...plan,
    tasks: replaceAt(plan.tasks || [], index, item),
  }));

  const updateHabitItem = (index: number, item: PlannerHabitDraft) => updateDraftPlan((plan) => ({
    ...plan,
    habits: replaceAt(plan.habits || [], index, item),
  }));

  const deletePlanItem = (kind: "events" | "tasks" | "habits", index: number) => {
    updateDraftPlan((plan) => ({
      ...plan,
      [kind]: (plan[kind] || []).filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const updateDraftPlan = (updater: (plan: PlannerDraftPlan) => PlannerDraftPlan) => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        plan: (() => {
          const nextPlan = normalizePlan(updater(current.plan));
          draftPlanRef.current = nextPlan;
          return nextPlan;
        })(),
      };
    });
    setApplied(false);
  };

  const description = useMemo(
    () => language === "vi"
      ? "Planner Assistant tạo bản nháp kế hoạch để bạn kiểm tra trước khi áp dụng."
      : "Planner Assistant creates a draft plan for review before applying it.",
    [language],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(860px,calc(100vh-2rem))] max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl">
        <DialogHeader className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <DialogTitle className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
            Planner Assistant
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(280px,0.86fr)_minmax(0,1.14fr)] lg:overflow-hidden">
          <ConversationPanel
            language={language}
            messages={messages}
            input={input}
            isLoading={isGenerating}
            loadingText={loadingText}
            onInputChange={setInput}
            onSend={(value) => void sendRequest(value)}
          />
          <PreviewPanel
            plan={plan}
            language={language}
            isLoading={isGenerating}
            loadingText={loadingText}
            error={error}
            isApplying={isApplying}
            applied={applied}
            onUpdateEvent={updateEventItem}
            onUpdateTask={updateTaskItem}
            onUpdateHabit={updateHabitItem}
            onDeleteItem={deletePlanItem}
            onApply={() => void applyPlan()}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function normalizeDraftResponse(response: PlannerDraftResponse): PlannerDraftResponse {
  return {
    ...response,
    plan: normalizePlan(response.plan),
  };
}

function normalizePlan(plan: PlannerDraftPlan): PlannerDraftPlan {
  return {
    ...plan,
    events: plan.events || [],
    tasks: plan.tasks || [],
    habits: plan.habits || [],
  };
}

function replaceAt<T>(items: T[], index: number, item: T) {
  return items.map((current, itemIndex) => itemIndex === index ? item : current);
}

function buildAssistantSummary(plan: PlannerDraftPlan, language: "vi" | "en") {
  const eventCount = plan.events?.length || 0;
  const taskCount = plan.tasks?.length || 0;
  const habitCount = plan.habits?.length || 0;
  if (language === "vi") {
    return `Mình đã dựng bản nháp gồm ${eventCount} sự kiện, ${taskCount} công việc và ${habitCount} thói quen.`;
  }
  return `I built a draft with ${eventCount} events, ${taskCount} tasks, and ${habitCount} habits.`;
}

function stripClientOnlyFields(plan: PlannerDraftPlan): PlannerDraftPlan {
  return {
    summary: plan.summary,
    events: plan.events || [],
    tasks: plan.tasks || [],
    habits: plan.habits || [],
  };
}
