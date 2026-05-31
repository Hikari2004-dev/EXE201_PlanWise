import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, X, Tag, Edit2, Trash2, Bot, Brain } from "lucide-react";
import { useData } from "../context/DataContext";
import { HintBubble } from "./HintBubble";
import {
  DAYS,
  DAYS_VI,
  DAY_DATES,
  COLOR_MAP,
  TODAY_INDEX,
  getTimeString,
  type CalendarEvent,
  type EventColor,
} from "../data/mockData";

const START_HOUR = 0;   // midnight
const END_HOUR = 24;    // up to 23:xx shown
const HOUR_HEIGHT = 72; // px per hour — tall enough for 30-min events
const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

function formatHourLabel(hour: number) {
  const period = hour >= 12 ? "CH" : "SA";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display} ${period}`;
}

interface EventCardProps {
  event: CalendarEvent;
  onClick: (event: CalendarEvent) => void;
}

function EventCard({ event, onClick }: EventCardProps) {
  const colors = COLOR_MAP[event.color];
  const topPx = (event.startHour - START_HOUR + event.startMin / 60) * HOUR_HEIGHT + 2;
  // Minimum height = 22px so even 5-min events are always visible
  const heightPx = Math.max(22, event.duration * HOUR_HEIGHT - 4);
  const showLocation = heightPx > 52;
  const showTime    = heightPx > 30;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('eventId', event.id.toString());
      }}
      onClick={() => onClick(event)}
      title={`${event.title} — ${event.startHour}:${String(event.startMin).padStart(2,'0')}`}
      className={`
        absolute inset-x-0.5 rounded-md px-2 py-1 cursor-pointer overflow-hidden
        border-l-[3px] ${colors.light} ${colors.border}
        hover:brightness-95 active:scale-[0.99] transition-all duration-100 shadow-sm hover:shadow
      `}
      style={{ top: `${topPx}px`, height: `${heightPx}px`, minHeight: '22px' }}
    >
      <p className={`text-[11px] font-semibold leading-tight truncate ${colors.text}`}>{event.title}</p>
      {showTime && (
        <p className={`text-[10px] leading-tight mt-0.5 opacity-70 truncate ${colors.text}`}>
          {event.startHour}:{String(event.startMin).padStart(2, '0')}
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
  event?: CalendarEvent;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, "id"> | CalendarEvent) => void;
  onDelete?: (id: number) => void;
}

function EventModal({ event, onClose, onSave, onDelete }: EventModalProps) {
  const { categories } = useData();
  const [form, setForm] = useState({
    title: event?.title || "",
    day: event?.day || "Mon",
    startHour: event?.startHour.toString() || "9",
    startMin: event?.startMin.toString() || "0",
    duration: event?.duration.toString() || "1",
    location: event?.location || "",
    notes: event?.notes || "",
    color: event?.color || "indigo" as EventColor,
    categoryId: event?.categoryId || (categories[0]?.id || 0),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const eventData = {
      title: form.title,
      day: form.day,
      startHour: parseInt(form.startHour),
      startMin: parseInt(form.startMin),
      duration: parseFloat(form.duration),
      color: form.color,
      location: form.location || "Chưa có",
      notes: form.notes,
      categoryId: form.categoryId,
    };

    if (event) {
      onSave({ ...event, ...eventData });
    } else {
      onSave(eventData);
    }
    onClose();
  };

  const selectedCategory = categories.find(c => c.id === form.categoryId);
  const colors = selectedCategory ? COLOR_MAP[selectedCategory.color] : COLOR_MAP[form.color];

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-96 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${colors.light} px-5 py-4 border-b border-black/5`}>
          <div className="flex items-start justify-between">
            <h3 className={`${colors.text} leading-tight`}>
              {event ? "Chỉnh sửa sự kiện" : "Thêm sự kiện mới"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-black/5 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tiêu đề *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="VD: Họp nhóm"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Ngày</label>
              <select
                value={form.day}
                onChange={(e) => setForm({ ...form, day: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {DAYS.map((d, i) => <option key={d} value={d}>{DAYS_VI[i]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Danh mục</label>
              <select
                value={form.categoryId}
                onChange={(e) => {
                  const catId = parseInt(e.target.value);
                  const cat = categories.find(c => c.id === catId);
                  setForm({ ...form, categoryId: catId, color: cat?.color || form.color });
                }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Giờ bắt đầu</label>
              <select
                value={form.startHour}
                onChange={(e) => setForm({ ...form, startHour: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {hours.map((h) => <option key={h} value={h}>{h}:00</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Phút</label>
              <select
                value={form.startMin}
                onChange={(e) => setForm({ ...form, startMin: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="0">:00</option>
                <option value="30">:30</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Thời lượng</label>
              <select
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4].map((d) => (
                  <option key={d} value={d}>{d}h</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Địa điểm</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Phòng họp A"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Ghi chú</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Thêm ghi chú..."
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>
          <div className="flex gap-2 pt-1">
            {event && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(event.id);
                  onClose();
                }}
                className="px-3 border border-rose-200 text-rose-600 text-sm py-2 rounded-xl hover:bg-rose-50 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white text-sm py-2 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              {event ? "Cập nhật" : "Thêm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function WeeklyView() {
  const { events, addEvent, updateEvent, deleteEvent, language } = useData();
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [coachState, setCoachState] = useState<'idle' | 'suggesting' | 'processing' | 'done'>('idle');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to 7 AM on mount so user lands near start of work day
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 7 * HOUR_HEIGHT; // 7 * 72 = 504px from midnight
    }
  }, []);

  const handleSaveEvent = (eventData: Omit<CalendarEvent, "id"> | CalendarEvent) => {
    if ('id' in eventData) {
      updateEvent(eventData.id, eventData);
    } else {
      addEvent(eventData);
    }
  };

  const hasMERTask = events.some(e => e.id === 99);

  const applyPomodoro = () => {
    setCoachState('processing');
    
    setTimeout(() => {
      // 1. Delete original event
      deleteEvent(99);
      
      // 2. Add 8 smaller blocks
      for (let i = 0; i < 8; i++) {
        // Focus Session (25 mins)
        addEvent({
          title: `Phiên ${i+1}: ${i === 0 ? "Đọc Paper gốc" : i === 1 ? "Note kiến trúc Encoder" : "Tập trung (Focus)"}`,
          day: "Mon",
          startHour: 8 + Math.floor((i * 30) / 60),
          startMin: (i * 30) % 60,
          duration: 25 / 60,
          color: "rose",
          location: "Tại nhà",
          notes: "Pomodoro focus",
          categoryId: 2
        });
        
        // Break Session (5 mins)
        addEvent({
          title: `Giải lao 5p (Tea break)`,
          day: "Mon",
          startHour: 8 + Math.floor((i * 30 + 25) / 60),
          startMin: (i * 30 + 25) % 60,
          duration: 5 / 60,
          color: "emerald",
          location: "Tại nhà",
          notes: "Giải lao",
          categoryId: 2
        });
      }
      setCoachState('done');
    }, 1500);
  };

  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const currentTimeTop = (currentHour - START_HOUR + currentMin / 60) * HOUR_HEIGHT;
  const isCurrentTimeVisible = currentHour >= START_HOUR && currentHour < END_HOUR;

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* CoachAI Bubble & Float Button */}
      {hasMERTask && (
        <button 
          onClick={() => setCoachState(prev => prev === 'suggesting' ? 'idle' : 'suggesting')}
          className="absolute bottom-32 right-6 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-[0_10px_25px_-5px_rgba(59,130,246,0.6)] transition-all duration-300 hover:scale-110 active:scale-95 bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-500 z-40 group"
          title="CoachAI"
        >
          {/* Pulse effect */}
          <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75"></div>
          {/* Owl-like character using Brain Icon for intelligence */}
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-xl leading-none">🦉</span>
          </div>
          <span className="absolute -top-8 right-0 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-medium tracking-wide">CoachAI</span>
        </button>
      )}

      {/* Done notification */}
      {coachState === 'done' && (
        <div className="absolute bottom-24 right-6 w-80 bg-white rounded-2xl shadow-2xl p-4 border border-emerald-100 z-50 animate-in slide-in-from-bottom-5">
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xl shrink-0">🦉</div>
             <div>
                <p className="text-sm text-gray-700 leading-relaxed font-medium">Xong rồi! Mình đã xếp sẵn các khung nghỉ ngơi. Khi đến giờ giải lao, mình sẽ nhắc bạn đứng dậy vươn vai nhé. Bắt đầu phiên 1 thôi! 🎉</p>
                <button 
                  onClick={() => setCoachState('idle')} 
                  className="mt-3 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  Đóng
                </button>
             </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0 bg-white gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-gray-900 font-bold text-lg sm:text-xl leading-tight">
            {language === 'vi' ? 'Lịch tuần' : 'Weekly Schedule'}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
            {language === 'vi' ? '9 – 15 tháng 3, 2026' : 'March 9 – 15, 2026'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Week / Month toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
            <button className="px-3 py-1.5 rounded-lg text-xs bg-white shadow-sm text-gray-700 font-semibold">
              {language === 'vi' ? 'Tuần' : 'Week'}
            </button>
            <button
              onClick={() => navigate('/calendar')}
              className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer font-medium"
            >
              {language === 'vi' ? 'Tháng' : 'Month'}
            </button>
          </div>
          {/* Prev / Today / Next */}
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button className="px-3 py-1.5 text-xs border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-semibold">
              {language === 'vi' ? 'Hôm nay' : 'Today'}
            </button>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
          {/* Add event */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-xs font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-sm shadow-indigo-200"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">{language === 'vi' ? 'Thêm sự kiện' : 'Add Event'}</span>
            <span className="sm:hidden">+</span>
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="px-4 sm:px-6 pt-4 bg-white border-b border-gray-100">
          <HintBubble
            id="weekly_timetable_intro"
            title={language === "vi" ? "Lịch tuần" : "Weekly Schedule"}
            color="indigo"
            persistent={false}
            className="mb-4"
          >
            {language === "vi"
              ? "Đây là nơi bạn sắp xếp tuần làm việc theo từng khung giờ. Bạn có thể thêm sự kiện, kéo thả để đổi ngày và nhìn nhanh chỗ nào trong tuần đang quá tải hoặc còn trống."
              : "Plan your week by time blocks, add events, and drag them across days as needed."}
          </HintBubble>
        </div>

        {/* Day header row — responsive: show short labels on small screens */}
        <div className="flex border-b border-gray-100 bg-white flex-shrink-0">
          {/* Time gutter */}
          <div className="w-12 sm:w-16 flex-shrink-0" />
          {DAYS.map((day, i) => (
            <div
              key={day}
              className={`flex-1 text-center py-2 sm:py-2.5 min-w-0 ${
                i < DAYS.length - 1 ? 'border-r border-gray-50' : ''
              }`}
            >
              <div className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                {DAYS_VI[i]}
              </div>
              <div
                className={`
                  inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full mt-1 text-[11px] sm:text-xs font-semibold
                  ${
                    i === TODAY_INDEX
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-300'
                      : 'text-gray-500 hover:bg-gray-100 cursor-pointer transition-colors'
                  }
                `}
              >
                {DAY_DATES[i]}
              </div>
            </div>
          ))}
        </div>

        {/* Scrollable time grid — overflow-y-auto here, NOT on children */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-auto">
          <div
            className="flex relative"
            style={{
              height: `${(END_HOUR - START_HOUR) * HOUR_HEIGHT}px`,
              minWidth: '520px', // prevents columns from collapsing on very narrow screens
            }}
          >
            {/* Time column */}
            <div className="w-12 sm:w-16 flex-shrink-0 relative">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute right-2 sm:right-3 text-[9px] sm:text-[10px] text-gray-400 font-semibold select-none"
                  style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT - 7}px` }}
                >
                  {formatHourLabel(hour)}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {DAYS.map((day, dayIdx) => {
              const dayEvents = events.filter((e) => e.day === day);
              const isToday = dayIdx === TODAY_INDEX;

              return (
                <div
                  key={day}
                  className={`
                    flex-1 relative border-l border-gray-50
                    ${isToday ? "bg-indigo-50/20" : ""}
                  `}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const eventId = Number(e.dataTransfer.getData('eventId'));
                    if (eventId) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const y = e.clientY - rect.top;
                      const hourDropped = START_HOUR + Math.floor(y / HOUR_HEIGHT);
                      const finalHour = Math.min(END_HOUR - 1, Math.max(START_HOUR, hourDropped));
                      updateEvent(eventId, { day, startHour: finalHour, startMin: 0 });
                    }
                  }}
                >
                  {/* Hour gridlines */}
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="absolute w-full border-t border-gray-100"
                      style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
                    />
                  ))}
                  {/* Half-hour lines */}
                  {hours.map((hour) => (
                    <div
                      key={`h-${hour}`}
                      className="absolute w-full border-t border-dashed border-gray-50"
                      style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }}
                    />
                  ))}

                  {/* Current time indicator */}
                  {isToday && isCurrentTimeVisible && (
                    <div
                      className="absolute w-full z-20 pointer-events-none"
                      style={{ top: `${currentTimeTop}px` }}
                    >
                      <div className="flex items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 flex-shrink-0 shadow-sm" />
                        <div className="flex-1 h-px bg-red-400" />
                      </div>
                    </div>
                  )}

                  {/* Events */}
                  {dayEvents.map((event) => (
                    <EventCard key={event.id} event={event} onClick={setSelectedEvent} />
                  ))}

                  {/* Coach AI Bubble logic specifically for the 99 event on Monday */}
                  {day === "Mon" && hasMERTask && coachState === 'suggesting' && (
                    <div 
                      className="absolute z-50 left-[90%] w-72 sm:w-80 bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-blue-100 p-0 overflow-hidden animate-in zoom-in-95 duration-200"
                      style={{ top: `${(8 - START_HOUR) * HOUR_HEIGHT + 20}px` }}
                    >
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3 flex items-center gap-2 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-xl backdrop-blur-sm shadow-inner relative z-10">🦉</div>
                        <span className="font-bold text-white text-sm relative z-10 tracking-wide">CoachAI Mentor</span>
                      </div>
                      
                      <div className="p-4 space-y-4">
                        <p className="text-[13px] text-gray-700 leading-relaxed">
                          Chào <strong>Quoc Anh</strong>! Mình thấy bạn định dành 4 tiếng liên tục cho nghiên cứu MER. Theo khoa học, não bộ sẽ bắt đầu <em>"đình công"</em> sau 90 phút tập trung sâu đấy.
                        </p>
                        
                        <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100">
                          <p className="text-xs text-blue-900 leading-relaxed flex items-start gap-2">
                            <Brain size={16} className="text-blue-500 shrink-0 mt-0.5" />
                            <span>Bạn có muốn thử <strong>phương pháp Pomodoro</strong> không? Chúng ta sẽ chia 4 tiếng này thành các phiên làm việc 25 phút và nghỉ 5 phút. Cách này giúp não không bị "cháy".</span>
                          </p>
                        </div>
                        
                        <p className="text-[13px] font-medium text-gray-700">Bạn có muốn mình tự động chia nhỏ lịch trình này không?</p>
                        
                        <div className="flex flex-col gap-2 pt-2">
                          <button 
                            onClick={applyPomodoro}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-md shadow-blue-200 active:scale-95"
                          >
                            Áp dụng ngay 🚀
                          </button>
                          <button 
                            onClick={() => setCoachState('idle')}
                            className="w-full bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 font-medium py-2 rounded-xl text-sm transition-colors"
                          >
                            Để mình tự làm
                          </button>
                        </div>
                      </div>
                      
                      {/* Left arrow pointer */}
                      <div className="absolute top-6 -left-2 w-4 h-4 bg-blue-500 transform rotate-45"></div>
                    </div>
                  )}
                  
                  {/* Processing Overlay over the specific block */}
                  {day === "Mon" && coachState === 'processing' && hasMERTask && (
                    <div 
                      className="absolute inset-x-1 z-40 bg-white/80 backdrop-blur-sm rounded-lg border-2 border-indigo-400 border-dashed flex items-center justify-center flex-col gap-2"
                      style={{ top: `${(8 - START_HOUR) * HOUR_HEIGHT}px`, height: `${4 * HOUR_HEIGHT}px` }}
                    >
                      <div className="flex gap-1.5 items-center">
                        <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"></div>
                      </div>
                      <span className="text-xs font-bold text-indigo-600 tracking-wide uppercase">AI đang chia block...</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onSave={handleSaveEvent}
          onDelete={deleteEvent}
        />
      )}
      {showAddModal && (
        <EventModal
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveEvent}
        />
      )}
    </div>
  );
}
