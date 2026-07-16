import { useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "../ui/utils";
import { useData } from "../../context/DataContext";
import { PlannerAssistantModal } from "./PlannerAssistantModal";

interface PlannerAssistantButtonProps {
  className?: string;
}

export function PlannerAssistantButton({ className }: PlannerAssistantButtonProps) {
  const { language } = useData();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200 dark:hover:bg-indigo-500/20 sm:px-3.5",
          className,
        )}
      >
        <Sparkles size={15} />
        <span className="hidden sm:inline">{language === "vi" ? "AI Assistant" : "AI Assistant"}</span>
        <span className="sm:hidden">AI</span>
      </button>
      <PlannerAssistantModal open={open} onOpenChange={setOpen} />
    </>
  );
}
