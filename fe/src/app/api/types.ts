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
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
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
          (headers as Record<string, string>)["Authorization"] = `Bearer ${refreshed}`;
          const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers,
          });
          if (!retryResponse.ok) {
            const error = await retryResponse.json().catch(() => ({ message: "Request failed" }));
            throw new Error(error.message || `HTTP ${retryResponse.status}`);
          }
          return retryResponse.json();
        }
      }
    }
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${response.status}`);
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
  VisionItem,
  EventColor,
} from "../data/mockData";

// For backward compatibility - these match backend API responses
export interface ApiTask {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: "Cao" | "Trung bình" | "Thấp";
  color: string;
  completed: boolean;
  completedAt?: string;
  eisenhowerMatrix?: string;
  estimatedTime?: number;
  actualTime?: number;
  contexts?: string[];
  categoryId?: string;
  categoryName?: string;
  categoryColor?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface ApiGoal {
  id: string;
  title: string;
  description?: string;
  category: string;
  goalType: string;
  period: string;
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
}

export interface ApiHabit {
  id: string;
  title: string;
  description?: string;
  frequency: string;
  targetCount: number;
  currentStreak: number;
  bestStreak: number;
  color: string;
  isActive: boolean;
  sortOrder: number;
  completedToday?: boolean;
  completionsLast7Days?: number;
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

export interface ApiDailyFocus {
  id: string;
  focusDate: string;
  notes?: string;
  topTasks?: ApiDailyFocusTask[];
  focusSessions?: ApiFocusSession[];
  quickNotes?: ApiQuickNote[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiDailyFocusTask {
  id: string;
  title: string;
  priority: string;
  completed: boolean;
}

export interface ApiQuickNote {
  id: string;
  content: string;
  noteType: string;
  mediaUrl?: string;
  createdAt: string;
  updatedAt: string;
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

export interface ApiVisionItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  quote?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiNotification {
  id: string;
  type: string;
  tone: string;
  title: string;
  message: string;
  ctaLabel?: string;
  taskId?: string;
  habitId?: string;
  goalId?: string;
  eventId?: string;
  isRead: boolean;
  isDismissed: boolean;
  scheduledFor?: string;
  createdAt: string;
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

// Request types
export interface CreateTaskRequest {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: string;
  color?: string;
  eisenhowerMatrix?: string;
  estimatedTime?: number;
  contexts?: string[];
  categoryId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: string;
  color?: string;
  completed?: boolean;
  eisenhowerMatrix?: string;
  estimatedTime?: number;
  contexts?: string[];
  categoryId?: string;
  sortOrder?: number;
}

export interface CreateEventRequest {
  title: string;
  eventDate: string;
  startHour: number;
  startMin?: number;
  duration: number;
  color?: string;
  location?: string;
  notes?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  categoryId?: string;
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
  isRecurring?: boolean;
  recurrenceRule?: string;
  categoryId?: string;
}

export interface CreateGoalRequest {
  title: string;
  description?: string;
  category?: string;
  goalType?: string;
  period?: string;
  targetDate?: string;
  color?: string;
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  category?: string;
  goalType?: string;
  period?: string;
  targetDate?: string;
  progress?: number;
  color?: string;
  isCompleted?: boolean;
}

export interface CreateMilestoneRequest {
  title: string;
  description?: string;
  targetDate?: string;
}

export interface UpdateMilestoneRequest {
  title?: string;
  description?: string;
  targetDate?: string;
  completed?: boolean;
}

export interface CreateHabitRequest {
  title: string;
  description?: string;
  frequency?: string;
  targetCount?: number;
  color?: string;
}

export interface UpdateHabitRequest {
  title?: string;
  description?: string;
  frequency?: string;
  targetCount?: number;
  color?: string;
  isActive?: boolean;
}

export interface CreateReflectionRequest {
  reflectionDate: string;
  completed?: string;
  obstacles?: string;
  improvements?: string;
  energyLevel?: number;
  mood?: string;
}

export interface UpdateReflectionRequest {
  completed?: string;
  obstacles?: string;
  improvements?: string;
  energyLevel?: number;
  mood?: string;
}

export interface CreateVisionItemRequest {
  title: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  quote?: string;
}

export interface UpdateVisionItemRequest {
  title?: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  quote?: string;
  sortOrder?: number;
}

export interface CreateQuickNoteRequest {
  dailyFocusId?: string;
  content: string;
  noteType?: string;
  mediaUrl?: string;
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
