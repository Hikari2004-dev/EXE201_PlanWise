import { CalendarDays, CheckSquare, Repeat2, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import type { PlannerEventDraft, PlannerHabitDraft, PlannerTaskDraft } from "../../api";

type PreviewCardProps =
  | {
      kind: "event";
      item: PlannerEventDraft;
      language: "vi" | "en";
      disabled?: boolean;
      onChange: (item: PlannerEventDraft) => void;
      onDelete: () => void;
    }
  | {
      kind: "task";
      item: PlannerTaskDraft;
      language: "vi" | "en";
      disabled?: boolean;
      onChange: (item: PlannerTaskDraft) => void;
      onDelete: () => void;
    }
  | {
      kind: "habit";
      item: PlannerHabitDraft;
      language: "vi" | "en";
      disabled?: boolean;
      onChange: (item: PlannerHabitDraft) => void;
      onDelete: () => void;
    };

const WEEK_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export function PreviewCard(props: PreviewCardProps) {
  if (props.kind === "event") {
    return (
      <EditableShell
        icon={<CalendarDays size={16} />}
        tone="blue"
        label={props.language === "vi" ? "Sự kiện" : "Event"}
        disabled={props.disabled}
        onDelete={props.onDelete}
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Field label={props.language === "vi" ? "Tiêu đề" : "Title"} className="text-semibold sm:col-span-2">
            <TextInput
              disabled={props.disabled}
              value={props.item.title || ""}
              onChange={(value) => props.onChange({ ...props.item, title: value })}
            />
          </Field>
          <Field label={props.language === "vi" ? "Ngày" : "Date"}>
            <TextInput
              type="date"
              disabled={props.disabled}
              value={props.item.eventDate || ""}
              onChange={(value) => props.onChange({ ...props.item, eventDate: value })}
            />
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label={props.language === "vi" ? "Giờ" : "Hour"}>
              <NumberInput
                disabled={props.disabled}
                min={0}
                max={23}
                value={props.item.startHour ?? 9}
                onChange={(value) => props.onChange({ ...props.item, startHour: value })}
              />
            </Field>
            <Field label={props.language === "vi" ? "Phút" : "Min"}>
              <NumberInput
                disabled={props.disabled}
                min={0}
                max={59}
                value={props.item.startMin ?? 0}
                onChange={(value) => props.onChange({ ...props.item, startMin: value })}
              />
            </Field>
            <Field label={props.language === "vi" ? "Giờ dài" : "Hours"}>
              <NumberInput
                disabled={props.disabled}
                min={0.25}
                step={0.25}
                value={props.item.duration ?? 1}
                onChange={(value) => props.onChange({ ...props.item, duration: value })}
              />
            </Field>
          </div>
          <Field label={props.language === "vi" ? "Địa điểm" : "Location"}>
            <TextInput
              disabled={props.disabled}
              value={props.item.location || ""}
              onChange={(value) => props.onChange({ ...props.item, location: value })}
            />
          </Field>
          <Field label={props.language === "vi" ? "Ghi chú" : "Notes"} className="sm:col-span-2">
            <TextAreaInput
              disabled={props.disabled}
              value={props.item.notes || ""}
              onChange={(value) => props.onChange({ ...props.item, notes: value })}
            />
          </Field>
        </div>
      </EditableShell>
    );
  }

  if (props.kind === "task") {
    return (
      <EditableShell
        icon={<CheckSquare size={16} />}
        tone="emerald"
        label={props.language === "vi" ? "Công việc" : "Task"}
        disabled={props.disabled}
        onDelete={props.onDelete}
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Field label={props.language === "vi" ? "Tiêu đề" : "Title"} className="sm:col-span-2">
            <TextInput
              disabled={props.disabled}
              value={props.item.title || ""}
              onChange={(value) => props.onChange({ ...props.item, title: value })}
            />
          </Field>
          <Field label={props.language === "vi" ? "Mô tả" : "Description"} className="sm:col-span-2">
            <TextAreaInput
              disabled={props.disabled}
              value={props.item.description || ""}
              onChange={(value) => props.onChange({ ...props.item, description: value })}
            />
          </Field>
          <Field label={props.language === "vi" ? "Hạn" : "Due"}>
            <TextInput
              type="datetime-local"
              disabled={props.disabled}
              value={toDateTimeLocal(props.item.dueDate)}
              onChange={(value) => props.onChange({ ...props.item, dueDate: fromDateTimeLocal(value) })}
            />
          </Field>
          <Field label={props.language === "vi" ? "Lên lịch" : "Scheduled"}>
            <TextInput
              type="datetime-local"
              disabled={props.disabled}
              value={toDateTimeLocal(props.item.scheduledAt)}
              onChange={(value) => props.onChange({ ...props.item, scheduledAt: fromDateTimeLocal(value) })}
            />
          </Field>
          <Field label={props.language === "vi" ? "Ưu tiên" : "Priority"}>
            <SelectInput
              disabled={props.disabled}
              value={(props.item.priority || "MEDIUM").toUpperCase()}
              options={["HIGH", "MEDIUM", "LOW"]}
              onChange={(value) => props.onChange({ ...props.item, priority: value })}
            />
          </Field>
          <Field label={props.language === "vi" ? "Phút" : "Minutes"}>
            <NumberInput
              disabled={props.disabled}
              min={1}
              value={props.item.estimatedTime ?? 30}
              onChange={(value) => props.onChange({ ...props.item, estimatedTime: value })}
            />
          </Field>
          <Field label="Checklist" className="sm:col-span-2">
            <TextAreaInput
              disabled={props.disabled}
              value={(props.item.checklist || []).join("\n")}
              onChange={(value) => props.onChange({ ...props.item, checklist: splitLines(value) })}
              placeholder={props.language === "vi" ? "Mỗi dòng là một mục" : "One item per line"}
            />
          </Field>
        </div>
      </EditableShell>
    );
  }

  return (
    <EditableShell
      icon={<Repeat2 size={16} />}
      tone="amber"
      label={props.language === "vi" ? "Thói quen" : "Habit"}
      disabled={props.disabled}
      onDelete={props.onDelete}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Field label={props.language === "vi" ? "Tiêu đề" : "Title"} className="sm:col-span-2">
          <TextInput
            disabled={props.disabled}
            value={props.item.title || ""}
            onChange={(value) => props.onChange({ ...props.item, title: value })}
          />
        </Field>
        <Field label={props.language === "vi" ? "Mô tả" : "Description"} className="sm:col-span-2">
          <TextAreaInput
            disabled={props.disabled}
            value={props.item.description || ""}
            onChange={(value) => props.onChange({ ...props.item, description: value })}
          />
        </Field>
        <Field label={props.language === "vi" ? "Tần suất" : "Frequency"}>
          <SelectInput
            disabled={props.disabled}
            value={props.item.frequency || "daily"}
            options={["daily", "weekly", "monthly"]}
            onChange={(value) => props.onChange({
              ...props.item,
              frequency: value as PlannerHabitDraft["frequency"],
              repeatDays: value === "weekly" ? props.item.repeatDays || ["MON"] : [],
            })}
          />
        </Field>
        <Field label={props.language === "vi" ? "Mục tiêu" : "Target"}>
          <NumberInput
            disabled={props.disabled}
            min={1}
            value={props.item.targetCount ?? 1}
            onChange={(value) => props.onChange({ ...props.item, targetCount: value })}
          />
        </Field>
        {props.item.frequency === "weekly" && (
          <Field label={props.language === "vi" ? "Ngày lặp" : "Repeat days"} className="sm:col-span-2">
            <div className="flex flex-wrap gap-1.5">
              {WEEK_DAYS.map((day) => {
                const active = (props.item.repeatDays || []).includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={props.disabled}
                    onClick={() => {
                      const current = props.item.repeatDays || [];
                      const next = active ? current.filter((item) => item !== day) : [...current, day];
                      props.onChange({ ...props.item, repeatDays: next.length ? next : [day] });
                    }}
                    className={`rounded-md border px-2 py-1 text-xs font-bold transition disabled:opacity-60 ${
                      active
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </Field>
        )}
      </div>
    </EditableShell>
  );
}

function EditableShell({
  icon,
  tone,
  label,
  disabled,
  onDelete,
  children,
}: {
  icon: ReactNode;
  tone: "blue" | "emerald" | "amber";
  label: string;
  disabled?: boolean;
  onDelete: () => void;
  children: ReactNode;
}) {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-200",
  };

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${toneClasses[tone]}`}>
            {icon}
          </span>
          <span className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-slate-400">{label}</span>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={onDelete}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
      {children}
    </article>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={`block space-y-1 ${className || ""}`}>
      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  disabled,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-500/50 dark:focus:ring-indigo-500/15 dark:disabled:bg-slate-900/50"
    />
  );
}

function TextAreaInput({
  value,
  onChange,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      rows={2}
      onChange={(event) => onChange(event.target.value)}
      className="w-full resize-none rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-500/50 dark:focus:ring-indigo-500/15 dark:disabled:bg-slate-900/50"
    />
  );
}

function SelectInput({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-500/50 dark:focus:ring-indigo-500/15"
    >
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  );
}

function NumberInput({
  value,
  onChange,
  disabled,
  min,
  max,
  step = 1,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? value : 0}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onChange={(event) => onChange(Number(event.target.value))}
      className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-500/50 dark:focus:ring-indigo-500/15"
    />
  );
}

function splitLines(value: string) {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function toDateTimeLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function fromDateTimeLocal(value: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  const [datePart, timePart = "00:00"] = value.split("T");
  const normalizedTime = timePart.length === 5 ? `${timePart}:00` : timePart;
  return `${datePart}T${normalizedTime}${formatLocalOffset(date)}`;
}

function formatLocalOffset(date: Date) {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absolute = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, "0");
  const minutes = String(absolute % 60).padStart(2, "0");
  return `${sign}${hours}:${minutes}`;
}
