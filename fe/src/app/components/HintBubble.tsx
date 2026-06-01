/**
 * HintBubble — dismissable onboarding hint card
 *
 * Props:
 *   id       – unique key stored in localStorage so it stays dismissed
 *   title    – short headline
 *   children – explanation text / JSX
 *   color    – "indigo" | "emerald" | "amber" | "violet" | "rose" | "blue"
 *   icon     – lucide icon element (optional)
 */
import { useState, useEffect } from "react";
import { X, Lightbulb } from "lucide-react";

const PALETTE = {
  indigo: {
    wrap:   "bg-indigo-50 border-indigo-200",
    icon:   "bg-indigo-100 text-indigo-600",
    title:  "text-indigo-800",
    body:   "text-indigo-700",
    close:  "text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100",
    dot:    "bg-indigo-400",
  },
  emerald: {
    wrap:   "bg-emerald-50 border-emerald-200",
    icon:   "bg-emerald-100 text-emerald-600",
    title:  "text-emerald-800",
    body:   "text-emerald-700",
    close:  "text-emerald-400 hover:text-emerald-700 hover:bg-emerald-100",
    dot:    "bg-emerald-400",
  },
  amber: {
    wrap:   "bg-amber-50 border-amber-200",
    icon:   "bg-amber-100 text-amber-600",
    title:  "text-amber-800",
    body:   "text-amber-700",
    close:  "text-amber-400 hover:text-amber-700 hover:bg-amber-100",
    dot:    "bg-amber-400",
  },
  violet: {
    wrap:   "bg-violet-50 border-violet-200",
    icon:   "bg-violet-100 text-violet-600",
    title:  "text-violet-800",
    body:   "text-violet-700",
    close:  "text-violet-400 hover:text-violet-700 hover:bg-violet-100",
    dot:    "bg-violet-400",
  },
  rose: {
    wrap:   "bg-rose-50 border-rose-200",
    icon:   "bg-rose-100 text-rose-600",
    title:  "text-rose-800",
    body:   "text-rose-700",
    close:  "text-rose-400 hover:text-rose-700 hover:bg-rose-100",
    dot:    "bg-rose-400",
  },
  blue: {
    wrap:   "bg-blue-50 border-blue-200",
    icon:   "bg-blue-100 text-blue-600",
    title:  "text-blue-800",
    body:   "text-blue-700",
    close:  "text-blue-400 hover:text-blue-700 hover:bg-blue-100",
    dot:    "bg-blue-400",
  },
} as const;

type Color = keyof typeof PALETTE;

interface HintBubbleProps {
  id: string;
  title: string;
  children: React.ReactNode;
  color?: Color;
  icon?: React.ReactNode;
  className?: string;
  persistent?: boolean;
}

const LS_KEY = "planwise_hints_dismissed";

function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveDismissed(set: Set<string>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...set]));
  } catch {}
}

export function HintBubble({
  id,
  title,
  children,
  color = "indigo",
  icon,
  className = "",
  persistent = true,
}: HintBubbleProps) {
  const [visible, setVisible] = useState(false);

  /* check localStorage after mount (avoids SSR mismatch) */
  useEffect(() => {
    if (!persistent) {
      setVisible(true);
      return;
    }
    setVisible(!getDismissed().has(id));
  }, [id, persistent]);

  const dismiss = () => {
    if (persistent) {
      const dismissed = getDismissed();
      dismissed.add(id);
      saveDismissed(dismissed);
    }
    setVisible(false);
  };

  if (!visible) return null;

  const p = PALETTE[color];

  return (
    <div
      className={`
        flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm
        animate-in fade-in slide-in-from-top-1 duration-300
        ${p.wrap} ${className}
      `}
    >
      {/* Icon */}
      <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5 ${p.icon}`}>
        {icon ?? <Lightbulb size={14} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${p.title}`}>{title}</p>
        <div className={`text-[12.5px] leading-relaxed ${p.body}`}>{children}</div>
      </div>

      {/* Dismiss button */}
      <button
        onClick={dismiss}
        className={`flex-shrink-0 p-1 rounded-lg transition-colors ${p.close}`}
        title="Đóng gợi ý này"
        aria-label="Dismiss hint"
      >
        <X size={13} />
      </button>
    </div>
  );
}
