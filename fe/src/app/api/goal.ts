import { API_BASE_URL } from "../context/AuthContext";
import type { ApiGoal, ApiMilestone } from "./types";

const API = "/api/v1";

export const goalApi = {
  async getAll(params?: {
    period?: string;
    category?: string;
    completed?: boolean;
  }): Promise<ApiGoal[]> {
    const searchParams = new URLSearchParams();
    if (params?.period) searchParams.set("period", params.period);
    if (params?.category) searchParams.set("category", params.category);
    if (params?.completed !== undefined) searchParams.set("completed", String(params.completed));

    const query = searchParams.toString();
    const response = await fetch(`${API_BASE_URL}${API}/goals${query ? `?${query}` : ""}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch goals");
    const payload = await response.json();
    return Array.isArray(payload) ? payload : (payload.goals || []);
  },

  async getById(id: string): Promise<ApiGoal> {
    const response = await fetch(`${API_BASE_URL}${API}/goals/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch goal");
    return response.json();
  },

  async create(data: {
    title: string;
    description?: string;
    category?: string;
    goalType?: string;
    period: string;
    targetDate?: string;
    color?: string;
  }): Promise<ApiGoal> {
    const response = await fetch(`${API_BASE_URL}${API}/goals`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create goal");
    return response.json();
  },

  async update(id: string, data: {
    title?: string;
    description?: string;
    category?: string;
    goalType?: string;
    period?: string;
    targetDate?: string;
    progress?: number;
    color?: string;
    isCompleted?: boolean;
  }): Promise<ApiGoal> {
    const response = await fetch(`${API_BASE_URL}${API}/goals/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update goal");
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API}/goals/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete goal");
  },

  async incrementProgress(id: string): Promise<ApiGoal> {
    const response = await fetch(`${API_BASE_URL}${API}/goals/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ progress: undefined }),
    });
    if (!response.ok) throw new Error("Failed to increment goal progress");
    return response.json();
  },

  // Milestones
  async getMilestones(goalId: string): Promise<ApiMilestone[]> {
    const response = await fetch(`${API_BASE_URL}${API}/goals/${goalId}/milestones`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch milestones");
    return response.json();
  },

  async createMilestone(goalId: string, data: {
    title: string;
    description?: string;
    targetDate?: string;
  }): Promise<ApiMilestone> {
    const response = await fetch(`${API_BASE_URL}${API}/goals/${goalId}/milestones`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create milestone");
    return response.json();
  },

  async updateMilestone(goalId: string, milestoneId: string, data: {
    title?: string;
    description?: string;
    targetDate?: string;
    completed?: boolean;
  }): Promise<ApiMilestone> {
    const response = await fetch(`${API_BASE_URL}${API}/goals/${goalId}/milestones/${milestoneId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update milestone");
    return response.json();
  },

  async deleteMilestone(goalId: string, milestoneId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API}/goals/${goalId}/milestones/${milestoneId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete milestone");
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
