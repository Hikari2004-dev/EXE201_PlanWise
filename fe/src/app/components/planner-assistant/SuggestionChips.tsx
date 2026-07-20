import { Sparkles } from "lucide-react";

const SUGGESTIONS = [
  { en: "Plan my day", vi: "Lên kế hoạch hôm nay" },
  { en: "Plan this week", vi: "Lên kế hoạch tuần này" },
  { en: "Schedule my tasks", vi: "Sắp lịch cho task" },
  { en: "Build a study routine", vi: "Tạo routine học tập" },
  { en: "Reschedule overdue tasks", vi: "Xếp lại task trễ hạn" },
];

interface SuggestionChipsProps {
  language: "vi" | "en";
  onSelect: (value: string) => void;
  disabled?: boolean;
}

export function SuggestionChips({ language, onSelect, disabled }: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SUGGESTIONS.map((suggestion) => {
        const label = language === "vi" ? suggestion.vi : suggestion.en;
        return (
          <button
            key={suggestion.en}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(label)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-wait disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-200"
          >
            <Sparkles size={13} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
