import { API_BASE_URL } from "../context/AuthContext";
import type { ApiTask } from "./types";

const API = "/api/v1";

export const taskApi = {
  async getAll(params?: {
    completed?: boolean;
    categoryId?: string;
    priority?: string;
    eisenhowerMatrix?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiTask[]> {
    const searchParams = new URLSearchParams();
    if (params?.completed !== undefined) searchParams.set("completed", String(params.completed));
    if (params?.categoryId) searchParams.set("categoryId", params.categoryId);
    if (params?.priority) searchParams.set("priority", params.priority);
    if (params?.eisenhowerMatrix) searchParams.set("eisenhowerMatrix", params.eisenhowerMatrix);
    if (params?.dateFrom) searchParams.set("dateFrom", params.dateFrom);
    if (params?.dateTo) searchParams.set("dateTo", params.dateTo);

    const query = searchParams.toString();
    const response = await fetch(`${API_BASE_URL}${API}/tasks${query ? `?${query}` : ""}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch tasks");
    return response.json();
  },

  async getById(id: string): Promise<ApiTask> {
    const response = await fetch(`${API_BASE_URL}${API}/tasks/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch task");
    return response.json();
  },

  async create(data: {
    title: string;
    description?: string;
    dueDate?: string;
    priority?: string;
    color?: string;
    eisenhowerMatrix?: string;
    estimatedTime?: number;
    contexts?: string[];
    categoryId?: string;
  }): Promise<ApiTask> {
    const response = await fetch(`${API_BASE_URL}${API}/tasks`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create task");
    return response.json();
  },

  async update(id: string, data: {
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
  }): Promise<ApiTask> {
    const response = await fetch(`${API_BASE_URL}${API}/tasks/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update task");
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API}/tasks/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete task");
  },

  async toggleComplete(id: string): Promise<ApiTask> {
    const response = await fetch(`${API_BASE_URL}${API}/tasks/${id}/toggle-complete`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to toggle task completion");
    return response.json();
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
