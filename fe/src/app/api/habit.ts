import { API_BASE_URL } from "../context/AuthContext";
import type { ApiHabit, HabitListResponse } from "./types";

const API = "/api/v1";

export const habitApi = {
  async getAll(params?: {
    frequency?: string;
    isActive?: boolean;
  }): Promise<HabitListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.frequency) searchParams.set("frequency", params.frequency);
    if (params?.isActive !== undefined) searchParams.set("isActive", String(params.isActive));

    const query = searchParams.toString();
    const response = await fetch(`${API_BASE_URL}${API}/habits${query ? `?${query}` : ""}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(await readApiError(response, "Failed to fetch habits"));
    return response.json();
  },

  async getById(id: string): Promise<ApiHabit> {
    const response = await fetch(`${API_BASE_URL}${API}/habits/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(await readApiError(response, "Failed to fetch habit"));
    return response.json();
  },

  async create(data: {
    title: string;
    description?: string;
    frequency?: string;
    targetCount?: number;
    repeatDays?: string[];
    color?: string;
  }): Promise<ApiHabit> {
    const response = await fetch(`${API_BASE_URL}${API}/habits`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await readApiError(response, "Failed to create habit"));
    return response.json();
  },

  async update(id: string, data: {
    title?: string;
    description?: string;
    frequency?: string;
    targetCount?: number;
    repeatDays?: string[];
    color?: string;
    isActive?: boolean;
  }): Promise<ApiHabit> {
    const response = await fetch(`${API_BASE_URL}${API}/habits/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await readApiError(response, "Failed to update habit"));
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API}/habits/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(await readApiError(response, "Failed to delete habit"));
  },

  async complete(id: string, date: string): Promise<ApiHabit> {
    const formattedDate = date.match(/^\d{4}-\d{2}-\d{2}$/)?.[0];
    if (!formattedDate) throw new Error("Invalid habit completion date");
    const response = await fetch(`${API_BASE_URL}${API}/habits/${id}/completions/${formattedDate}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(await readApiError(response, "Failed to toggle habit completion"));
    return response.json();
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

async function readApiError(response: Response, fallbackMessage: string) {
  const raw = await response.text().catch(() => "");
  if (!raw) return `${fallbackMessage} (${response.status})`;

  try {
    const body = JSON.parse(raw) as { message?: unknown; errors?: unknown };
    if (typeof body.message === "string" && body.message.trim()) {
      return body.message;
    }

    if (body.errors && typeof body.errors === "object") {
      const firstError = Object.values(body.errors as Record<string, string>).find(Boolean);
      if (firstError) return firstError;
    }
  } catch {
    if (raw.trim()) {
      return raw;
    }
  }

  return `${fallbackMessage} (${response.status})`;
}
