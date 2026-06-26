import { API_BASE_URL } from "../context/AuthContext";
import type { ApiTask } from "./types";

const API = "/api/v1";

export const taskApi = {
  async getAll(params?: {
    q?: string;
    status?: string;
    completed?: boolean;
    categoryId?: string;
    priority?: string;
    eisenhowerMatrix?: string;
    goalId?: string;
    milestoneId?: string;
    showOnCalendar?: boolean;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiTask[]> {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.set("q", params.q);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.completed !== undefined) searchParams.set("completed", String(params.completed));
    if (params?.categoryId) searchParams.set("categoryId", params.categoryId);
    if (params?.priority) {
      const priorityMap: Record<string, string> = {
        "Cao": "HIGH",
        "Trung bình": "MEDIUM",
        "Thấp": "LOW"
      };
      searchParams.set("priority", priorityMap[params.priority] || params.priority);
    }
    if (params?.eisenhowerMatrix) {
      searchParams.set("eisenhowerMatrix", params.eisenhowerMatrix.replace(/-/g, "_"));
    }
    if (params?.goalId) searchParams.set("goalId", params.goalId);
    if (params?.milestoneId) searchParams.set("milestoneId", params.milestoneId);
    if (params?.showOnCalendar !== undefined) searchParams.set("showOnCalendar", String(params.showOnCalendar));
    if (params?.dateFrom) searchParams.set("dateFrom", params.dateFrom);
    if (params?.dateTo) searchParams.set("dateTo", params.dateTo);

    const query = searchParams.toString();
    const response = await fetch(`${API_BASE_URL}${API}/tasks${query ? `?${query}` : ""}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch tasks");
    const payload: { tasks: ApiTask[] } = await response.json();
    return (payload.tasks || []).map(task => ({
      ...task,
      eisenhowerMatrix: task.eisenhowerMatrix ? task.eisenhowerMatrix.replace(/_/g, "-") : undefined,
    }));
  },

  async getById(id: string): Promise<ApiTask> {
    const response = await fetch(`${API_BASE_URL}${API}/tasks/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch task");
    const task: ApiTask = await response.json();
    return {
      ...task,
      eisenhowerMatrix: task.eisenhowerMatrix ? task.eisenhowerMatrix.replace(/_/g, "-") : undefined,
    };
  },

  async create(data: {
    title: string;
    description?: string;
    dueDate?: string;
    scheduledAt?: string;
    priority?: string;
    color?: string;
    eisenhowerMatrix?: string;
    status?: string;
    estimatedTime?: number;
    contexts?: string[];
    checklist?: string[];
    categoryId?: string;
    goalId?: string;
    milestoneId?: string;
    showOnCalendar?: boolean;
  }): Promise<ApiTask> {
    const priorityMap: Record<string, string> = {
      "Cao": "HIGH",
      "Trung bình": "MEDIUM",
      "Thấp": "LOW"
    };
    const mappedPriority = data.priority ? (priorityMap[data.priority] || data.priority) : undefined;
    const mappedEisenhower = data.eisenhowerMatrix ? data.eisenhowerMatrix.replace(/-/g, "_") : undefined;

    const response = await fetch(`${API_BASE_URL}${API}/tasks`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...data,
        priority: mappedPriority,
        eisenhowerMatrix: mappedEisenhower,
      }),
    });
    if (!response.ok) throw new Error("Failed to create task");
    const task: ApiTask = await response.json();
    return {
      ...task,
      eisenhowerMatrix: task.eisenhowerMatrix ? task.eisenhowerMatrix.replace(/_/g, "-") : undefined,
    };
  },

  async update(id: string, data: {
    title?: string;
    description?: string;
    dueDate?: string;
    scheduledAt?: string;
    priority?: string;
    color?: string;
    completed?: boolean;
    eisenhowerMatrix?: string;
    status?: string;
    estimatedTime?: number;
    contexts?: string[];
    checklist?: string[];
    categoryId?: string;
    goalId?: string;
    milestoneId?: string;
    showOnCalendar?: boolean;
    sortOrder?: number;
  }): Promise<ApiTask> {
    const priorityMap: Record<string, string> = {
      "Cao": "HIGH",
      "Trung bình": "MEDIUM",
      "Thấp": "LOW"
    };
    const mappedPriority = data.priority ? (priorityMap[data.priority] || data.priority) : undefined;
    const mappedEisenhower = data.eisenhowerMatrix ? data.eisenhowerMatrix.replace(/-/g, "_") : undefined;

    const response = await fetch(`${API_BASE_URL}${API}/tasks/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...data,
        priority: mappedPriority,
        eisenhowerMatrix: mappedEisenhower,
      }),
    });
    if (!response.ok) throw new Error("Failed to update task");
    const task: ApiTask = await response.json();
    return {
      ...task,
      eisenhowerMatrix: task.eisenhowerMatrix ? task.eisenhowerMatrix.replace(/_/g, "-") : undefined,
    };
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API}/tasks/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete task");
  },

  async updateCompletion(id: string, completed: boolean): Promise<ApiTask> {
    const response = await fetch(`${API_BASE_URL}${API}/tasks/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ completed }),
    });
    if (!response.ok) throw new Error("Failed to update task completion");
    const task: ApiTask = await response.json();
    return {
      ...task,
      eisenhowerMatrix: task.eisenhowerMatrix ? task.eisenhowerMatrix.replace(/_/g, "-") : undefined,
    };
  },

  async getStats(): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  }> {
    const response = await fetch(`${API_BASE_URL}${API}/tasks/stats`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch task stats");
    return response.json();
  },
};

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  const token = localStorage.getItem("accessToken");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}
