import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { aiPlannerAssistantApi, type PlannerDraftPlan, type PlannerDraftResponse } from "../../api";
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
  const [lastRequest, setLastRequest] = useState("");
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

  const sendRequest = async (value: string) => {
    const message = value.trim();
    if (!message || isGenerating) return;

    setInput("");
    setLastRequest(message);
    setIsGenerating(true);
    setApplied(false);
    setError(null);
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: message }]);

    try {
      const response = await aiPlannerAssistantApi.generate({ message });
      const normalized = normalizeDraftResponse(response);
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
      await aiPlannerAssistantApi.approve(draft.id, { plan: stripClientOnlyFields(draft.plan) });
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

  const regenerate = () => {
    if (lastRequest) {
      void sendRequest(lastRequest);
    }
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
            canRegenerate={!!lastRequest}
            onApply={() => void applyPlan()}
            onRegenerate={regenerate}
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
    plan: {
      ...response.plan,
      events: response.plan.events || [],
      tasks: response.plan.tasks || [],
      habits: response.plan.habits || [],
    },
  };
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
