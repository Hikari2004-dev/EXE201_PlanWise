import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  categoryApi,
  taskApi,
  eventApi,
  goalApi,
  habitApi,
  focusApi,
  reflectionApi,
  visionApi,
  notificationApi,
  settingsApi,
  type ApiCategory,
  type ApiTask,
  type ApiCalendarEvent,
  type ApiGoal,
  type ApiHabit,
  type ApiDailyFocus,
  type ApiFocusSession,
  type ApiQuickNote,
  type ApiDailyReflection,
  type ApiVisionItem,
  type ApiNotification,
  type ApiUserSettings,
} from "../api";

// Type for event compatibility with frontend components
interface CalendarEvent {
  id: string;
  title: string;
  day: string;
  startHour: number;
  startMin: number;
  duration: number;
  color: string;
  location: string;
  notes: string;
  categoryId: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  eventDate?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  scheduledAt?: string;
  priority: "Cao" | "Trung bình" | "Thấp";
  status?: "IN_PROGRESS" | "COMPLETED" | "MISSED" | string;
  completed: boolean;
  completedAt?: string;
  color: string;
  eisenhowerMatrix?: string;
  contexts?: string[];
  checklist?: string[];
  estimatedTime?: number;
  actualTime?: number;
  categoryId?: string;
  categoryName?: string;
  categoryColor?: string;
  goalId?: string;
  milestoneId?: string;
  showOnCalendar?: boolean;
  sortOrder: number;
}

function normalizeTaskDueDateForApi(dueDate?: string) {
  if (!dueDate) return undefined;

  const trimmed = dueDate.trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    const localDate = new Date(trimmed);
    return Number.isNaN(localDate.getTime()) ? undefined : localDate.toISOString();
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const localDate = new Date(`${trimmed}T00:00`);
    return Number.isNaN(localDate.getTime()) ? undefined : localDate.toISOString();
  }

  const viMatch = trimmed.match(/^(\d{1,2})\s*Th(\d{1,2})$/i);
  if (viMatch) {
    const day = Number(viMatch[1]);
    const month = Number(viMatch[2]);

    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      const year = new Date().getFullYear();
      return new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00`).toISOString();
    }
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function mapApiTaskToTask(t: ApiTask): Task {
  const priorityMap: Record<string, "Cao" | "Trung bình" | "Thấp"> = {
    "HIGH": "Cao",
    "MEDIUM": "Trung bình",
    "LOW": "Thấp",
    "Cao": "Cao",
    "Trung bình": "Trung bình",
    "Thấp": "Thấp"
  };
  return {
    id: t.id,
    title: t.title,
    description: t.description || "",
    dueDate: t.dueDate || "",
    scheduledAt: t.scheduledAt,
    priority: priorityMap[t.priority] || "Trung bình",
    status: t.status || (t.completed ? "COMPLETED" : "IN_PROGRESS"),
    completed: t.completed,
    completedAt: t.completedAt,
    color: t.color,
    eisenhowerMatrix: t.eisenhowerMatrix ? t.eisenhowerMatrix.replace(/_/g, "-") : undefined,
    contexts: t.contexts,
    checklist: t.checklist,
    estimatedTime: t.estimatedTime,
    actualTime: t.actualTime,
    categoryId: t.categoryId,
    categoryName: t.categoryName,
    categoryColor: t.categoryColor,
    goalId: t.goalId,
    milestoneId: t.milestoneId,
    showOnCalendar: t.showOnCalendar ?? true,
    sortOrder: t.sortOrder,
  };
}

function getDayName(date: Date, lang: string): string {
  const days = lang === "vi"
    ? ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
}

function getStartOfCurrentWeek(): Date {
  const today = new Date();
  const start = new Date(today);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getEventDateFromWeekday(dayCode: string): string {
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const index = weekDays.indexOf(dayCode);
  const baseDate = getStartOfCurrentWeek();
  const targetDate = new Date(baseDate);
  targetDate.setDate(baseDate.getDate() + (index >= 0 ? index : 0));
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, "0");
  const day = String(targetDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mapApiEventToCalendarEvent(event: ApiCalendarEvent): CalendarEvent {
  return {
    id: event.id,
    title: event.title,
    day: getDayName(new Date(event.eventDate), "en"),
    startHour: event.startHour,
    startMin: event.startMin,
    duration: event.duration,
    color: event.color,
    location: event.location || "",
    notes: event.notes || "",
    categoryId: event.categoryId || "",
    isRecurring: event.isRecurring,
    recurrenceRule: event.recurrenceRule,
    eventDate: event.eventDate,
  };
}

interface Goal {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  type: string;
  period: "week" | "month" | "year";
  targetDate: string;
  progress: number;
  color: string;
  milestones: Array<{
    id: string;
    title: string;
    description: string;
    targetDate: string;
    completed: boolean;
  }>;
}

interface CreateGoalInput {
  title: string;
  description?: string;
  categoryId: string;
  type: string;
  period: "week" | "month" | "year";
  targetDate?: string;
  color?: string;
}

interface CreateMilestoneInput {
  title: string;
  description?: string;
  targetDate?: string;
}

interface Habit {
  id: string;
  title: string;
  description: string;
  frequency: "daily" | "weekly" | "monthly";
  targetCount: number;
  repeatDays: string[];
  currentStreak: number;
  bestStreak: number;
  color: string;
  completedDates: string[];
  completedToday?: boolean;
}

interface DailyFocus {
  id: string;
  date: string;
  topTasks: string[];
  focusSessions: ApiFocusSession[];
  quickNotes: ApiQuickNote[];
}

interface DailyReflection {
  id: string;
  date: string;
  completed: string;
  obstacles: string;
  improvements: string;
  energyLevel: number;
  mood: string;
}

interface VisionItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  quote?: string;
  categoryId: string;
  categoryName: string;
  categoryColor?: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Notification {
  id: string;
  type: string;
  tone: string;
  title: string;
  message: string;
  ctaLabel?: string;
  isRead: boolean;
  isDismissed: boolean;
  scheduledFor?: string;
  createdAt: string;
}

function dedupeCategories(categories: Category[]): Category[] {
  const uniqueCategories = new Map<string, Category>();

  categories.forEach((category) => {
    if (!uniqueCategories.has(category.id)) {
      uniqueCategories.set(category.id, category);
    }
  });

  return Array.from(uniqueCategories.values());
}

interface UserSettings {
  theme: string;
  defaultFocusType: string;
  pomodoroDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  dailyTaskLimit: number;
  notificationEnabled: boolean;
  emailDigestEnabled: boolean;
  onboardingCompleted: boolean;
}

interface DataContextType {
  // Data
  categories: Category[];
  events: CalendarEvent[];
  tasks: Task[];
  goals: Goal[];
  habits: Habit[];
  dailyFocus: DailyFocus | null;
  reflections: DailyReflection[];
  visionItems: VisionItem[];
  notifications: Notification[];
  settings: UserSettings | null;
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Language
  language: "vi" | "en";
  setLanguage: (lang: "vi" | "en") => void;
  
  // Category operations
  addCategory: (category: Omit<Category, "id">) => Promise<Category>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Event operations
  addEvent: (event: Omit<CalendarEvent, "id">) => Promise<void>;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  
  // Task operations
  addTask: (task: Omit<Task, "id">) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;
  
  // Goal operations
  addGoal: (goal: CreateGoalInput) => Promise<void>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addMilestone: (goalId: string, milestone: CreateMilestoneInput) => Promise<void>;
  updateMilestone: (goalId: string, milestoneId: string, milestone: { title?: string; description?: string; targetDate?: string; completed?: boolean }) => Promise<void>;
  deleteMilestone: (goalId: string, milestoneId: string) => Promise<void>;

  // Habit operations
  addHabit: (habit: Omit<Habit, "id" | "currentStreak" | "bestStreak" | "completedDates">) => Promise<void>;
  updateHabit: (id: string, habit: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  completeHabitDate: (id: string, dateStr: string) => Promise<void>;
  
  // Focus operations
  updateDailyFocus: (date: string, topTasks: string[]) => Promise<void>;
  addFocusSession: (session: Partial<ApiFocusSession>) => Promise<void>;
  endFocusSession: (id: string) => Promise<void>;
  
  // Reflection operations
  saveReflection: (date: string, reflection: Partial<DailyReflection>) => Promise<void>;
  
  // Vision operations
  addVisionItem: (item: Omit<VisionItem, "id">) => Promise<void>;
  updateVisionItem: (id: string, item: Partial<VisionItem>) => Promise<void>;
  deleteVisionItem: (id: string) => Promise<void>;
  
  // Notification operations
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  
  // Settings operations
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  
  // Refresh
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [dailyFocus, setDailyFocus] = useState<DailyFocus | null>(null);
  const [reflections, setReflections] = useState<DailyReflection[]>([]);
  const [visionItems, setVisionItems] = useState<VisionItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [language, setLanguage] = useState<"vi" | "en">("vi");
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated
  const isAuthenticated = !!localStorage.getItem("accessToken");

  // Fetch all data
  const refreshData = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [
        categoriesData,
        eventsData,
        tasksData,
        goalsData,
        habitsData,
        visionData,
        notificationsData,
        settingsData,
      ] = await Promise.allSettled([
        categoryApi.getAll(),
        eventApi.getAll(),
        taskApi.getAll(),
        goalApi.getAll(),
        habitApi.getAll(),
        visionApi.getAll(),
        notificationApi.getAll({ limit: 50 }),
        settingsApi.get(),
      ]);

      // Process categories
      if (categoriesData.status === "fulfilled") {
        setCategories(dedupeCategories(categoriesData.value.map(c => ({
          id: c.id,
          name: c.name,
          color: c.color,
        }))));
      }

      // Process events - convert to frontend format
      if (eventsData.status === "fulfilled") {
        const today = new Date();
        setEvents(eventsData.value.map(mapApiEventToCalendarEvent));      }

      // Process tasks
      if (tasksData.status === "fulfilled") {
        setTasks(tasksData.value.map(mapApiTaskToTask));
      }

      // Process goals
      if (goalsData.status === "fulfilled") {
        setGoals(goalsData.value.map(g => ({
          id: g.id,
          title: g.title,
          description: g.description || "",
          categoryId: g.categoryId || "",
          categoryName: g.categoryName || "",
          type: g.goalType,
          period: g.period,
          targetDate: g.targetDate || "",
          progress: g.progress,
          color: g.color,
          milestones: (g.milestones || []).map(m => ({
            id: m.id,
            title: m.title,
            description: m.description || "",
            targetDate: m.targetDate || "",
            completed: m.completed,
          })),
        })));
      }

      // Process habits
      if (habitsData.status === "fulfilled") {
        const fetchedHabits = habitsData.value.habits || [];
        setHabits(fetchedHabits.map(h => ({
          id: h.id,
          title: h.title,
          description: h.description || "",
          frequency: h.frequency,
          targetCount: h.targetCount,
          repeatDays: h.repeatDays || [],
          currentStreak: h.currentStreak,
          bestStreak: h.bestStreak,
          color: h.color,
          completedDates: h.completedDates || [],
          completedToday: h.completedDates ? h.completedDates.includes(new Date().toISOString().split('T')[0]) : false,
        })));
      }

      // Process vision items
      if (visionData.status === "fulfilled") {
        setVisionItems(visionData.value.map(v => ({
          id: v.id,
          title: v.title,
          description: v.description || "",
          imageUrl: v.imageUrl,
          quote: v.quote,
          categoryId: v.categoryId || "",
          categoryName: v.categoryName || "",
          categoryColor: v.categoryColor,
        })));
      }

      // Process notifications
      if (notificationsData.status === "fulfilled") {
        setNotifications(notificationsData.value.map(n => ({
          id: n.id,
          type: n.type,
          tone: n.tone,
          title: n.title,
          message: n.message,
          ctaLabel: n.ctaLabel,
          isRead: n.read,
          isDismissed: n.dismissed,
          scheduledFor: n.scheduledFor,
          createdAt: n.createdAt,
        })));
      }

      // Process settings
      if (settingsData.status === "fulfilled") {
        setSettings({
          theme: settingsData.value.theme,
          defaultFocusType: settingsData.value.defaultFocusType,
          pomodoroDuration: settingsData.value.pomodoroDuration,
          shortBreakDuration: settingsData.value.shortBreakDuration,
          longBreakDuration: settingsData.value.longBreakDuration,
          dailyTaskLimit: settingsData.value.dailyTaskLimit,
          notificationEnabled: settingsData.value.notificationEnabled,
          emailDigestEnabled: settingsData.value.emailDigestEnabled,
          onboardingCompleted: settingsData.value.onboardingCompleted,
        });
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Load data on mount and auth change
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Helper function
  function getDayName(date: Date, lang: string): string {
    const days = lang === "vi" 
      ? ["CN", "T2", "T3", "T4", "T5", "T6", "T7"] 
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[date.getDay()];
  }

  // Category operations
  const addCategory = async (category: Omit<Category, "id">) => {
    const created = await categoryApi.create(category);
    const createdCategory = { id: created.id, name: created.name, color: created.color };
    setCategories(prev => dedupeCategories([...prev, createdCategory]));
    return createdCategory;
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const updated = await categoryApi.update(id, updates);
    setCategories(prev => prev.map(c => c.id === id ? { id: updated.id, name: updated.name, color: updated.color } : c));
  };

  const deleteCategory = async (id: string) => {
    await categoryApi.delete(id);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // Event operations
  const addEvent = async (event: Omit<CalendarEvent, "id">) => {
    const eventDate = event.eventDate || getEventDateFromWeekday(event.day);
    const created = await eventApi.create({
      title: event.title,
      eventDate,
      startHour: event.startHour,
      startMin: event.startMin,
      duration: event.duration,
      color: event.color,
      location: event.location,
      notes: event.notes,
      isRecurring: event.isRecurring ?? false,
      recurrenceRule: event.isRecurring ? (event.recurrenceRule || "WEEKLY") : undefined,
      categoryId: event.categoryId || undefined,
    });
    setEvents(prev => [...prev, mapApiEventToCalendarEvent(created)]);
  };

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    const updateData: Record<string, unknown> = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.eventDate !== undefined) {
      updateData.eventDate = updates.eventDate;
    } else if (updates.day !== undefined) {
      updateData.eventDate = getEventDateFromWeekday(updates.day);
    }
    if (updates.startHour !== undefined) updateData.startHour = updates.startHour;
    if (updates.startMin !== undefined) updateData.startMin = updates.startMin;
    if (updates.duration !== undefined) updateData.duration = updates.duration;
    if (updates.color) updateData.color = updates.color;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.categoryId !== undefined) updateData.categoryId = updates.categoryId;
    if (updates.isRecurring !== undefined) updateData.isRecurring = updates.isRecurring;
    if (updates.recurrenceRule !== undefined) updateData.recurrenceRule = updates.recurrenceRule;

    const updated = await eventApi.update(id, updateData as Parameters<typeof eventApi.update>[1]);
    setEvents(prev => prev.map(e => e.id === id ? mapApiEventToCalendarEvent(updated) : e));
  };

  const deleteEvent = async (id: string) => {
    await eventApi.delete(id);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  // Task operations
  const addTask = async (task: Omit<Task, "id">) => {
    const created = await taskApi.create({
      title: task.title,
      description: task.description,
      dueDate: normalizeTaskDueDateForApi(task.dueDate),
      scheduledAt: task.scheduledAt,
      priority: task.priority,
      color: task.color,
      eisenhowerMatrix: task.eisenhowerMatrix,
      status: task.status,
      estimatedTime: task.estimatedTime,
      contexts: task.contexts,
      checklist: task.checklist,
      categoryId: task.categoryId,
      goalId: task.goalId,
      milestoneId: task.milestoneId,
      showOnCalendar: task.showOnCalendar,
    });
    setTasks(prev => [...prev, mapApiTaskToTask(created)]);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const updateData: Record<string, unknown> = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.dueDate !== undefined) {
      const normalizedDueDate = normalizeTaskDueDateForApi(updates.dueDate);
      if (normalizedDueDate) {
        updateData.dueDate = normalizedDueDate;
      }
    }
    if (updates.scheduledAt !== undefined) updateData.scheduledAt = updates.scheduledAt;
    if (updates.priority) updateData.priority = updates.priority;
    if (updates.color) updateData.color = updates.color;
    if (updates.completed !== undefined) updateData.completed = updates.completed;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.eisenhowerMatrix !== undefined) updateData.eisenhowerMatrix = updates.eisenhowerMatrix;
    if (updates.estimatedTime !== undefined) updateData.estimatedTime = updates.estimatedTime;
    if (updates.contexts !== undefined) updateData.contexts = updates.contexts;
    if (updates.checklist !== undefined) updateData.checklist = updates.checklist;
    if (updates.categoryId) updateData.categoryId = updates.categoryId;
    if (updates.goalId !== undefined) updateData.goalId = updates.goalId;
    if (updates.milestoneId !== undefined) updateData.milestoneId = updates.milestoneId;
    if (updates.showOnCalendar !== undefined) updateData.showOnCalendar = updates.showOnCalendar;
    if (updates.sortOrder !== undefined) updateData.sortOrder = updates.sortOrder;

    const updated = await taskApi.update(id, updateData as Parameters<typeof taskApi.update>[1]);
    setTasks(prev => prev.map(t => t.id === id ? mapApiTaskToTask(updated) : t));
  };

  const deleteTask = async (id: string) => {
    await taskApi.delete(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const toggleTaskComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const updated = await taskApi.updateCompletion(id, !task.completed);
    setTasks(prev => prev.map(t => t.id === id ? mapApiTaskToTask(updated) : t));
  };

  // Goal operations
  const addGoal = async (goal: CreateGoalInput) => {
    const created = await goalApi.create({
      title: goal.title,
      description: goal.description,
      categoryId: goal.categoryId,
      goalType: goal.type,
      period: goal.period,
      targetDate: goal.targetDate || undefined,
      color: goal.color,
    });
    setGoals(prev => [...prev, {
      id: created.id,
      title: created.title,
      description: created.description || "",
      categoryId: created.categoryId || goal.categoryId,
      categoryName: created.categoryName || categories.find((category) => category.id === goal.categoryId)?.name || "",
      type: created.goalType,
      period: created.period,
      targetDate: created.targetDate || "",
      progress: created.progress,
      color: created.color,
      milestones: (created.milestones || []).map(m => ({
        id: m.id,
        title: m.title,
        description: m.description || "",
        targetDate: m.targetDate || "",
        completed: m.completed,
      })),
    }]);
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    const updateData: Record<string, unknown> = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.categoryId !== undefined) updateData.categoryId = updates.categoryId;
    if (updates.type) updateData.goalType = updates.type;
    if (updates.period) updateData.period = updates.period;
    if (updates.targetDate !== undefined) updateData.targetDate = updates.targetDate;
    if (updates.progress !== undefined) updateData.progress = updates.progress;
    if (updates.color) updateData.color = updates.color;

    await goalApi.update(id, updateData as Parameters<typeof goalApi.update>[1]);
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const deleteGoal = async (id: string) => {
    await goalApi.delete(id);
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const addMilestone = async (goalId: string, milestone: CreateMilestoneInput) => {
    const created = await goalApi.createMilestone(goalId, milestone);
    setGoals(prev => prev.map(goal => goal.id === goalId ? {
      ...goal,
      milestones: [...goal.milestones, {
        id: created.id,
        title: created.title,
        description: created.description || "",
        targetDate: created.targetDate || "",
        completed: created.completed,
      }],
    } : goal));
  };

  const updateMilestone = async (goalId: string, milestoneId: string, milestone: { title?: string; description?: string; targetDate?: string; completed?: boolean }) => {
    const updated = await goalApi.updateMilestone(goalId, milestoneId, milestone);
    setGoals(prev => prev.map(goal => goal.id === goalId ? {
      ...goal,
      milestones: goal.milestones.map(item => item.id === milestoneId ? {
        id: updated.id,
        title: updated.title,
        description: updated.description || "",
        targetDate: updated.targetDate || "",
        completed: updated.completed,
      } : item),
    } : goal));
  };

  const deleteMilestone = async (goalId: string, milestoneId: string) => {
    await goalApi.deleteMilestone(goalId, milestoneId);
    setGoals(prev => prev.map(goal => goal.id === goalId ? {
      ...goal,
      milestones: goal.milestones.filter(milestone => milestone.id !== milestoneId),
    } : goal));
  };

  // Habit operations
  const addHabit = async (habit: Omit<Habit, "id" | "currentStreak" | "bestStreak" | "completedDates">) => {
    const payload = {
      title: habit.title,
      description: habit.description,
      frequency: habit.frequency,
      targetCount: habit.targetCount,
      repeatDays: habit.repeatDays,
      color: habit.color,
    };

    const created = await habitApi.create(payload);
    setHabits(prev => [...prev, {
      id: created.id,
      title: created.title,
      description: created.description || "",
      frequency: created.frequency,
      targetCount: created.targetCount,
      repeatDays: created.repeatDays || [],
      currentStreak: created.currentStreak,
      bestStreak: created.bestStreak,
      color: created.color,
      completedDates: created.completedDates || [],
      completedToday: created.completedDates ? created.completedDates.includes(new Date().toISOString().split('T')[0]) : false,
    }]);
  };

  const updateHabit = async (id: string, updates: Partial<Habit>) => {
    const updateData: Record<string, unknown> = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.frequency) updateData.frequency = updates.frequency;
    if (updates.targetCount !== undefined) updateData.targetCount = updates.targetCount;
    if (updates.repeatDays !== undefined) updateData.repeatDays = updates.repeatDays;
    if (updates.color) updateData.color = updates.color;

    const updated = await habitApi.update(id, updateData as Parameters<typeof habitApi.update>[1]);
    setHabits(prev => prev.map(h => h.id === id ? {
      ...h,
      title: updated.title,
      description: updated.description || "",
      frequency: updated.frequency,
      targetCount: updated.targetCount,
      repeatDays: updated.repeatDays || [],
      currentStreak: updated.currentStreak,
      bestStreak: updated.bestStreak,
      color: updated.color,
      completedDates: updated.completedDates || [],
      completedToday: updated.completedDates ? updated.completedDates.includes(new Date().toISOString().split('T')[0]) : false,
    } : h));
  };

  const deleteHabit = async (id: string) => {
    await habitApi.delete(id);
    setHabits(prev => prev.filter(habit => habit.id !== id));
  };

  const completeHabitDate = async (id: string, dateStr: string) => {
    const updated = await habitApi.complete(id, dateStr);
    setHabits(prev => prev.map(h => h.id === id ? {
      ...h,
      title: updated.title,
      description: updated.description || "",
      frequency: updated.frequency,
      targetCount: updated.targetCount,
      repeatDays: updated.repeatDays || [],
      currentStreak: updated.currentStreak,
      bestStreak: updated.bestStreak,
      color: updated.color,
      completedDates: updated.completedDates || [],
      completedToday: updated.completedDates ? updated.completedDates.includes(new Date().toISOString().split('T')[0]) : false,
    } : h));
  };

  // Focus operations
  const updateDailyFocus = async (date: string, topTasks: string[]) => {
    const currentTopTasks = dailyFocus && dailyFocus.date === date ? dailyFocus.topTasks : [];
    const toAdd = topTasks.filter(id => !currentTopTasks.includes(id));
    const toRemove = currentTopTasks.filter(id => !topTasks.includes(id));
    let updated: ApiDailyFocus | null = null;
    for (const taskId of toAdd) {
      updated = await focusApi.addTopTask(date, taskId);
    }
    for (const taskId of toRemove) {
      updated = await focusApi.removeTopTask(date, taskId);
    }
    if (!updated) {
      updated = await focusApi.getDailyFocus(date);
    }
    if (updated) {
      setDailyFocus({
        id: updated.id,
        date: updated.focusDate,
        topTasks: updated.topTaskIds || [],
        focusSessions: updated.focusSessions || [],
        quickNotes: updated.quickNotes || [],
      });
    }
  };

  const addFocusSession = async (session: Partial<ApiFocusSession>) => {
    const created = await focusApi.startSession({
      startTime: session.startTime || new Date().toISOString(),
      duration: session.duration || 25,
      sessionType: session.sessionType || "pomodoro",
      taskId: session.taskId,
    });
    setDailyFocus(prev => prev ? {
      ...prev,
      focusSessions: [...prev.focusSessions, created],
    } : {
      id: "",
      date: new Date().toISOString().split("T")[0],
      topTasks: [],
      focusSessions: [created],
      quickNotes: [],
    });
  };

  const endFocusSession = async (id: string) => {
    const updated = await focusApi.completeSession(id);
    setDailyFocus(prev => prev ? {
      ...prev,
      focusSessions: prev.focusSessions.map(s => s.id === id ? updated : s),
    } : null);
  };

  // Reflection operations
  const saveReflection = async (date: string, reflection: Partial<DailyReflection>) => {
    const updated = await reflectionApi.createOrUpdate(date, {
      completed: reflection.completed,
      obstacles: reflection.obstacles,
      improvements: reflection.improvements,
      energyLevel: reflection.energyLevel,
      mood: reflection.mood,
    });
    setReflections(prev => {
      const existing = prev.findIndex(r => r.date === date);
      if (existing >= 0) {
        return prev.map((r, i) => i === existing ? {
          id: updated.id,
          date: updated.reflectionDate,
          completed: updated.completed || "",
          obstacles: updated.obstacles || "",
          improvements: updated.improvements || "",
          energyLevel: updated.energyLevel || 5,
          mood: updated.mood || "okay",
        } : r);
      }
      return [...prev, {
        id: updated.id,
        date: updated.reflectionDate,
        completed: updated.completed || "",
        obstacles: updated.obstacles || "",
        improvements: updated.improvements || "",
        energyLevel: updated.energyLevel || 5,
        mood: updated.mood || "okay",
      }];
    });
  };

  // Vision operations
  const addVisionItem = async (item: Omit<VisionItem, "id">) => {
    const created = await visionApi.create({
      title: item.title,
      description: item.description || undefined,
      categoryId: item.categoryId,
      imageUrl: item.imageUrl,
      quote: item.quote,
    });
    setVisionItems(prev => [...prev, {
      id: created.id,
      title: created.title,
      description: created.description || "",
      imageUrl: created.imageUrl,
      quote: created.quote,
      categoryId: created.categoryId || item.categoryId,
      categoryName: created.categoryName || item.categoryName,
      categoryColor: created.categoryColor || item.categoryColor,
    }]);
  };

  const updateVisionItem = async (id: string, updates: Partial<VisionItem>) => {
    const updated = await visionApi.update(id, {
      title: updates.title,
      description: updates.description,
      categoryId: updates.categoryId,
      imageUrl: updates.imageUrl,
      quote: updates.quote,
    });
    setVisionItems(prev => prev.map(v => v.id === id ? {
      id: updated.id,
      title: updated.title,
      description: updated.description || "",
      imageUrl: updated.imageUrl,
      quote: updated.quote,
      categoryId: updated.categoryId || v.categoryId,
      categoryName: updated.categoryName || v.categoryName,
      categoryColor: updated.categoryColor || v.categoryColor,
    } : v));
  };

  const deleteVisionItem = async (id: string) => {
    await visionApi.delete(id);
    setVisionItems(prev => prev.filter(v => v.id !== id));
  };

  // Notification operations
  const markNotificationRead = async (id: string) => {
    await notificationApi.update(id, { read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllNotificationsRead = async () => {
    await notificationApi.updateAll({ read: true });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const dismissNotification = async (id: string) => {
    await notificationApi.update(id, { dismissed: true });
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Settings operations
  const updateSettings = async (updates: Partial<UserSettings>) => {
    const updated = await settingsApi.update(updates as Parameters<typeof settingsApi.update>[0]);
    setSettings({
      theme: updated.theme,
      defaultFocusType: updated.defaultFocusType,
      pomodoroDuration: updated.pomodoroDuration,
      shortBreakDuration: updated.shortBreakDuration,
      longBreakDuration: updated.longBreakDuration,
      dailyTaskLimit: updated.dailyTaskLimit,
      notificationEnabled: updated.notificationEnabled,
      emailDigestEnabled: updated.emailDigestEnabled,
      onboardingCompleted: updated.onboardingCompleted,
    });
  };

  return (
    <DataContext.Provider
      value={{
        categories,
        events,
        tasks,
        goals,
        habits,
        dailyFocus,
        reflections,
        visionItems,
        notifications,
        settings,
        loading,
        error,
        language,
        setLanguage,
        addCategory,
        updateCategory,
        deleteCategory,
        addEvent,
        updateEvent,
        deleteEvent,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        addGoal,
        updateGoal,
        deleteGoal,
        addMilestone,
        updateMilestone,
        deleteMilestone,
        addHabit,
        updateHabit,
        deleteHabit,
        completeHabitDate,
        updateDailyFocus,
        addFocusSession,
        endFocusSession,
        saveReflection,
        addVisionItem,
        updateVisionItem,
        deleteVisionItem,
        markNotificationRead,
        markAllNotificationsRead,
        dismissNotification,
        updateSettings,
        refreshData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
