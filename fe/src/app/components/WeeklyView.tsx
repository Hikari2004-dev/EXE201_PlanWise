import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, X, Edit2, Trash2, Brain, CalendarDays, ExternalLink } from "lucide-react";
import { useData } from "../context/DataContext";
import { HintBubble } from "./HintBubble";
import { PlannerAssistantButton } from "./planner-assistant";
import { CalendarIntegrationToolbar } from "./calendar/CalendarIntegrationToolbar";
import {
  DAYS,
  DAYS_VI,
  COLOR_MAP,
  getTimeString,
  type CalendarEvent,
  type EventColor,
} from "../data/mockData";

const START_HOUR = 0;
const END_HOUR = 24;
const HOUR_HEIGHT = 72;
const DEFAULT_START_HOUR = 8;
const WEEK_HEADERS_VI = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const WEEKDAY_TO_INDEX: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, daysToAdd: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + daysToAdd);
  return next;
}

function formatIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isSameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function parseIsoDate(value?: string): Date | null {
  if (!value) return null;
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function parseUiDueDate(value?: string): Date | null {
  if (!value) return null;
  const trimmed = value.trim();

  const isoDate = parseIsoDate(trimmed);
  if (isoDate) return isoDate;

  const viMatch = trimmed.match(/^(\d{1,2})\s*Th(\d{1,2})$/i);
  if (viMatch) {
    const date = new Date(new Date().getFullYear(), Number(viMatch[2]) - 1, Number(viMatch[1]));
    date.setHours(0, 0, 0, 0);
    return date;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatWeekRange(weekStart: Date, language: string) {
  const weekEnd = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();

  if (language === "vi") {
    if (sameMonth) {
      return `${weekStart.getDate()} – ${weekEnd.getDate()} tháng ${weekStart.getMonth() + 1}, ${weekStart.getFullYear()}`;
    }
    return `${weekStart.getDate()} tháng ${weekStart.getMonth() + 1} – ${weekEnd.getDate()} tháng ${weekEnd.getMonth() + 1}, ${weekEnd.getFullYear()}`;
  }

  const startLabel = weekStart.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const endLabel = weekEnd.toLocaleDateString("en-US", { month: sameMonth ? undefined : "long", day: "numeric", year: "numeric" });
  return `${startLabel} – ${endLabel}`;
}

function formatMonthLabel(date: Date, language: string) {
  return date.toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatHourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function formatTimeValue(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

type WeeklyCalendarItem = CalendarEvent & {
  eventDate?: string;
  kind?: "event" | "task";
};

type CalendarEventDraft = (Omit<CalendarEvent, "id"> | CalendarEvent) & { eventDate?: string };

function doesItemOccurOnDate(item: WeeklyCalendarItem, date: Date, weekDates: Date[]) {
  const itemDate = item.eventDate ? parseIsoDate(item.eventDate) : null;
  if (itemDate) {
    if (item.allDay) {
      const durationDays = Math.max(1, Math.ceil(item.duration / 24));
      const lastDate = addDays(itemDate, durationDays - 1);
      if (date >= itemDate && date <= lastDate) return true;
    }
    if (isSameDate(itemDate, date)) return true;

    if (item.isRecurring && item.recurrenceRule === "WEEKLY") {
      const dayDiff = Math.floor((date.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
      return dayDiff >= 7 && dayDiff % 7 === 0 && date.getDay() === itemDate.getDay();
    }

    return false;
  }

  const itemIndex = WEEKDAY_TO_INDEX[item.day] ?? -1;
  if (itemIndex < 0) return false;
  return isSameDate(weekDates[itemIndex], date);
}

interface EventCardProps {
  event: WeeklyCalendarItem;
  visibleStartHour: number;
  onClick: (event: CalendarEvent) => void;
}

function EventCard({ event, visibleStartHour, onClick }: EventCardProps) {
  const colors = COLOR_MAP[event.color as EventColor];
  const topPx = (event.startHour - visibleStartHour + event.startMin / 60) * HOUR_HEIGHT + 2;
  const heightPx = event.allDay ? 28 : Math.max(22, event.duration * HOUR_HEIGHT - 4);
  const showLocation = heightPx > 52;
  const showTime = heightPx > 30;
  const isTaskItem = event.kind === "task";
  const isExternal = event.readOnly || event.source === "GOOGLE";

  return (
    <div
      draggable={!isTaskItem && !isExternal}
      onDragStart={(e) => {
        if (isTaskItem || isExternal) return;
        e.dataTransfer.setData("eventId", event.id.toString());
      }}
      onClick={() => {
        if (isTaskItem) return;
        onClick(event);
      }}
      title={`${event.title} - ${isExternal ? event.calendarName || "Google Calendar" : `${event.startHour}:${String(event.startMin).padStart(2, "0")}`}`}
      className={`absolute inset-x-0.5 rounded-md px-2 py-1 cursor-pointer overflow-hidden border-l-[3px] ${colors.light} ${colors.border} hover:brightness-95 active:scale-[0.99] transition-all duration-100 shadow-sm hover:shadow ${isExternal ? "ring-1 ring-blue-200 dark:ring-blue-500/40" : ""}`}
      style={{ top: `${topPx}px`, height: `${heightPx}px`, minHeight: "22px" }}
    >
      <div className="flex min-w-0 items-center gap-1">
        {isExternal && <span className="shrink-0 rounded bg-blue-600 px-1 text-[8px] font-bold leading-4 text-white">G</span>}
        <p className={`min-w-0 truncate text-[11px] font-semibold leading-tight ${colors.text}`}>{event.title}</p>
      </div>
      {showTime && !event.allDay && (
        <p className={`text-[10px] leading-tight mt-0.5 opacity-70 truncate ${colors.text}`}>
          {event.startHour}:{String(event.startMin).padStart(2, "0")}
        </p>
      )}
      {showLocation && event.location && (
        <p className={`text-[10px] leading-tight opacity-60 truncate flex items-center gap-0.5 ${colors.text}`}>
          <MapPin size={7} className="flex-shrink-0" />
          {event.location}
        </p>
      )}
    </div>
  );
}

interface EventModalProps {
  event?: CalendarEventDraft;
  weekDates: Date[];
  onClose: () => void;
  onSave: (event: CalendarEventDraft) => void;
  onDelete?: (id: string) => void;
}

function EventModal({ event, weekDates, onClose, onSave, onDelete }: EventModalProps) {
  const { categories, addCategory } = useData();
  const isReadOnly = Boolean(event?.readOnly || event?.source === "GOOGLE");
  const resolvedCategoryId = isReadOnly ? "" : event?.categoryId || categories[0]?.id || "";
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: "", color: "indigo" as EventColor });
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const initialStartHour = event?.startHour ?? 9;
  const initialStartMin = event?.startMin ?? 0;
  const initialDurationMinutes = Math.max(30, Math.round((event?.duration ?? 1) * 60));
  const initialStartTotalMinutes = initialStartHour * 60 + initialStartMin;
  const initialEndTotalMinutes = Math.min(23 * 60 + 59, initialStartTotalMinutes + initialDurationMinutes);

  const [form, setForm] = useState({
    title: event?.title || "",
    day: event?.day || "Mon",
    startTime: formatTimeValue(initialStartHour, initialStartMin),
    endTime: formatTimeValue(Math.floor(initialEndTotalMinutes / 60), initialEndTotalMinutes % 60),
    location: event?.location || "",
    notes: event?.notes || "",
    color: (event?.color || "indigo") as EventColor,
    categoryId: resolvedCategoryId,
    isRecurring: event?.isRecurring || false,
    eventDate: event?.eventDate,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!form.title.trim()) return;

    const dayIndex = WEEKDAY_TO_INDEX[form.day] ?? 0;
    const selectedDate = weekDates[dayIndex] ?? weekDates[0] ?? new Date();
    const eventDate = form.eventDate || formatIsoDate(selectedDate);

    const [startHourString, startMinString] = form.startTime.split(":");
    const [endHourString, endMinString] = form.endTime.split(":");
    const startHour = Number(startHourString);
    const startMin = Number(startMinString);
    const endHour = Number(endHourString);
    const endMin = Number(endMinString);
    const startTotalMinutes = startHour * 60 + startMin;
    const endTotalMinutes = endHour * 60 + endMin;
    const durationMinutes = endTotalMinutes > startTotalMinutes ? endTotalMinutes - startTotalMinutes : 60;

    const eventData = {
      title: form.title,
      day: form.day,
      eventDate,
      startHour,
      startMin,
      duration: durationMinutes / 60,
      color: form.color,
      location: form.location || "Chưa có",
      notes: form.notes,
      categoryId: form.categoryId || categories[0]?.id || "",
      isRecurring: form.isRecurring,
      recurrenceRule: form.isRecurring ? "WEEKLY" : undefined,
    };

    if (event) {
      onSave({ ...event, ...eventData });
    } else {
      onSave(eventData);
    }
    onClose();
  };

  const handleCreateCategory = async () => {
    if (!categoryForm.name.trim() || isCreatingCategory) return;

    try {
      setCategoryError(null);
      setIsCreatingCategory(true);
      const createdCategory = await addCategory({ name: categoryForm.name.trim(), color: categoryForm.color });
      setCategoryForm({ name: "", color: "indigo" });
      setShowCategoryPopup(false);
      setForm((prev) => ({
        ...prev,
        categoryId: createdCategory.id,
        color: createdCategory.color as EventColor,
      }));
    } catch (error) {
      setCategoryError(error instanceof Error ? error.message : "Không thể tạo danh mục");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const selectedCategory = isReadOnly
    ? undefined
    : categories.find((c) => c.id === (form.categoryId || categories[0]?.id || ""));
  const colors = selectedCategory ? COLOR_MAP[selectedCategory.color as EventColor] : COLOR_MAP[form.color];

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-[384px] flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl duration-150 animate-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className={`${colors.light} px-5 py-4 border-b border-black/5 dark:border-white/5`}>
          <div className="flex items-start justify-between">
            <h3 className={`${colors.text} leading-tight font-bold text-base`}>{isReadOnly ? "Chi tiết sự kiện" : event ? "Chỉnh sửa sự kiện" : "Thêm sự kiện mới"}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-black/5 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
          {isReadOnly && (
            <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
              <CalendarDays size={14} />
              <span className="min-w-0 flex-1 truncate">{event?.calendarName || "Google Calendar"}</span>
              {event?.externalHtmlLink && (
                <a href={event.externalHtmlLink} target="_blank" rel="noreferrer" className="rounded p-1 hover:bg-blue-100 dark:hover:bg-blue-500/20" title="Open in Google Calendar">
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          )}
          <div>
            <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block font-medium">Tiêu đề *</label>
            <input
              type="text"
              required
              value={form.title}
              disabled={isReadOnly}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="VD: Họp nhóm"
              className="w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block font-medium">Ngày</label>
              <select
                value={form.day}
                disabled={isReadOnly}
                onChange={(e) => {
                  const nextDay = e.target.value;
                  const nextDayIndex = WEEKDAY_TO_INDEX[nextDay] ?? 0;
                  const nextDate = weekDates[nextDayIndex] ?? weekDates[0] ?? new Date();
                  setForm({ ...form, day: nextDay, eventDate: formatIsoDate(nextDate) });
                }}
                className="w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all cursor-pointer"
              >
                {DAYS.map((d, i) => (
                  <option key={d} value={d} className="dark:bg-slate-900">
                    {DAYS_VI[i]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block font-medium">Danh mục</label>
              <select
                value={form.categoryId || categories[0]?.id || ""}
                disabled={isReadOnly}
                onChange={(e) => {
                  const catId = e.target.value;
                  if (catId === "__other__") {
                    setCategoryError(null);
                    setShowCategoryPopup(true);
                    return;
                  }
                  const cat = categories.find((c) => c.id === catId);
                  setForm({ ...form, categoryId: catId, color: ((cat?.color as EventColor) || form.color) as EventColor });
                }}
                className="w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all cursor-pointer"
              >
                {categories.length === 0 && <option value="">Đang tải danh mục...</option>}
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="dark:bg-slate-900">
                    {cat.name}
                  </option>
                ))}
                <option value="__other__" className="dark:bg-slate-900">Khác</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block font-medium">Thời gian bắt đầu</label>
              <input
                type="time"
                step={1800}
                value={form.startTime}
                disabled={isReadOnly}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block font-medium">Thời gian kết thúc</label>
              <input
                type="time"
                step={1800}
                value={form.endTime}
                disabled={isReadOnly}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block font-medium">Địa điểm</label>
            <input type="text" value={form.location} disabled={isReadOnly} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Phòng họp A" className="w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all" />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block font-medium">Ghi chú</label>
            <textarea value={form.notes} disabled={isReadOnly} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Thêm ghi chú..." rows={2} className="w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none transition-all" />
          </div>
          <label className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
            <input
              type="checkbox"
              checked={form.isRecurring}
              disabled={isReadOnly}
              onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-slate-200">Lặp hàng tuần</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">Sự kiện sẽ lặp lại mỗi tuần vào cùng thứ và giờ</p>
            </div>
          </label>
          <div className="flex gap-2 pt-1">
            {!isReadOnly && event && "id" in event && onDelete && (
              <button type="button" onClick={() => {
                onDelete(event.id);
                onClose();
              }} className="px-3 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-sm py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors">
                <Trash2 size={14} />
              </button>
            )}
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-350 text-sm py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">{isReadOnly ? "Đóng" : "Hủy"}</button>
            {!isReadOnly && <button type="submit" className="flex-1 bg-zinc-900 dark:bg-indigo-600 hover:bg-zinc-800 dark:hover:bg-indigo-700 text-white text-sm py-2 rounded-xl transition-colors">Lưu</button>}
          </div>
        </form>
      </div>
      {showCategoryPopup && !isReadOnly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => {
          setCategoryError(null);
          setShowCategoryPopup(false);
          setCategoryForm({ name: "", color: "indigo" });
        }}>
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-semibold text-zinc-900 dark:text-slate-100">Tạo danh mục mới</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-slate-400">Danh mục này sẽ thuộc tài khoản hiện tại của bạn.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCategoryError(null);
                  setShowCategoryPopup(false);
                  setCategoryForm({ name: "", color: "indigo" });
                }}
                className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-slate-300">Tên danh mục</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => {
                    setCategoryError(null);
                    setCategoryForm({ ...categoryForm, name: e.target.value });
                  }}
                  placeholder="VD: Cuộc họp"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-zinc-600 dark:text-slate-300">Màu danh mục</label>
                <div className="flex flex-wrap gap-2">
                  {(["indigo", "blue", "emerald", "amber", "rose", "purple", "teal", "orange"] as EventColor[]).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCategoryForm({ ...categoryForm, color })}
                      className={`h-7 w-7 rounded-full ${COLOR_MAP[color].bg} transition-all ${categoryForm.color === color ? `ring-2 ring-offset-2 ${COLOR_MAP[color].ring}` : ""}`}
                    />
                  ))}
                </div>
              </div>
              {categoryError && <p className="text-xs font-medium text-rose-600">{categoryError}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryError(null);
                    setShowCategoryPopup(false);
                    setCategoryForm({ name: "", color: "indigo" });
                  }}
                  className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="flex-1 rounded-lg bg-zinc-900 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-indigo-600 dark:hover:bg-indigo-700"
                  disabled={!categoryForm.name.trim() || isCreatingCategory}
                >
                  {isCreatingCategory ? "Đang tạo..." : "Tạo danh mục"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface DayDetailPanelProps {
  date: Date;
  events: WeeklyCalendarItem[];
  onClose: () => void;
  onEditEvent: (event: CalendarEvent) => void;
  language: string;
}

function DayDetailPanel({ date, events, onClose, onEditEvent, language }: DayDetailPanelProps) {
  const { categories } = useData();
  const dayName = DAYS_VI[(date.getDay() + 6) % 7];

  return (
    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center sm:justify-end z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-[320px] max-h-[80vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-150" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
          <div>
            <div className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wide">{dayName}</div>
            <h3 className="text-gray-800 dark:text-slate-100 mt-0.5 font-bold">
              {date.toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", { day: "numeric", month: "long", year: "numeric" })}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 transition-colors">
            <X size={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-350 dark:text-slate-500">
              <div className="w-12 h-12 rounded-full bg-gray-55 dark:bg-slate-800 flex items-center justify-center mb-3">
                <Plus size={20} />
              </div>
              <p className="text-sm text-gray-400 dark:text-slate-400">{language === "vi" ? "Không có sự kiện" : "No events"}</p>
              <p className="text-xs text-gray-300 dark:text-slate-500 mt-0.5">{language === "vi" ? "Ngày rảnh rỗi!" : "Free day!"}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {[...events]
                .sort((a, b) => a.startHour - b.startHour || a.startMin - b.startMin)
                .map((event) => {
                  const colors = COLOR_MAP[event.color as EventColor];
                  const category = categories.find((c) => c.id === event.categoryId);
                  return (
                    <div key={event.id} className={`rounded-xl p-3 ${colors.light} border-l-4 ${colors.border} ${event.kind === "task" ? "cursor-default" : "cursor-pointer hover:brightness-95"} ${event.readOnly ? "ring-1 ring-blue-200 dark:ring-blue-500/40" : ""} transition-all group`} onClick={() => {
                      if (event.kind === "task") return;
                      onEditEvent(event);
                    }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${colors.text}`}>{event.title}</p>
                          {event.readOnly ? (
                            <p className="mt-1 inline-flex items-center gap-1 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                              <CalendarDays size={10} /> {event.calendarName || "Google Calendar"}
                            </p>
                          ) : category && <p className={`text-xs mt-0.5 opacity-70 ${colors.text}`}>{category.name}</p>}
                        </div>
                        {event.kind !== "task" && !event.readOnly && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => {
                              e.stopPropagation();
                              onEditEvent(event);
                            }} className={`p-1 rounded hover:bg-white/50 ${colors.text}`}>
                              <Edit2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className={`flex items-center gap-1.5 text-xs opacity-70 ${colors.text}`}>
                          <Clock size={11} />
                          {event.allDay ? (language === "vi" ? "Cả ngày" : "All day") : getTimeString(event.startHour, event.startMin, event.duration)}
                        </div>
                        <div className={`flex items-center gap-1.5 text-xs opacity-70 ${colors.text}`}>
                          <MapPin size={11} />
                          {event.location}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-850">
          <button onClick={onClose} className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-gray-700 dark:text-slate-300 text-sm py-2 rounded-xl transition-colors">
            {language === "vi" ? "Đóng" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface WeeklyViewProps {
  initialMode?: "week" | "month";
}

export function WeeklyView({ initialMode = "week" }: WeeklyViewProps) {
  const { events, tasks, addEvent, updateEvent, deleteEvent, refreshData, loading, language } = useData();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEventDraft, setNewEventDraft] = useState<CalendarEventDraft | null>(null);
  const [coachState, setCoachState] = useState<"idle" | "suggesting" | "processing" | "done">("idle");
  const [calendarMode, setCalendarMode] = useState<"week" | "month">(initialMode);
  const [showPlanwiseEvents, setShowPlanwiseEvents] = useState(true);
  const [showGoogleEvents, setShowGoogleEvents] = useState(true);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [monthCursor, setMonthCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const didInitialScrollRef = useRef(false);

  const handleSaveEvent = (eventData: CalendarEventDraft) => {
    if ("id" in eventData) {
      updateEvent(eventData.id, eventData);
    } else {
      addEvent(eventData);
    }
  };

  const hasMERTask = events.some((e) => e.id === "mock-99" || e.id === "mock-1");

  const applyPomodoro = () => {
    setCoachState("processing");

    setTimeout(() => {
      deleteEvent("mock-99");
      deleteEvent("mock-1");

      for (let i = 0; i < 8; i++) {
        addEvent({
          title: `Phiên ${i + 1}: ${i === 0 ? "Đọc Paper gốc" : i === 1 ? "Note kiến trúc Encoder" : "Tập trung (Focus)"}`,
          day: "Mon",
          startHour: 8 + Math.floor((i * 30) / 60),
          startMin: (i * 30) % 60,
          duration: 25 / 60,
          color: "rose",
          location: "Tại nhà",
          notes: "Pomodoro focus",
          categoryId: "mock-2",
        });

        addEvent({
          title: "Giải lao 5p (Tea break)",
          day: "Mon",
          startHour: 8 + Math.floor((i * 30 + 25) / 60),
          startMin: (i * 30 + 25) % 60,
          duration: 5 / 60,
          color: "emerald",
          location: "Tại nhà",
          notes: "Giải lao",
          categoryId: "mock-2",
        });
      }
      setCoachState("done");
    }, 1500);
  };

  const weekDates = useMemo(() => DAYS.map((_, index) => addDays(weekStart, index)), [weekStart]);
  const today = new Date();
  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const monthLabel = formatMonthLabel(monthCursor, language);
  const weekLabel = formatWeekRange(weekStart, language);

  const calendarTasks = useMemo<WeeklyCalendarItem[]>(() => {
    const items: WeeklyCalendarItem[] = [];

    tasks
      .filter((task) => !task.completed && task.showOnCalendar !== false)
      .forEach((task) => {
        const scheduledAt = task.scheduledAt ? new Date(task.scheduledAt) : null;
        const dueDate = parseUiDueDate(task.dueDate);
        const baseDate = scheduledAt && !Number.isNaN(scheduledAt.getTime())
          ? scheduledAt
          : dueDate && !Number.isNaN(dueDate.getTime())
          ? dueDate
          : null;

        if (!baseDate) return;

        const dayCode = DAYS[(baseDate.getDay() + 6) % 7];
        const durationInHours = scheduledAt ? Math.max(0.5, (task.estimatedTime || 60) / 60) : 0.5;
        const eventDate = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, "0")}-${String(baseDate.getDate()).padStart(2, "0")}`;
        const isDeadlineOnly = !scheduledAt && !!dueDate;

        items.push({
          id: `task-${task.id}`,
          title: task.title,
          day: dayCode,
          startHour: baseDate.getHours(),
          startMin: baseDate.getMinutes(),
          duration: durationInHours,
          color: task.categoryColor || task.color || "amber",
          location: isDeadlineOnly
            ? (language === "vi" ? "Hạn chót" : "Deadline")
            : (language === "vi" ? "Công việc đã lên lịch" : "Scheduled task"),
          notes: task.description || (isDeadlineOnly
            ? (language === "vi" ? "Hiển thị từ deadline task" : "Shown from task deadline")
            : (language === "vi" ? "Hiển thị từ thời gian task" : "Shown from task schedule")),
          categoryId: task.categoryId || "",
          eventDate,
          kind: "task",
        });
      });

    return items;
  }, [tasks, language]);

  const planwiseEventCount = useMemo(
    () => events.filter((event) => event.source !== "GOOGLE").length,
    [events],
  );
  const googleEventCount = useMemo(
    () => events.filter((event) => event.source === "GOOGLE").length,
    [events],
  );
  const visibleEvents = useMemo(
    () => events.filter((event) => event.source === "GOOGLE" ? showGoogleEvents : showPlanwiseEvents),
    [events, showGoogleEvents, showPlanwiseEvents],
  );
  const allCalendarItems = useMemo<WeeklyCalendarItem[]>(() => {
    return [...visibleEvents, ...calendarTasks];
  }, [visibleEvents, calendarTasks]);

  const visibleStartHour = START_HOUR;
  const visibleEndHour = END_HOUR;

  const hours = useMemo(
    () => Array.from({ length: visibleEndHour - visibleStartHour + 1 }, (_, i) => visibleStartHour + i),
    [visibleEndHour, visibleStartHour]
  );

  const currentTimeTop = (currentHour - visibleStartHour + currentMin / 60) * HOUR_HEIGHT;
  const isCurrentTimeVisible = currentHour >= visibleStartHour && currentHour < visibleEndHour;
  const isViewingCurrentWeek = weekDates.some((date) => isSameDate(date, today));
  const hasAllDayEvents = weekDates.some((date) =>
    allCalendarItems.some((item) => item.allDay && doesItemOccurOnDate(item, date, weekDates)),
  );

  useEffect(() => {
    if (didInitialScrollRef.current || calendarMode !== "week" || !scrollRef.current) return;

    didInitialScrollRef.current = true;
    const targetHour = isViewingCurrentWeek ? currentHour + currentMin / 60 : DEFAULT_START_HOUR;
    scrollRef.current.scrollTop = Math.max(0, (targetHour - visibleStartHour) * HOUR_HEIGHT - HOUR_HEIGHT);
  }, [calendarMode, currentHour, currentMin, isViewingCurrentWeek, visibleStartHour]);

  const monthCells = useMemo(() => {
    const firstDay = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const totalDays = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0).getDate();
    const startPadding = (firstDay.getDay() + 6) % 7;
    const cells: Array<Date | null> = [];

    for (let i = 0; i < startPadding; i++) cells.push(null);
    for (let day = 1; day <= totalDays; day++) {
      cells.push(new Date(monthCursor.getFullYear(), monthCursor.getMonth(), day));
    }

    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [monthCursor]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return allCalendarItems.filter((event) => doesItemOccurOnDate(event, selectedDate, weekDates));
  }, [allCalendarItems, selectedDate, weekDates]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 dark:text-slate-100 relative">
      {hasMERTask && calendarMode === "week" && (
        <button
          onClick={() => setCoachState((prev) => (prev === "suggesting" ? "idle" : "suggesting"))}
          className="absolute bottom-32 right-6 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-[0_10px_25px_-5px_rgba(59,130,246,0.6)] transition-all duration-300 hover:scale-110 active:scale-95 bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-500 z-40 group"
          title="CoachAI"
        >
          <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75"></div>
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-xl leading-none">🦉</span>
          </div>
          <span className="absolute -top-8 right-0 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-medium tracking-wide">CoachAI</span>
        </button>
      )}

      {coachState === "done" && (
        <div className="absolute bottom-24 right-6 w-[calc(100vw-3rem)] sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-4 border border-emerald-100 dark:border-emerald-500/20 z-50 animate-in slide-in-from-bottom-5">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/25 flex items-center justify-center text-xl shrink-0">🦉</div>
            <div>
              <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed font-medium">
                {language === "vi"
                  ? "Xong rồi! Mình đã xếp sẵn các khung nghỉ ngơi. Khi đến giờ giải lao, mình sẽ nhắc bạn đứng dậy vươn vai nhé. Bắt đầu phiên 1 thôi! 🎉"
                  : "Done! I have scheduled rest intervals. I'll remind you to stretch when it's break time. Let's start session 1! 🎉"}
              </p>
              <button onClick={() => setCoachState("idle")} className="mt-3 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-300 px-3 py-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/25 transition-colors">
                {language === "vi" ? "Đóng" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-gray-100 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0 bg-white dark:bg-slate-950 gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-gray-900 dark:text-slate-50 font-bold text-lg sm:text-xl leading-tight">
            {calendarMode === "week"
              ? language === "vi"
                ? "Lịch tuần"
                : "Weekly Schedule"
              : language === "vi"
                ? "Lịch tháng"
                : "Monthly Calendar"}
          </h1>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 hidden sm:block">{calendarMode === "week" ? weekLabel : monthLabel}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-gray-100 dark:bg-slate-900 rounded-xl p-1 gap-0.5">
            <button onClick={() => setCalendarMode("week")} className={`px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer font-medium ${calendarMode === "week" ? "bg-white dark:bg-slate-800 shadow-sm text-gray-700 dark:text-slate-200 font-semibold" : "text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200"}`}>
              {language === "vi" ? "Tuần" : "Week"}
            </button>
            <button onClick={() => setCalendarMode("month")} className={`px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer font-medium ${calendarMode === "month" ? "bg-white dark:bg-slate-800 shadow-sm text-gray-700 dark:text-slate-200 font-semibold" : "text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200"}`}>
              {language === "vi" ? "Tháng" : "Month"}
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (calendarMode === "week") setWeekStart((prev) => addDays(prev, -7));
                else setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
              }}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => {
                const nowDate = new Date();
                setWeekStart(startOfWeek(nowDate));
                setMonthCursor(new Date(nowDate.getFullYear(), nowDate.getMonth(), 1));
              }}
              className="px-3 py-1.5 text-xs border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors font-semibold"
            >
              {calendarMode === "week"
                ? language === "vi"
                  ? "Tuần này"
                  : "This Week"
                : language === "vi"
                  ? "Tháng này"
                  : "This Month"}
            </button>
            <button
              onClick={() => {
                if (calendarMode === "week") setWeekStart((prev) => addDays(prev, 7));
                else setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
              }}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <PlannerAssistantButton />
          <button onClick={() => {
            const defaultDate = weekDates[0];
            const eventDate = formatIsoDate(defaultDate);
            setNewEventDraft({
              day: "Mon",
              eventDate,
              title: "",
              startHour: 9,
              startMin: 0,
              duration: 1,
              color: "indigo",
              location: "",
              notes: "",
              categoryId: "",
              isRecurring: false,
            });
            setShowAddModal(true);
          }} className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-xs font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-sm shadow-indigo-200 dark:shadow-none">
            <Plus size={14} />
            <span className="hidden sm:inline">{language === "vi" ? "Thêm sự kiện" : "Add Event"}</span>
            <span className="sm:hidden">+</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex-shrink-0 border-b border-gray-100 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-950 sm:px-6">
          <CalendarIntegrationToolbar
            enabled={!loading}
            language={language}
            planwiseEventCount={planwiseEventCount}
            googleEventCount={googleEventCount}
            showPlanwise={showPlanwiseEvents}
            showGoogle={showGoogleEvents}
            onTogglePlanwise={() => setShowPlanwiseEvents((current) => !current)}
            onToggleGoogle={() => setShowGoogleEvents((current) => !current)}
            onRefresh={refreshData}
          />
        </div>
        <div className="px-4 sm:px-6 bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800">
          <HintBubble id="weekly_timetable_intro" title={calendarMode === "week" ? (language === "vi" ? "Lịch tuần" : "Weekly Schedule") : language === "vi" ? "Lịch tháng" : "Monthly Calendar"} color="indigo" persistent={false} className="mb-4">
            {calendarMode === "week"
              ? language === "vi"
                ? "Đây là nơi bạn sắp xếp tuần làm việc theo từng khung giờ. Bạn có thể thêm sự kiện, kéo thả để đổi ngày và nhìn nhanh chỗ nào trong tuần đang quá tải hoặc còn trống."
                : "Plan your week by time blocks, add events, and drag them across days as needed."
              : language === "vi"
                ? "Xem nhanh toàn bộ tháng để biết ngày nào dày lịch, ngày nào còn trống, rồi nhấp vào từng ngày để xem chi tiết."
                : "Use the monthly view to spot busy days, open day details, and review availability at a glance."}
          </HintBubble>
        </div>

        {calendarMode === "week" ? (
          <>
            <div className="flex border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex-shrink-0">
              <div className="w-12 sm:w-16 flex-shrink-0" />
              {DAYS.map((day, i) => {
                const date = weekDates[i];
                const isToday = isSameDate(date, today);
                return (
                  <div key={day} className={`flex-1 text-center py-2 sm:py-2.5 min-w-0 ${i < DAYS.length - 1 ? "border-r border-gray-50 dark:border-slate-900" : ""}`}>
                    <div className="text-[9px] sm:text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest font-bold">{DAYS_VI[i]}</div>
                    <div className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full mt-1 text-[11px] sm:text-xs font-semibold ${isToday ? "bg-indigo-600 text-white shadow-sm shadow-indigo-300 dark:shadow-none" : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"}`}>
                      {date.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {hasAllDayEvents && (
              <div className="flex flex-shrink-0 border-b border-gray-100 bg-white dark:border-slate-800 dark:bg-slate-950">
                <div className="flex w-12 shrink-0 items-center justify-center text-gray-400 dark:text-slate-500 sm:w-16" title={language === "vi" ? "Cả ngày" : "All day"}>
                  <CalendarDays size={13} />
                </div>
                {DAYS.map((day, index) => {
                  const date = weekDates[index];
                  const dayEvents = allCalendarItems.filter(
                    (item) => item.allDay && doesItemOccurOnDate(item, date, weekDates),
                  );
                  return (
                    <div key={`all-day-${day}`} className="min-h-9 min-w-0 flex-1 space-y-1 border-l border-gray-50 px-1 py-1 dark:border-slate-900">
                      {dayEvents.slice(0, 2).map((event) => {
                        const colors = COLOR_MAP[event.color as EventColor];
                        return (
                          <button
                            type="button"
                            key={event.id}
                            onClick={() => event.kind !== "task" && setSelectedEvent(event)}
                            className={`flex h-6 w-full min-w-0 items-center gap-1 rounded px-1.5 text-left text-[9px] font-semibold ${colors.badge} ${event.readOnly ? "ring-1 ring-blue-200 dark:ring-blue-500/40" : ""}`}
                            title={event.title}
                          >
                            {event.readOnly && <span className="shrink-0 rounded bg-blue-600 px-1 text-[8px] text-white">G</span>}
                            <span className="truncate">{event.title}</span>
                          </button>
                        );
                      })}
                      {dayEvents.length > 2 && <p className="px-1 text-[9px] text-gray-400">+{dayEvents.length - 2}</p>}
                    </div>
                  );
                })}
              </div>
            )}

            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overflow-x-auto dark:bg-slate-950 py-2">
              <div className="flex relative" style={{ height: `${(visibleEndHour - visibleStartHour) * HOUR_HEIGHT}px`, minWidth: "520px" }}>
                <div className="w-10 sm:w-12 flex-shrink-0 relative">
                  {hours.map((hour) => (
                    <div key={hour} className="absolute right-2 sm:right-3 text-[9px] sm:text-[10px] text-gray-400 dark:text-slate-500 font-semibold select-none" style={{ top: `${(hour - visibleStartHour) * HOUR_HEIGHT - 7}px` }}>
                      {formatHourLabel(hour)}
                    </div>
                  ))}
                </div>

                {DAYS.map((day, dayIdx) => {
                  const columnDate = weekDates[dayIdx];
                  const dayEvents = allCalendarItems.filter((item) => !item.allDay && doesItemOccurOnDate(item, columnDate, weekDates));
                  const isToday = isSameDate(columnDate, today);

                  return (
                    <div
                      key={day}
                      className={`flex-1 relative border-l border-gray-50 dark:border-slate-900 ${isToday ? "bg-indigo-50/20 dark:bg-indigo-500/5" : ""}`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const eventId = e.dataTransfer.getData("eventId");
                        if (eventId?.startsWith("task-")) {
                          return;
                        }
                        if (events.find((event) => event.id === eventId)?.readOnly) {
                          return;
                        }
                        if (eventId) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const y = e.clientY - rect.top;
                          const hourDropped = visibleStartHour + Math.floor(y / HOUR_HEIGHT);
                          const finalHour = Math.min(visibleEndHour - 1, Math.max(visibleStartHour, hourDropped));
                          const eventDate = `${columnDate.getFullYear()}-${String(columnDate.getMonth() + 1).padStart(2, "0")}-${String(columnDate.getDate()).padStart(2, "0")}`;
                          updateEvent(eventId, { day, eventDate, startHour: finalHour, startMin: 0 });
                        }
                      }}
                    >
                      {hours.map((hour) => (
                        <div key={hour} className="absolute w-full border-t border-gray-100 dark:border-slate-900" style={{ top: `${(hour - visibleStartHour) * HOUR_HEIGHT}px` }} />
                      ))}
                      {hours.slice(0, -1).map((hour) => (
                        <div key={`h-${hour}`} className="absolute w-full border-t border-dashed border-gray-50 dark:border-slate-900/50 opacity-40" style={{ top: `${(hour - visibleStartHour) * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }} />
                      ))}

                      {isToday && isCurrentTimeVisible && (
                        <div className="absolute w-full z-20 pointer-events-none" style={{ top: `${currentTimeTop}px` }}>
                          <div className="flex items-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 flex-shrink-0 shadow-sm" />
                            <div className="flex-1 h-px bg-red-400" />
                          </div>
                        </div>
                      )}

                      {dayEvents.map((event) => (
                        <EventCard key={event.id} event={event} visibleStartHour={visibleStartHour} onClick={setSelectedEvent} />
                      ))}

                      {day === "Mon" && hasMERTask && coachState === "suggesting" && (
                        <div className="absolute z-50 left-[10px] right-[10px] sm:left-[90%] sm:right-auto w-[calc(100vw-3rem)] sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-blue-100 dark:border-slate-800 p-0 overflow-hidden animate-in zoom-in-95 duration-200" style={{ top: `${(8 - visibleStartHour) * HOUR_HEIGHT + 20}px` }}>
                          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3 flex items-center gap-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-xl backdrop-blur-sm shadow-inner relative z-10">🦉</div>
                            <span className="font-bold text-white text-sm relative z-10 tracking-wide">CoachAI Mentor</span>
                          </div>
                          <div className="p-4 space-y-4">
                            <p className="text-[13px] text-gray-700 dark:text-slate-300 leading-relaxed">
                              Chào <strong>Quoc Anh</strong>! Mình thấy bạn định dành 4 tiếng liên tục cho nghiên cứu MER. Theo khoa học, não bộ sẽ bắt đầu <em>"đình công"</em> sau 90 phút tập trung sâu đấy.
                            </p>
                            <div className="bg-blue-50/50 dark:bg-blue-500/10 rounded-xl p-3 border border-blue-100 dark:border-blue-500/25">
                              <p className="text-xs text-blue-900 dark:text-blue-300 leading-relaxed flex items-start gap-2">
                                <Brain size={16} className="text-blue-500 shrink-0 mt-0.5" />
                                <span>Bạn có muốn thử <strong>phương pháp Pomodoro</strong> không? Chúng ta sẽ chia 4 tiếng này thành các phiên làm việc 25 phút và nghỉ 5 phút. Cách này giúp não không bị "cháy".</span>
                              </p>
                            </div>
                            <p className="text-[13px] font-medium text-gray-700 dark:text-slate-350">Bạn có muốn mình tự động chia nhỏ lịch trình này không?</p>
                            <div className="flex flex-col gap-2 pt-2">
                              <button onClick={applyPomodoro} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-md shadow-blue-200 dark:shadow-none active:scale-95">
                                Áp dụng ngay 🚀
                              </button>
                              <button onClick={() => setCoachState("idle")} className="w-full bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-750 font-medium py-2 rounded-xl text-sm transition-colors">
                                Để mình tự làm
                              </button>
                            </div>
                          </div>
                          <div className="hidden sm:block absolute top-6 -left-2 w-4 h-4 bg-blue-500 transform rotate-45"></div>
                        </div>
                      )}

                      {day === "Mon" && coachState === "processing" && hasMERTask && (
                        <div className="absolute inset-x-1 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-lg border-2 border-indigo-400 border-dashed flex items-center justify-center flex-col gap-2" style={{ top: `${(8 - visibleStartHour) * HOUR_HEIGHT}px`, height: `${4 * HOUR_HEIGHT}px` }}>
                          <div className="flex gap-1.5 items-center">
                            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"></div>
                          </div>
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-450 tracking-wide uppercase">AI đang chia block...</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-hidden p-4 flex flex-col min-h-0">
            <div className="flex-1 min-h-0 flex flex-col bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
              <div className="grid grid-cols-7 border-b border-gray-100 bg-white dark:border-slate-800 dark:bg-slate-900">
                {WEEK_HEADERS_VI.map((day) => (
                  <div key={day} className="text-center py-3 text-[11px] text-gray-400 uppercase tracking-wider font-semibold dark:text-slate-300">
                    {day}
                  </div>
                ))}
              </div>
              <div className="flex-1 grid grid-cols-7 gap-px bg-gray-200 overflow-y-auto dark:bg-slate-800 auto-rows-[120px]">
                {monthCells.map((date, idx) => {
                  if (!date) {
                    return <div key={`empty-${idx}`} className="bg-white dark:bg-slate-900/60" />;
                  }

                  const dayCode = DAYS[(date.getDay() + 6) % 7];
                  const dateEvents = allCalendarItems.filter((event) => doesItemOccurOnDate(event, date, weekDates));
                  const isToday = isSameDate(date, today);

                  return (
                    <div
                      key={date.toISOString()}
                      className={`bg-white p-2 flex flex-col cursor-pointer transition-all hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800/80 ${isToday ? "ring-2 ring-inset ring-indigo-500 dark:ring-indigo-400" : ""}`}
                      onClick={() => setSelectedDate(date)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const eventId = e.dataTransfer.getData("eventId");
                        if (eventId?.startsWith("task-")) {
                          return;
                        }
                        if (events.find((event) => event.id === eventId)?.readOnly) {
                          return;
                        }
                        if (eventId) {
                          e.stopPropagation();
                          updateEvent(eventId, { day: dayCode });
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${isToday ? "bg-indigo-600 text-white dark:bg-indigo-500" : "text-gray-700 dark:text-slate-100"}`}>
                          {date.getDate()}
                        </span>
                        {dateEvents.length > 0 && <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full dark:bg-slate-800 dark:text-slate-300">{dateEvents.length}</span>}
                      </div>

                      <div className="space-y-0.5 overflow-hidden flex-1 hidden sm:block">
                        {dateEvents.slice(0, 3).map((event) => {
                          const colors = COLOR_MAP[event.color as EventColor];
                          return (
                            <div
                              key={event.id}
                              className={`text-[9px] px-1.5 py-0.5 rounded truncate ${event.readOnly ? "cursor-pointer ring-1 ring-blue-200 dark:ring-blue-500/40" : "cursor-grab active:cursor-grabbing"} ${colors.badge}`}
                              title={event.title}
                              draggable={!event.readOnly && event.kind !== "task"}
                              onDragStart={(e) => {
                                if (event.readOnly || event.kind === "task") return;
                                e.stopPropagation();
                                e.dataTransfer.setData("eventId", event.id.toString());
                              }}
                            >
                              {event.readOnly ? `G | ${event.title}` : event.title}
                            </div>
                          );
                        })}
                        {dateEvents.length > 3 && <div className="text-[9px] text-gray-400 px-1.5 dark:text-slate-300">+{dateEvents.length - 3} {language === "vi" ? "khác" : "more"}</div>}
                      </div>

                      <div className="flex flex-wrap gap-0.5 mt-1 sm:hidden overflow-hidden max-h-5">
                        {dateEvents.map((event) => {
                          const colors = COLOR_MAP[event.color as EventColor];
                          return <div key={event.id} className={`w-1.5 h-1.5 rounded-full ${colors.dot} shrink-0`} title={event.title} />;
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedEvent && <EventModal weekDates={weekDates} event={selectedEvent} onClose={() => setSelectedEvent(null)} onSave={handleSaveEvent} onDelete={deleteEvent} />}
      {editingEvent && !showAddModal && <EventModal weekDates={weekDates} event={editingEvent} onClose={() => setEditingEvent(null)} onSave={handleSaveEvent} onDelete={deleteEvent} />}
      {showAddModal && <EventModal weekDates={weekDates} event={newEventDraft || undefined} onClose={() => {
        setShowAddModal(false);
        setNewEventDraft(null);
      }} onSave={handleSaveEvent} />}
      {selectedDate && <DayDetailPanel date={selectedDate} events={selectedEvents} onClose={() => setSelectedDate(null)} onEditEvent={(event) => {
        setEditingEvent(event);
        setShowAddModal(false);
        setSelectedDate(null);
      }} language={language} />}
    </div>
  );
}
