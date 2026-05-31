export type EventColor = "indigo" | "blue" | "emerald" | "amber" | "rose" | "purple" | "teal" | "orange";

export interface Category {
  id: number;
  name: string;
  color: EventColor;
}

export interface CalendarEvent {
  id: number;
  title: string;
  day: string;
  startHour: number;
  startMin: number;
  duration: number;
  color: EventColor;
  location: string;
  notes: string;
  categoryId: number;
}

export interface Task {
  id: number;
  title: string;
  categoryId: number;
  dueDate: string;
  priority: "Cao" | "Trung bình" | "Thấp";
  completed: boolean;
  color: EventColor;
  description: string;
  eisenhowerMatrix?: "urgent-important" | "not-urgent-important" | "urgent-not-important" | "not-urgent-not-important";
  context?: string[];
  estimatedTime?: number; // minutes
}

// Tầng 1: Chiến lược
export interface Goal {
  id: number;
  title: string;
  description: string;
  category: "career" | "learning" | "health" | "finance";
  type: "SMART" | "OKR";
  targetDate: string;
  progress: number; // 0-100
  milestones: Milestone[];
  color: EventColor;
}

export interface Milestone {
  id: number;
  title: string;
  targetDate: string;
  completed: boolean;
  description: string;
}

export interface VisionItem {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  quote?: string;
  category: string;
}

// Tầng 2: Kế hoạch
export interface Habit {
  id: number;
  title: string;
  description: string;
  frequency: "daily" | "weekly" | "monthly";
  targetCount: number;
  currentStreak: number;
  bestStreak: number;
  color: EventColor;
  completedDates: string[];
}

// Tầng 3: Thực thi
export interface DailyFocus {
  id: number;
  date: string;
  topTasks: number[]; // task IDs
  focusSessions: FocusSession[];
  quickNotes: QuickNote[];
}

export interface FocusSession {
  id: number;
  taskId?: number;
  startTime: string;
  duration: number; // minutes
  type: "pomodoro" | "flowtime";
  completed: boolean;
}

export interface QuickNote {
  id: number;
  content: string;
  timestamp: string;
  type: "text" | "voice" | "image";
}

// Tầng 4: Đánh giá
export interface DailyReflection {
  id: number;
  date: string;
  completed: string;
  obstacles: string;
  improvements: string;
  energyLevel: number; // 1-10
  mood: "great" | "good" | "okay" | "bad" | "terrible";
}

export const COLOR_MAP: Record<
  EventColor,
  { bg: string; light: string; border: string; text: string; badge: string; dot: string; ring: string }
> = {
  indigo: {
    bg: "bg-indigo-500",
    light: "bg-indigo-50",
    border: "border-l-indigo-500",
    text: "text-indigo-700",
    badge: "bg-indigo-100 text-indigo-700",
    dot: "bg-indigo-500",
    ring: "ring-indigo-300",
  },
  blue: {
    bg: "bg-blue-500",
    light: "bg-blue-50",
    border: "border-l-blue-500",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
    ring: "ring-blue-300",
  },
  emerald: {
    bg: "bg-emerald-500",
    light: "bg-emerald-50",
    border: "border-l-emerald-500",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
    ring: "ring-emerald-300",
  },
  amber: {
    bg: "bg-amber-500",
    light: "bg-amber-50",
    border: "border-l-amber-500",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
    ring: "ring-amber-300",
  },
  rose: {
    bg: "bg-rose-500",
    light: "bg-rose-50",
    border: "border-l-rose-500",
    text: "text-rose-700",
    badge: "bg-rose-100 text-rose-700",
    dot: "bg-rose-500",
    ring: "ring-rose-300",
  },
  purple: {
    bg: "bg-purple-500",
    light: "bg-purple-50",
    border: "border-l-purple-500",
    text: "text-purple-700",
    badge: "bg-purple-100 text-purple-700",
    dot: "bg-purple-500",
    ring: "ring-purple-300",
  },
  teal: {
    bg: "bg-teal-500",
    light: "bg-teal-50",
    border: "border-l-teal-500",
    text: "text-teal-700",
    badge: "bg-teal-100 text-teal-700",
    dot: "bg-teal-500",
    ring: "ring-teal-300",
  },
  orange: {
    bg: "bg-orange-500",
    light: "bg-orange-50",
    border: "border-l-orange-500",
    text: "text-orange-700",
    badge: "bg-orange-100 text-orange-700",
    dot: "bg-orange-500",
    ring: "ring-orange-300",
  },
};

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DAY_DATES = [9, 10, 11, 12, 13, 14, 15]; // March 2026
export const TODAY_INDEX = 3; // Thursday, March 12
export const DAYS_VI = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export const getTimeString = (startHour: number, startMin: number, duration: number) => {
  const endDecimal = startHour + startMin / 60 + duration;
  const endHour = Math.floor(endDecimal);
  const endMin = Math.round((endDecimal - endHour) * 60);
  const startPeriod = startHour >= 12 ? "PM" : "AM";
  const endPeriod = endHour >= 12 ? "PM" : "AM";
  const startDisplay = startHour > 12 ? startHour - 12 : startHour;
  const endDisplay = endHour > 12 ? endHour - 12 : endHour;
  return `${startDisplay}:${String(startMin).padStart(2, "0")} ${startPeriod} – ${endDisplay}:${String(endMin).padStart(2, "0")} ${endPeriod}`;
};

export const EVENTS: CalendarEvent[] = [
  { id: 99, title: "Nghiên cứu kiến trúc Multimodal Emotion Recognition (MER) cho Đồ án", day: "Mon", startHour: 8, startMin: 0, duration: 4, color: "rose", location: "Tại nhà", notes: "4 tiếng liên tục", categoryId: 2 },
  { id: 1, title: "Họp team", day: "Mon", startHour: 13, startMin: 0, duration: 1.5, color: "indigo", location: "Phòng họp A", notes: "Thảo luận kế hoạch tuần mới", categoryId: 1 },
  { id: 2, title: "Tập yoga", day: "Mon", startHour: 18, startMin: 0, duration: 1, color: "emerald", location: "Phòng gym", notes: "Lớp yoga cơ bản", categoryId: 3 },
  { id: 3, title: "Gọi điện khách hàng", day: "Tue", startHour: 10, startMin: 0, duration: 0.5, color: "indigo", location: "Văn phòng", notes: "Tư vấn dự án mới", categoryId: 1 },
  { id: 4, title: "Học tiếng Anh", day: "Tue", startHour: 19, startMin: 0, duration: 1.5, color: "purple", location: "Trung tâm anh ngữ", notes: "Lớp giao tiếp nâng cao", categoryId: 4 },
  { id: 5, title: "Code review", day: "Wed", startHour: 14, startMin: 0, duration: 2, color: "blue", location: "Online", notes: "Review dự án website", categoryId: 2 },
  { id: 6, title: "Chạy bộ", day: "Thu", startHour: 6, startMin: 30, duration: 1, color: "emerald", location: "Công viên", notes: "Chạy 5km", categoryId: 3 },
  { id: 7, title: "Họp phụ huynh", day: "Thu", startHour: 16, startMin: 0, duration: 1, color: "rose", location: "Trường học", notes: "Họp giáo viên chủ nhiệm", categoryId: 5 },
  { id: 8, title: "Làm việc dự án", day: "Fri", startHour: 9, startMin: 0, duration: 3, color: "blue", location: "Nhà", notes: "Phát triển tính năng mới", categoryId: 2 },
  { id: 9, title: "Ăn tối gia đình", day: "Fri", startHour: 19, startMin: 0, duration: 2, color: "rose", location: "Nhà hàng", notes: "Kỷ niệm sinh nhật", categoryId: 5 },
  { id: 10, title: "Kiểm tra ngân sách", day: "Sat", startHour: 10, startMin: 0, duration: 1, color: "amber", location: "Nhà", notes: "Review chi tiêu tháng", categoryId: 6 },
];

export const TASKS: Task[] = [
  { id: 1, title: "Hoàn thành báo cáo tuần", categoryId: 1, dueDate: "14 Th3", priority: "Cao", completed: false, color: "indigo", description: "Tổng hợp kết quả công việc tuần này", eisenhowerMatrix: "urgent-important", context: ["Tại máy tính"], estimatedTime: 120 },
  { id: 2, title: "Cập nhật portfolio", categoryId: 2, dueDate: "18 Th3", priority: "Trung bình", completed: false, color: "blue", description: "Thêm 3 dự án mới vào portfolio", eisenhowerMatrix: "not-urgent-important", context: ["Tại máy tính", "Tập trung sâu"], estimatedTime: 180 },
  { id: 3, title: "Đặt lịch khám răng", categoryId: 3, dueDate: "15 Th3", priority: "Cao", completed: false, color: "emerald", description: "Khám định kỳ 6 tháng", eisenhowerMatrix: "urgent-not-important", context: ["Di chuyển"], estimatedTime: 15 },
  { id: 4, title: "Nộp bài tập lập trình", categoryId: 4, dueDate: "12 Th3", priority: "Cao", completed: true, color: "purple", description: "Bài tập về React và TypeScript", eisenhowerMatrix: "urgent-important", context: ["Tại máy tính"], estimatedTime: 240 },
  { id: 5, title: "Mua quà sinh nhật", categoryId: 5, dueDate: "20 Th3", priority: "Trung bình", completed: false, color: "rose", description: "Sinh nhật mẹ", eisenhowerMatrix: "not-urgent-not-important", context: ["Di chuyển"], estimatedTime: 60 },
  { id: 6, title: "Thanh toán hóa đơn điện", categoryId: 6, dueDate: "16 Th3", priority: "Cao", completed: false, color: "amber", description: "Hạn cuối ngày 16", eisenhowerMatrix: "urgent-not-important", context: ["Tại máy tính"], estimatedTime: 10 },
  { id: 7, title: "Đọc sách kỹ năng mềm", categoryId: 4, dueDate: "25 Th3", priority: "Thấp", completed: false, color: "purple", description: "Đọc 50 trang", eisenhowerMatrix: "not-urgent-important", context: ["Tập trung sâu"], estimatedTime: 90 },
  { id: 8, title: "Gửi email khách hàng", categoryId: 1, dueDate: "13 Th3", priority: "Trung bình", completed: true, color: "indigo", description: "Gửi báo giá dự án", eisenhowerMatrix: "urgent-important", context: ["Tại máy tính"], estimatedTime: 30 },
  { id: 9, title: "Lên dàn bài thuyết trình", categoryId: 2, dueDate: "10 Th3", priority: "Cao", completed: false, color: "orange", description: "Deadline bị lỡ 2 ngày", eisenhowerMatrix: "urgent-important", context: ["Tại máy tính"], estimatedTime: 120 },
  { id: 10, title: "Gia hạn dịch vụ tên miền", categoryId: 1, dueDate: "05 Th3", priority: "Cao", completed: false, color: "rose", description: "Bị khóa dịch vụ", eisenhowerMatrix: "urgent-important", context: ["Tại máy tính"], estimatedTime: 15 },
  { id: 11, title: "Sắp xếp lại tủ sách", categoryId: 5, dueDate: "01 Th3", priority: "Thấp", completed: false, color: "teal", description: "Mục tiêu bị bỏ ngỏ quá lâu", eisenhowerMatrix: "not-urgent-not-important", context: ["Nhà"], estimatedTime: 60 }
];

// Mock data cho các tính năng mới
export const GOALS: Goal[] = [
  {
    id: 1,
    title: "Đạt IELTS 7.0",
    description: "Cải thiện tiếng Anh để du học",
    category: "learning",
    type: "SMART",
    targetDate: "2026-12-31",
    progress: 35,
    color: "purple",
    milestones: [
      { id: 1, title: "Hoàn thành khóa Grammar", targetDate: "2026-06-30", completed: true, description: "Nắm vững ngữ pháp cơ bản" },
      { id: 2, title: "Đạt 6.0 trong bài test thử", targetDate: "2026-09-30", completed: false, description: "Kiểm tra trình độ hiện tại" },
      { id: 3, title: "Thi thật đạt 7.0", targetDate: "2026-12-31", completed: false, description: "Mục tiêu cuối cùng" }
    ]
  },
  {
    id: 2,
    title: "Tiết kiệm 100 triệu",
    description: "Dành tiền mua nhà",
    category: "finance",
    type: "SMART",
    targetDate: "2027-12-31",
    progress: 20,
    color: "amber",
    milestones: [
      { id: 4, title: "Tiết kiệm 25 triệu", targetDate: "2026-06-30", completed: false, description: "Quý 1-2" },
      { id: 5, title: "Tiết kiệm 50 triệu", targetDate: "2026-12-31", completed: false, description: "Nửa đầu năm" },
      { id: 6, title: "Tiết kiệm 100 triệu", targetDate: "2027-12-31", completed: false, description: "Hoàn thành mục tiêu" }
    ]
  }
];

export const VISION_ITEMS: VisionItem[] = [
  { id: 1, title: "Thành công trong sự nghiệp", description: "Trở thành Senior Developer", quote: "Success is not final, failure is not fatal", category: "career" },
  { id: 2, title: "Sức khỏe tốt", description: "Duy trì thể hình lý tưởng", quote: "Health is wealth", category: "health" },
];

export const HABITS: Habit[] = [
  { id: 1, title: "Đọc sách", description: "Đọc ít nhất 30 phút mỗi ngày", frequency: "daily", targetCount: 1, currentStreak: 5, bestStreak: 12, color: "purple", completedDates: ["2026-03-10", "2026-03-11", "2026-03-12", "2026-03-13", "2026-03-14"] },
  { id: 2, title: "Tập thể dục", description: "Workout 45 phút", frequency: "daily", targetCount: 1, currentStreak: 3, bestStreak: 8, color: "emerald", completedDates: ["2026-03-12", "2026-03-13", "2026-03-14"] },
  { id: 3, title: "Code cá nhân", description: "Làm dự án side project", frequency: "daily", targetCount: 1, currentStreak: 2, bestStreak: 15, color: "blue", completedDates: ["2026-03-13", "2026-03-14"] },
];

export const DAILY_FOCUS: DailyFocus[] = [
  {
    id: 1,
    date: "2026-03-15",
    topTasks: [1, 3, 6],
    focusSessions: [
      { id: 1, taskId: 1, startTime: "09:00", duration: 25, type: "pomodoro", completed: true },
      { id: 2, taskId: 1, startTime: "09:30", duration: 25, type: "pomodoro", completed: false }
    ],
    quickNotes: [
      { id: 1, content: "Nhớ gọi khách hàng ABC", timestamp: "2026-03-15T10:30:00", type: "text" },
      { id: 2, content: "Ý tưởng cho feature mới", timestamp: "2026-03-15T14:15:00", type: "text" }
    ]
  }
];

export const DAILY_REFLECTIONS: DailyReflection[] = [
  {
    id: 1,
    date: "2026-03-14",
    completed: "Hoàn thành báo cáo, học tiếng Anh 1 tiếng",
    obstacles: "Bị phân tâm bởi social media",
    improvements: "Tắt thông báo khi làm việc",
    energyLevel: 7,
    mood: "good"
  }
];

export const CATEGORIES: Category[] = [
  { id: 1, name: "Công việc", color: "indigo" },
  { id: 2, name: "Dự án cá nhân", color: "blue" },
  { id: 3, name: "Sức khỏe", color: "emerald" },
  { id: 4, name: "Học tập", color: "purple" },
  { id: 5, name: "Gia đình", color: "rose" },
  { id: 6, name: "Tài chính", color: "amber" },
];