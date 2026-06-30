import { API_BASE_URL, useAuth } from "../context/AuthContext";

// Generic fetch helper with auth
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  auth: ReturnType<typeof useAuth> | null = null
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  let token: string | null = null;
  if (auth) {
    token = localStorage.getItem("accessToken");
  } else {
    token = localStorage.getItem("accessToken");
  }

  if (token) {
    (headers as Record<string, string>)["Authorization"] = "Bearer " + token;
  }

  const response = await fetch(API_BASE_URL + path, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Handle 401 - try refresh
    if (response.status === 401 && auth) {
      const refresh = localStorage.getItem("refreshToken");
      if (refresh) {
        const refreshed = await auth.handleRefreshToken?.(refresh);
        if (refreshed) {
          (headers as Record<string, string>)["Authorization"] = "Bearer " + refreshed;
          const retryResponse = await fetch(API_BASE_URL + path, {
            ...options,
            headers,
          });
          if (!retryResponse.ok) {
            const error = await retryResponse.json().catch(() => ({ message: "Request failed" }));
            throw new Error(error.message || "HTTP " + retryResponse.status);
          }
          return retryResponse.json();
        }
      }
    }
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "HTTP " + response.status);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

// Re-export types from mockData for now
export type {
  Category,
  CalendarEvent,
  Task,
  Goal,
  Milestone,
  Habit,
  DailyFocus,
  FocusSession,
  QuickNote,
  DailyReflection,
  EventColor,
} from "../data/mockData";

export type GoalDraftStatus = "CREATED" | "APPROVED" | "REJECTED" | "EXPIRED";

export interface GenerateGoalDraftRequest {
  title: string;
  description?: string;
  categoryId: string;
  categoryName?: string;
  deadline?: string;
  period: "week" | "month" | "year";
  targetDate?: string;
  priority?: "HIGH" | "MEDIUM" | "LOW";
  constraints?: string[];
  availableHoursPerWeek?: number;
}

export interface GoalTaskDraft {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: "HIGH" | "MEDIUM" | "LOW";
  estimatedHours?: number;
}

export interface GoalMilestoneDraft {
  title: string;
  description?: string;
  targetDate?: string;
  tasks?: GoalTaskDraft[];
}

export interface GoalRoadmapDraft {
  title: string;
  summary?: string;
  description?: string;
  categoryId: string;
  period: "week" | "month" | "year";
  targetDate?: string;
  priority?: "HIGH" | "MEDIUM" | "LOW";
  milestones?: GoalMilestoneDraft[];
}

export interface GoalDraftResponse {
  id: string;
  status: GoalDraftStatus;
  roadmap: GoalRoadmapDraft;
  createdAt: string;
}

export interface CreateGoalFromDraftRequest {
  draftId: string;
  roadmap?: GoalRoadmapDraft;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  dueDate?: string;
  scheduledAt?: string;
  priority?: string;
  color?: string;
  categoryId?: string;
  goalId?: string;
  milestoneId?: string;
  eisenhowerMatrix?: string;
  status?: string;
  estimatedTime?: number;
  completed?: boolean;
  contexts?: string[];
  checklist?: string[];
  showOnCalendar?: boolean;
  sortOrder?: number;
}

export interface ApiTask {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  scheduledAt?: string;
  priority: string;
  color: string;
  status?: string;
  completed: boolean;
  completedAt?: string;
  eisenhowerMatrix?: string;
  estimatedTime?: number;
  actualTime?: number;
  contexts?: string[];
  checklist?: string[];
  categoryId?: string;
  categoryName?: string;
  categoryColor?: string;
  goalId?: string;
  milestoneId?: string;
  showOnCalendar?: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsRequest {
  theme?: string;
  defaultFocusType?: string;
  pomodoroDuration?: number;
  shortBreakDuration?: number;
  longBreakDuration?: number;
  dailyTaskLimit?: number;
  notificationEnabled?: boolean;
  emailDigestEnabled?: boolean;
  emailDigestTime?: string;
  onboardingCompleted?: boolean;
}

export interface ApiUserSettings {
  theme: string;
  defaultFocusType: string;
  pomodoroDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  dailyTaskLimit: number;
  notificationEnabled: boolean;
  emailDigestEnabled: boolean;
  emailDigestTime?: string;
  onboardingCompleted: boolean;
}

export interface UpdateReflectionRequest {
  completed?: string;
  obstacles?: string;
  improvements?: string;
  energyLevel?: number;
  mood?: string;
}

export interface ApiDailyReflection {
  id: string;
  reflectionDate: string;
  completed?: string;
  obstacles?: string;
  improvements?: string;
  energyLevel?: number;
  mood?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateHabitRequest {
  title?: string;
  description?: string;
  frequency?: 'daily' | 'weekly' | 'monthly';
  targetCount?: number;
  repeatDays?: string[];
  color?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface ApiHabit {
  id: string;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  targetCount: number;
  repeatDays?: string[];
  currentStreak: number;
  bestStreak: number;
  color: string;
  isActive: boolean;
  sortOrder: number;
  completedDates?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  category?: 'career' | 'learning' | 'health' | 'finance';
  goalType?: 'SMART' | 'OKR';
  period?: 'week' | 'month' | 'year';
  targetDate?: string;
  progress?: number;
  color?: string;
  isCompleted?: boolean;
}

export interface ApiGoal {
  id: string;
  title: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  categoryColor?: string;
  goalType: 'SMART' | 'OKR';
  period: 'week' | 'month' | 'year';
  targetDate?: string;
  progress: number;
  color: string;
  isCompleted: boolean;
  completedAt?: string;
  sortOrder: number;
  milestones?: ApiMilestone[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiMilestone {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  completed: boolean;
  completedAt?: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateMilestoneRequest {
  title?: string;
  description?: string;
  targetDate?: string;
  completed?: boolean;
}

export interface ApiDailyFocus {
  id: string;
  focusDate: string;
  notes?: string;
  topTaskIds?: string[];
  quickNotes?: ApiQuickNote[];
  focusSessions?: ApiFocusSession[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiFocusSession {
  id: string;
  startTime: string;
  duration: number;
  sessionType: string;
  completed: boolean;
  endTime?: string;
  notes?: string;
  taskId?: string;
  taskTitle?: string;
  createdAt: string;
}

export interface ApiQuickNote {
  id: string;
  content: string;
  noteType: string;
  mediaUrl?: string;
  createdAt: string;
}

export interface UpdateEventRequest {
  title?: string;
  eventDate?: string;
  startHour?: number;
  startMin?: number;
  duration?: number;
  color?: string;
  location?: string;
  notes?: string;
  categoryId?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
}

export interface ApiCalendarEvent {
  id: string;
  title: string;
  eventDate: string;
  startHour: number;
  startMin: number;
  duration: number;
  color: string;
  location?: string;
  notes?: string;
  isRecurring: boolean;
  recurrenceRule?: string;
  categoryId?: string;
  categoryName?: string;
  categoryColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  color?: string;
  sortOrder?: number;
}

export interface ApiCategory {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  dueDate?: string;
  scheduledAt?: string;
  priority?: string;
  color?: string;
  categoryId?: string;
  goalId?: string;
  milestoneId?: string;
  eisenhowerMatrix?: string;
  status?: string;
  estimatedTime?: number;
  contexts?: string[];
  checklist?: string[];
  showOnCalendar?: boolean;
}

export interface MomoIPNRequest {
  partnerCode?: string;
  orderId?: string;
  requestId?: string;
  amount?: number;
  orderInfo?: string;
  orderType?: string;
  transId?: number;
  resultCode?: number;
  message?: string;
  payType?: string;
  responseTime?: number;
  extraData?: string;
  signature?: string;
}

export interface CreateReflectionRequest {
  reflectionDate?: string;
  completed?: string;
  obstacles?: string;
  improvements?: string;
  energyLevel?: number;
  mood?: string;
}

export interface CreateHabitRequest {
  title: string;
  description?: string;
  frequency?: 'daily' | 'weekly' | 'monthly';
  targetCount?: number;
  repeatDays?: string[];
  color?: string;
}

export interface CreateGoalRequest {
  title: string;
  description?: string;
  category?: 'career' | 'learning' | 'health' | 'finance';
  goalType?: 'SMART' | 'OKR';
  period: 'week' | 'month' | 'year';
  targetDate?: string;
  color?: string;
}

export interface CreateMilestoneRequest {
  title: string;
  description?: string;
  targetDate?: string;
}

export interface CreateFocusSessionRequest {
  startTime: string;
  duration?: number;
  sessionType?: string;
  taskId?: string;
  notes?: string;
}

export interface CreateQuickNoteRequest {
  content: string;
  noteType?: string;
  mediaUrl?: string;
}

export interface CreateEventRequest {
  title: string;
  eventDate: string;
  startHour?: number;
  startMin?: number;
  duration?: number;
  color?: string;
  location?: string;
  notes?: string;
  categoryId?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
}

export interface CreateCategoryRequest {
  name: string;
  color?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
}

export interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  user?: UserInfo;
}

export interface UserInfo {
  id?: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  language?: string;
  role?: string;
  isPremium?: boolean;
  premiumExpiresAt?: string;
}

export interface TokenRefreshRequest {
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateNotificationRequest {
  read: boolean;
  dismissed: boolean;
}

export interface ApiNotification {
  id: string;
  type: string;
  tone: string;
  title: string;
  message: string;
  ctaLabel?: string;
  read: boolean;
  dismissed: boolean;
  scheduledFor?: string;
  createdAt: string;
}

export interface TaskListResponse {
  tasks?: ApiTask[];
  totalCount?: number;
  pendingCount?: number;
  completedCount?: number;
  overdueCount?: number;
}

export interface SubscriptionPlan {
  id?: string;
  name?: string;
  price?: number;
  durationMonths?: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HabitListResponse {
  habits?: ApiHabit[];
  totalCount?: number;
  activeCount?: number;
  isPremium?: boolean;
  freeLimit?: number;
}

export interface GoalListResponse {
  goals?: ApiGoal[];
  totalCount?: number;
  weeklyCount?: number;
  monthlyCount?: number;
  yearlyCount?: number;
  isPremium?: boolean;
  freeLimit?: number;
}

export interface CategoryListResponse {
  categories?: ApiCategory[];
  totalCount?: number;
  defaultCount?: number;
  customCount?: number;
  isPremium?: boolean;
  freeLimit?: number;
}

export interface AnalyticsResponse {
  isPremium?: boolean;
  message?: string;
  weeklyProgress?: WeeklyProgressStats;
  energyFluctuations?: EnergyFluctuation[];
  categoryAllocations?: CategoryTimeAllocation[];
  habitStreaks?: HabitStreakData[];
}

export interface CategoryTimeAllocation {
  categoryId?: string;
  categoryName?: string;
  color?: string;
  minutes?: number;
  percentage?: number;
}

export interface EnergyFluctuation {
  date?: string;
  level?: number;
  mood?: string;
}

export interface HabitStreakData {
  habitId?: string;
  title?: string;
  color?: string;
  currentStreak?: number;
  bestStreak?: number;
  completionsThisWeek?: number;
}

export interface WeeklyProgressStats {
  totalTasks?: number;
  completedTasks?: number;
  completionRate?: number;
  totalFocusMinutes?: number;
  averageEnergyLevel?: number;
}


export interface ApiDailyFocusTask {
  id: string;
  title: string;
  priority: string;
  completed: boolean;
}
