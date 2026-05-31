import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, Plus, X, Clock, MapPin, Tag, Edit2 } from "lucide-react";
import { useData } from "../context/DataContext";
import { COLOR_MAP, DAYS, getTimeString, type CalendarEvent } from "../data/mockData";
import { HintBubble } from "./HintBubble";

// March 2026: starts on Sunday (0), 31 days
const MONTH_START_DAY = 0; // Sunday
const MONTH_DAYS = 31;
const TODAY = 12;
const MONTH_NAME = "Tháng 3, 2026";

// Map day abbreviation to day-of-week index (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
const DAY_TO_DOW: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const WEEK_HEADERS_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

// Get events for a specific date in March
function getEventsForDate(date: number, events: CalendarEvent[]): CalendarEvent[] {
  const dow = (MONTH_START_DAY + date - 1) % 7;
  const dayName = Object.keys(DAY_TO_DOW).find((k) => DAY_TO_DOW[k] === dow);
  if (!dayName) return [];
  return events.filter((e) => e.day === dayName.slice(0, 3));
}

interface DayDetailPanelProps {
  date: number;
  events: CalendarEvent[];
  onClose: () => void;
  onEditEvent: (event: CalendarEvent) => void;
}

function DayDetailPanel({ date, events, onClose, onEditEvent }: DayDetailPanelProps) {
  const { categories } = useData();
  const dow = (MONTH_START_DAY + date - 1) % 7;
  const dayName = WEEK_HEADERS_VI[dow];

  return (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-end z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-80 max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">{dayName}</div>
            <h3 className="text-gray-800 mt-0.5">{date} tháng 3, 2026</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X size={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-300">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                <Plus size={20} />
              </div>
              <p className="text-sm text-gray-400">Không có sự kiện</p>
              <p className="text-xs text-gray-300 mt-0.5">Ngày rảnh rỗi!</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {events
                .sort((a, b) => a.startHour - b.startHour || a.startMin - b.startMin)
                .map((event) => {
                  const colors = COLOR_MAP[event.color];
                  const category = categories.find(c => c.id === event.categoryId);
                  return (
                    <div
                      key={event.id}
                      className={`rounded-xl p-3 ${colors.light} border-l-4 ${colors.border} cursor-pointer hover:brightness-95 transition-all group`}
                      onClick={() => onEditEvent(event)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${colors.text}`}>{event.title}</p>
                          {category && (
                            <p className={`text-xs mt-0.5 opacity-70 ${colors.text}`}>{category.name}</p>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditEvent(event);
                            }}
                            className={`p-1 rounded hover:bg-white/50 ${colors.text}`}
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className={`flex items-center gap-1.5 text-xs opacity-70 ${colors.text}`}>
                          <Clock size={11} />
                          {getTimeString(event.startHour, event.startMin, event.duration)}
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
        <div className="px-5 py-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-2 rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export function MonthlyView() {
  const { events, language, updateEvent } = useData();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const cells: (number | null)[] = [];
  for (let i = 0; i < MONTH_START_DAY; i++) cells.push(null);
  for (let i = 1; i <= MONTH_DAYS; i++) cells.push(i);

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate, events) : [];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950">
      <div className="border-b border-gray-100 px-6 py-3.5 flex items-center justify-between flex-shrink-0 dark:border-slate-800 dark:bg-slate-950">
        <div>
          <h1 className="text-gray-900 font-bold text-xl dark:text-slate-50">{language === 'vi' ? "Lịch tháng" : "Monthly Calendar"}</h1>
          <p className="text-xs text-gray-400 mt-0.5 dark:text-slate-300">{language === 'vi' ? MONTH_NAME : "March 2026"}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5 dark:bg-slate-800">
            <button 
              onClick={() => navigate('/timetable')}
              className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer dark:text-slate-300 dark:hover:text-slate-100">
              {language === 'vi' ? "Tuần" : "Week"}
            </button>
            <button className="px-3 py-1.5 rounded-lg text-xs bg-white shadow-sm text-gray-700 font-medium dark:bg-slate-900 dark:text-slate-100">
              {language === 'vi' ? "Tháng" : "Month"}
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors dark:text-slate-300 dark:hover:bg-slate-800">
              <ChevronLeft size={17} />
            </button>
            <button className="px-3 py-1.5 text-xs border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-medium dark:border-indigo-400/30 dark:bg-indigo-500/10 dark:text-indigo-200 dark:hover:bg-indigo-500/20">
              {language === 'vi' ? "Tháng này" : "This Month"}
            </button>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors dark:text-slate-300 dark:hover:bg-slate-800">
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-hidden p-4 flex flex-col min-h-0">
        <HintBubble
          id="monthly_calendar_intro"
          title={language === "vi" ? "Lịch tháng" : "Monthly Calendar"}
          color="violet"
          persistent={false}
          className="mb-4"
        >
          {language === "vi"
            ? "Mục này cho bạn góc nhìn theo tháng để thấy ngày nào dày lịch, ngày nào còn trống. Nhấp vào từng ngày để xem chi tiết và kéo sự kiện sang ngày khác khi cần."
            : "Use the monthly view to spot busy days, open day details, and reschedule events across the month."}
        </HintBubble>

        <div className="flex-1 min-h-0 flex flex-col bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          {/* Week headers */}
          <div className="grid grid-cols-7 border-b border-gray-100 bg-white dark:border-slate-800 dark:bg-slate-900">
            {WEEK_HEADERS_VI.map((day) => (
              <div
                key={day}
                className="text-center py-3 text-[11px] text-gray-400 uppercase tracking-wider font-semibold dark:text-slate-300"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-px bg-gray-200 overflow-hidden dark:bg-slate-800">
            {cells.map((date, idx) => {
              if (date === null) {
                return <div key={`empty-${idx}`} className="bg-white dark:bg-slate-900/60" />;
              }

              const dateEvents = getEventsForDate(date, events);
              const isToday = date === TODAY;

              return (
                <div
                  key={date}
                  className={`bg-white p-2 flex flex-col cursor-pointer transition-all hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800/80 ${
                    isToday ? "ring-2 ring-inset ring-indigo-500 dark:ring-indigo-400" : ""
                  }`}
                  onClick={() => setSelectedDate(date)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const eventId = Number(e.dataTransfer.getData('eventId'));
                    if (eventId) {
                      e.stopPropagation();
                      const dow = (MONTH_START_DAY + date - 1) % 7;
                      const dayName = Object.keys(DAY_TO_DOW).find((k) => DAY_TO_DOW[k] === dow);
                      if (dayName) {
                        updateEvent(eventId, { day: dayName.slice(0, 3) });
                      }
                    }
                  }}
                >
                  {/* Date number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`
                        text-sm font-medium inline-flex items-center justify-center w-6 h-6 rounded-full
                        ${isToday ? "bg-indigo-600 text-white dark:bg-indigo-500" : "text-gray-700 dark:text-slate-100"}
                      `}
                    >
                      {date}
                    </span>
                    {dateEvents.length > 0 && (
                      <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full dark:bg-slate-800 dark:text-slate-300">
                        {dateEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Event dots */}
                  <div className="space-y-0.5 overflow-hidden flex-1">
                    {dateEvents.slice(0, 3).map((event) => {
                      const colors = COLOR_MAP[event.color];
                      return (
                        <div
                          key={event.id}
                          className={`text-[9px] px-1.5 py-0.5 rounded truncate cursor-grab active:cursor-grabbing ${colors.badge}`}
                          title={event.title}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            e.dataTransfer.setData('eventId', event.id.toString());
                          }}
                        >
                          {event.title}
                        </div>
                      );
                    })}
                    {dateEvents.length > 3 && (
                      <div className="text-[9px] text-gray-400 px-1.5 dark:text-slate-300">+{dateEvents.length - 3} khác</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day detail panel */}
      {selectedDate !== null && (
        <DayDetailPanel
          date={selectedDate}
          events={selectedEvents}
          onClose={() => setSelectedDate(null)}
          onEditEvent={(event) => {
            setEditingEvent(event);
            setSelectedDate(null);
          }}
        />
      )}
    </div>
  );
}
