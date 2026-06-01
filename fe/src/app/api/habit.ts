import { API_BASE_URL } from "../context/AuthContext";
import type { ApiHabit } from "./types";

const API = "/api/v1";

export const habitApi = {
  async getAll(params?: {
    frequency?: string;
    isActive?: boolean;
  }): Promise<ApiHabit[]> {
    const searchParams = new URLSearchParams();
    if (params?.frequency) searchParams.set("frequency", params.frequency);
    if (params?.isActive !== undefined) searchParams.set("isActive", String(params.isActive));

    const query = searchParams.toString();
    const response = await fetch(`${API_BASE_URL}${API}/habits${query ? `?${query}` : ""}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch habits");
    return response.json();
  },

  async getById(id: string): Promise<ApiHabit> {
    const response = await fetch(`${API_BASE_URL}${API}/habits/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch habit");
    return response.json();
  },

  async create(data: {
    title: string;
    description?: string;
    frequency?: string;
    targetCount?: number;
    color?: string;
  }): Promise<ApiHabit> {
    const response = await fetch(`${API_BASE_URL}${API}/habits`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create habit");
    return response.json();
  },

  async update(id: string, data: {
    title?: string;
    description?: string;
    frequency?: string;
    targetCount?: number;
    color?: string;
    isActive?: boolean;
  }): Promise<ApiHabit> {
    const response = await fetch(`${API_BASE_URL}${API}/habits/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update habit");
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API}/habits/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete habit");
  },

  async toggleCompletion(id: string, date: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API}/habits/${id}/toggle?date=${date}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to toggle habit completion");
  },

  async getStats(id: string): Promise<{
    currentStreak: number;
    bestStreak: number;
    totalCompletions: number;
    completionsThisWeek: number;
    completionsThisMonth: number;
  }> {
    const response = await fetch(`${API_BASE_URL}${API}/habits/${id}/stats`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch habit stats");
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
