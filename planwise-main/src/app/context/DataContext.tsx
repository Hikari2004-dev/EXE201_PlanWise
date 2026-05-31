import { createContext, useContext, useState, ReactNode } from "react";
import {
  CATEGORIES,
  EVENTS,
  TASKS,
  HABITS,
  GOALS,
  type Category,
  type CalendarEvent,
  type Task,
  type Habit,
  type Goal,
  type EventColor,
} from "../data/mockData";

interface DataContextType {
  categories: Category[];
  events: CalendarEvent[];
  tasks: Task[];
  addCategory: (category: Omit<Category, "id">) => void;
  updateCategory: (id: number, category: Partial<Category>) => void;
  deleteCategory: (id: number) => void;
  addEvent: (event: Omit<CalendarEvent, "id">) => void;
  updateEvent: (id: number, event: Partial<CalendarEvent>) => void;
  deleteEvent: (id: number) => void;
  addTask: (task: Omit<Task, "id">) => void;
  updateTask: (id: number, task: Partial<Task>) => void;
  deleteTask: (id: number) => void;
  habits: Habit[];
  updateHabit: (id: number, habit: Partial<Habit>) => void;
  toggleHabitDate: (id: number, dateStr: string) => void;
  goals: Goal[];
  updateGoal: (id: number, goal: Partial<Goal>) => void;
  language: "vi" | "en";
  toggleLanguage: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [events, setEvents] = useState<CalendarEvent[]>(EVENTS);
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [habits, setHabits] = useState<Habit[]>(HABITS);
  const [goals, setGoals] = useState<Goal[]>(GOALS);
  const [language, setLanguage] = useState<"vi" | "en">("vi");

  const toggleLanguage = () => {
    setLanguage(prev => prev === "vi" ? "en" : "vi");
  };

  const addCategory = (category: Omit<Category, "id">) => {
    const newCategory = { ...category, id: Date.now() };
    setCategories((prev) => [...prev, newCategory]);
  };

  const updateCategory = (id: number, updates: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat))
    );
    // Update events and tasks with this category
    if (updates.color) {
      setEvents((prev) =>
        prev.map((evt) => (evt.categoryId === id ? { ...evt, color: updates.color! } : evt))
      );
      setTasks((prev) =>
        prev.map((task) => (task.categoryId === id ? { ...task, color: updates.color! } : task))
      );
    }
  };

  const deleteCategory = (id: number) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
    // Don't delete events/tasks, just set their categoryId to null or a default
    setEvents((prev) =>
      prev.map((evt) => (evt.categoryId === id ? { ...evt, categoryId: 0 } : evt))
    );
    setTasks((prev) =>
      prev.map((task) => (task.categoryId === id ? { ...task, categoryId: 0 } : task))
    );
  };

  const addEvent = (event: Omit<CalendarEvent, "id">) => {
    const newEvent = { ...event, id: Date.now() };
    setEvents((prev) => [...prev, newEvent]);
  };

  const updateEvent = (id: number, updates: Partial<CalendarEvent>) => {
    setEvents((prev) =>
      prev.map((evt) => (evt.id === id ? { ...evt, ...updates } : evt))
    );
  };

  const deleteEvent = (id: number) => {
    setEvents((prev) => prev.filter((evt) => evt.id !== id));
  };

  const addTask = (task: Omit<Task, "id">) => {
    const newTask = { ...task, id: Date.now() };
    setTasks((prev) => [...prev, newTask]);
  };

  const updateTask = (id: number, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...updates } : task))
    );
  };

  const deleteTask = (id: number) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const updateHabit = (id: number, updates: Partial<Habit>) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  };

  const toggleHabitDate = (id: number, dateStr: string) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === id) {
        const completedDates = habit.completedDates.includes(dateStr) 
          ? habit.completedDates.filter(d => d !== dateStr) 
          : [...habit.completedDates, dateStr];
        return { ...habit, completedDates };
      }
      return habit;
    }));
  };

  const updateGoal = (id: number, updates: Partial<Goal>) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  return (
    <DataContext.Provider
      value={{
        categories,
        events,
        tasks,
        habits,
        goals,
        language,
        toggleLanguage,
        addCategory,
        updateCategory,
        deleteCategory,
        addEvent,
        updateEvent,
        deleteEvent,
        addTask,
        updateTask,
        deleteTask,
        updateHabit,
        toggleHabitDate,
        updateGoal,
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
