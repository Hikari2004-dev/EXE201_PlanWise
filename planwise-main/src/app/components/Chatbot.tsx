import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { CalendarPlus, ChevronDown, GripVertical, Send, Sparkles, X } from "lucide-react";
import { useData } from "../context/DataContext";

type Message = {
  id: string;
  sender: "ai" | "user";
  text: string;
  isTyping?: boolean;
};

type Position = {
  x: number;
  y: number;
};

const BUTTON_SIZE = 56;
const DEFAULT_MARGIN = 24;
const AUTO_FILL_AVATAR = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%234f46e5'/%3E%3Cstop offset='50%25' stop-color='%237c3aed'/%3E%3Cstop offset='100%25' stop-color='%230ea5e9'/%3E%3C/linearGradient%3E%3ClinearGradient id='wing' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f59e0b'/%3E%3Cstop offset='100%25' stop-color='%23f97316'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='48' cy='48' r='46' fill='url(%23g)'/%3E%3Ccircle cx='48' cy='48' r='32' fill='%23ffffff' fill-opacity='.96'/%3E%3Cpath d='M30 37c0-10 8-18 18-18s18 8 18 18v20c0 6-5 11-11 11H41c-6 0-11-5-11-11V37Z' fill='%23f8fafc'/%3E%3Cpath d='M37 33c-2-6-8-10-14-10 2 7 3 10 10 14M59 33c2-6 8-10 14-10-2 7-3 10-10 14' fill='url(%23wing)'/%3E%3Ccircle cx='41' cy='45' r='8' fill='%231e293b'/%3E%3Ccircle cx='55' cy='45' r='8' fill='%231e293b'/%3E%3Ccircle cx='41' cy='45' r='4.2' fill='%23fbbf24'/%3E%3Ccircle cx='55' cy='45' r='4.2' fill='%23fbbf24'/%3E%3Ccircle cx='41' cy='45' r='1.7' fill='%230f172a'/%3E%3Ccircle cx='55' cy='45' r='1.7' fill='%230f172a'/%3E%3Cpath d='M48 48l-5 6h10l-5-6Z' fill='%23f97316'/%3E%3Cpath d='M38 60c3 3 6 4 10 4s7-1 10-4' stroke='%23334155' stroke-width='3.2' stroke-linecap='round' fill='none'/%3E%3Cpath d='M24 68c6-6 15-10 24-10s18 4 24 10' stroke='%2393c5fd' stroke-width='4' stroke-linecap='round' fill='none' opacity='.9'/%3E%3Crect x='44' y='11' width='8' height='10' rx='4' fill='%2338bdf8'/%3E%3Ccircle cx='71' cy='25' r='6' fill='%23facc15'/%3E%3Cpath d='M71 21v4h4' stroke='%231e3a8a' stroke-width='2.5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E";

const getMessageForPath = (path: string) => {
  if (path === "/") return "Coach giúp bạn nhập nhanh kế hoạch hằng ngày. Chỉ cần gõ tự nhiên, mình sẽ thêm task hoặc lịch để bảng điều khiển cập nhật ngay.";
  if (path === "/goals") return "Bạn có thể nhập kiểu: 'Nhắc mình hoàn thành milestone IELTS tuần này', mình sẽ giúp thêm việc liên quan.";
  if (path === "/habits") return "Bạn có thể nhập việc hoặc lịch mới ngay tại đây, không cần rời khỏi màn hình thói quen.";
  if (path === "/timetable") return "Hãy thử nhập một câu như 'Mai 9h họp team ở phòng A', mình sẽ tự thêm vào lịch.";
  if (path === "/calendar") return "Bạn có thể nhập sự kiện mới bằng ngôn ngữ tự nhiên, mình sẽ tự cập nhật calendar.";
  if (path === "/tasks") return "Đây là cách nhanh nhất để thêm task: chỉ cần gõ nội dung như đang nhắn tin.";
  return "Coach sẵn sàng hỗ trợ bạn thêm công việc hoặc lịch chỉ bằng một câu nhập tự nhiên.";
};

function clampPosition(position: Position) {
  if (typeof window === "undefined") return position;
  return {
    x: Math.min(Math.max(12, position.x), window.innerWidth - BUTTON_SIZE - 12),
    y: Math.min(Math.max(12, position.y), window.innerHeight - BUTTON_SIZE - 12),
  };
}

export function Chatbot() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addEvent, addTask } = useData();

  const [isOpen, setIsOpen] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);
  const welcomePathRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPosition({
      x: window.innerWidth - BUTTON_SIZE - DEFAULT_MARGIN,
      y: window.innerHeight - BUTTON_SIZE - DEFAULT_MARGIN,
    });
  }, []);

  useEffect(() => {
    const handleResize = () => setPosition((prev) => clampPosition(prev));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const welcomeText = getMessageForPath(location.pathname);
    if (welcomePathRef.current === location.pathname) return;
    welcomePathRef.current = location.pathname;

    const newMsgId = `${Date.now()}_welcome`;
    setMessages((prev) => [...prev, { id: newMsgId, sender: "ai", text: "", isTyping: true }]);

    const timer = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === newMsgId ? { ...m, text: welcomeText, isTyping: false } : m))
      );
    }, 450);

    return () => clearTimeout(timer);
  }, [isOpen, location.pathname]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (typeof window === "undefined") return;
    setIsDragging(true);
    hasMovedRef.current = false;
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    hasMovedRef.current = true;
    setPosition(
      clampPosition({
        x: e.clientX - dragOffsetRef.current.x,
        y: e.clientY - dragOffsetRef.current.y,
      })
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (isDragging) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
  };

  const handleButtonClick = () => {
    if (hasMovedRef.current) {
      hasMovedRef.current = false;
      return;
    }
    setIsOpen((prev) => !prev);
    setShowHint(true);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    const lowerText = userText.toLowerCase();
    setInputValue("");
    setMessages((prev) => [...prev, { id: `${Date.now()}_user`, sender: "user", text: userText }]);

    const aiMsgId = `${Date.now()}_ai`;
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: aiMsgId, sender: "ai", text: "", isTyping: true }]);

      setTimeout(() => {
        let aiResponse = "Mình đã đọc xong. Bạn có thể nhập kiểu 'Mai 9h họp team' hoặc 'Nhắc mình nộp báo cáo ngày mai'.";

        const looksLikeSchedule =
          lowerText.includes("họp") ||
          lowerText.includes("lịch") ||
          lowerText.includes("mai") ||
          lowerText.includes("lúc") ||
          lowerText.includes("sáng") ||
          lowerText.includes("chiều") ||
          lowerText.includes("tối") ||
          lowerText.includes("khám");

        const looksLikeTask =
          lowerText.includes("task") ||
          lowerText.includes("việc") ||
          lowerText.includes("cần làm") ||
          lowerText.includes("deadline") ||
          lowerText.includes("nhắc") ||
          lowerText.includes("báo cáo") ||
          lowerText.includes("portfolio");

        if (looksLikeTask) {
          const title = lowerText.includes("báo cáo")
            ? "Nộp báo cáo cuối ngày"
            : lowerText.includes("portfolio")
            ? "Cập nhật portfolio"
            : "Công việc mới từ điền tự động";
          const dueDate = lowerText.includes("mai") ? "13 Th3" : "14 Th3";
          const priority = lowerText.includes("gấp") || lowerText.includes("deadline") ? "Cao" : "Trung bình";

          addTask({
            title,
            categoryId: 1,
            dueDate,
            priority,
            completed: false,
            color: "indigo",
            description: `Tạo tự động từ nội dung: "${userText}"`,
          });

          aiResponse =
            "Mình đã tự thêm task vào hệ thống.\n\n" +
            `✓ **Công việc:** ${title}\n` +
            `📅 **Hạn:** ${dueDate}\n` +
            `🔥 **Ưu tiên:** ${priority}\n\n` +
            "Mở `Công việc` để thấy task mới xuất hiện.";

          if (location.pathname !== "/tasks") {
            setTimeout(() => navigate("/tasks"), 1800);
          }
        } else if (looksLikeSchedule) {
          const title = lowerText.includes("khám")
            ? "Lịch khám răng (Automated by AI)"
            : lowerText.includes("họp")
            ? "Họp nhóm dự án (Automated by AI)"
            : "Sự kiện mới từ điền tự động";
          const startHour = lowerText.includes("14h") || lowerText.includes("2h chiều") ? 14 : lowerText.includes("4h") ? 16 : 9;

          addEvent({
            title,
            day: lowerText.includes("mai") ? "Fri" : "Thu",
            startHour,
            startMin: 0,
            duration: 1,
            color: "blue",
            location: lowerText.includes("cafe") ? "Quán cafe" : lowerText.includes("phòng") ? "Phòng họp A" : "Đã thêm từ nút điền tự động",
            notes: `Tạo tự động từ nội dung: "${userText}"`,
            categoryId: 2,
          });

          aiResponse =
            "Mình đã tự thêm sự kiện vào lịch cho bạn rồi.\n\n" +
            `📌 **Sự kiện:** ${title}\n` +
            `🕒 **Thời gian:** ${String(startHour).padStart(2, "0")}:00 ${lowerText.includes("mai") ? "ngày mai" : "hôm nay"}\n` +
            "📍 **Trạng thái:** Calendar đã được cập nhật mock.\n\n" +
            "Mở `Lịch làm việc` để xem ngay thay đổi.";

          if (location.pathname !== "/timetable") {
            setTimeout(() => navigate("/timetable"), 1800);
          }
        }

        setMessages((prev) => prev.map((m) => (m.id === aiMsgId ? { ...m, text: aiResponse, isTyping: false } : m)));
      }, 900);
    }, 250);
  };

  const panelLeft = Math.max(16, Math.min(position.x - 324, window.innerWidth - 396));
  const panelTop = Math.max(16, position.y - 430);
  const hintLeft = Math.max(16, Math.min(position.x - 260, window.innerWidth - 300));
  const hintTop = Math.max(16, position.y - 4);

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {!isOpen && showHint && (
        <div
          className="pointer-events-auto absolute w-[260px] rounded-2xl border border-indigo-100 bg-white/95 p-3 shadow-[0_16px_40px_-18px_rgba(79,70,229,0.45)] backdrop-blur"
          style={{ left: hintLeft, top: hintTop }}
        >
          <div className="flex items-start gap-2">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <img src={AUTO_FILL_AVATAR} alt="Coach assistant" className="h-6 w-6 object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">Coach</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Nhập như đang nhắn tin, Coach sẽ giúp bạn thêm task hoặc lịch nhanh hơn. Bạn cũng có thể kéo nút này đến vị trí thuận mắt.
              </p>
            </div>
            <button
              onClick={() => setShowHint(false)}
              className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          onClick={handleButtonClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="pointer-events-auto absolute flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 via-violet-500 to-pink-500 text-white shadow-[0_18px_40px_-12px_rgba(99,102,241,0.65)] transition-transform hover:scale-105 active:scale-95"
          style={{ left: position.x, top: position.y, cursor: isDragging ? "grabbing" : "grab" }}
          aria-label="Mở Coach"
          title="Coach hỗ trợ thêm task hoặc lịch"
        >
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-rose-500" />
          <img src={AUTO_FILL_AVATAR} alt="Coach assistant" className="h-9 w-9 object-contain" />
          <span className="absolute -bottom-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 backdrop-blur">
            <GripVertical size={11} />
          </span>
        </button>
      )}

      {isOpen && (
        <div
          className="pointer-events-auto absolute flex h-[500px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-[0_18px_60px_-15px_rgba(15,23,42,0.35)]"
          style={{ left: panelLeft, top: panelTop }}
        >
          <div className="relative flex items-center justify-between overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 p-4 shadow-sm">
            <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white shadow-inner backdrop-blur-sm">
                <img src={AUTO_FILL_AVATAR} alt="Coach assistant" className="h-7 w-7 object-contain" />
              </div>
              <div>
                <h3 className="flex items-center gap-1.5 text-sm font-bold leading-tight text-white">
                  Coach
                  <span className="rounded-full border border-white/20 bg-white/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider">Planner AI</span>
                </h3>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-indigo-100">
                  <span className="block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Gõ một câu, Coach sẽ cập nhật planner cho bạn
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="relative z-10 rounded-full bg-white/10 p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            >
              <ChevronDown size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50/50 p-4">
            {messages.length < 2 && (
              <div className="mx-auto flex max-w-[92%] items-start gap-2 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-700 shadow-sm">
                <CalendarPlus size={20} className="mt-0.5 shrink-0 text-indigo-500" />
                <p>
                  Thử nhắn:
                  <strong> "Mai 9h họp team ở phòng A"</strong>
                  {" "}hoặc
                  <strong> "Nhắc mình nộp báo cáo ngày mai"</strong>
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                {msg.sender === "ai" && (
                  <div className="mr-2.5 mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 text-white shadow-sm">
                    <img src={AUTO_FILL_AVATAR} alt="Coach assistant" className="h-5 w-5 object-contain" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 text-[13px] shadow ${
                    msg.sender === "user"
                      ? "rounded-2xl rounded-tr-sm bg-indigo-600 text-white"
                      : "rounded-2xl rounded-tl-sm border border-gray-100 bg-white text-gray-700 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)]"
                  }`}
                >
                  {msg.isTyping ? (
                    <div className="flex h-5 items-center gap-1.5 px-1">
                      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-300 [animation-delay:-0.3s]" />
                      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-300 [animation-delay:-0.15s]" />
                      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-300" />
                    </div>
                  ) : (
                    <div className="space-y-2 whitespace-pre-wrap leading-relaxed">
                      {msg.text.split("\n").map((line, i) => {
                        if (line.includes("**")) {
                          const parts = line.split("**");
                          return (
                            <p key={i}>
                              {parts.map((part, j) =>
                                j % 2 === 1 ? (
                                  <strong key={j} className="font-bold text-indigo-700">
                                    {part}
                                  </strong>
                                ) : (
                                  part
                                )
                              )}
                            </p>
                          );
                        }
                        return <p key={i}>{line}</p>;
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 border-t border-gray-100 bg-white p-3">
            <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
              <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 transition-all focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Ví dụ: Mai 9h họp team hoặc nhắc mình nộp báo cáo"
                  title="Nhập nội dung để Coach tự thêm công việc hoặc lịch phù hợp"
                  className="min-h-[40px] max-h-[100px] flex-1 resize-none border-none bg-transparent py-1 text-sm placeholder:text-gray-400 focus:outline-none"
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md shadow-indigo-200 transition-colors hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
                >
                  <Send size={14} className={inputValue.trim() ? "ml-0.5" : ""} />
                </button>
              </div>
              <div className="flex items-center justify-center gap-1 text-center text-[10px] text-gray-400">
                <Sparkles size={10} className="text-yellow-400" />
                Coach sẽ đọc câu bạn nhập và tự thêm task hoặc lịch phù hợp
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
