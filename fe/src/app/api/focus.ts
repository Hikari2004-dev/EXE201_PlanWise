import { API_BASE_URL } from "../context/AuthContext";
import type { ApiDailyFocus, ApiFocusSession, ApiQuickNote } from "./types";

const API = "/api/v1";

export const focusApi = {
  // Daily Focus
  async getDailyFocus(date?: string): Promise<ApiDailyFocus | null> {
    const query = date ? `?date=${date}` : "";
    const response = await fetch(`${API_BASE_URL}${API}/focus/daily${query}`, {
      headers: getAuthHeaders(),
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Failed to fetch daily focus");
    return response.json();
  },

  async updateDailyNotes(date: string, notes: string): Promise<ApiDailyFocus> {
    const response = await fetch(`${API_BASE_URL}${API}/focus/daily/notes?date=${date}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(notes),
    });
    if (!response.ok) throw new Error("Failed to update daily focus notes");
    return response.json();
  },

  async addTopTask(date: string, taskId: string): Promise<ApiDailyFocus> {
    const response = await fetch(`${API_BASE_URL}${API}/focus/daily/${date}/top-tasks/${taskId}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to add top task");
    return response.json();
  },

  async removeTopTask(date: string, taskId: string): Promise<ApiDailyFocus> {
    const response = await fetch(`${API_BASE_URL}${API}/focus/daily/${date}/top-tasks/${taskId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to remove top task");
    return response.json();
  },

  // Focus Sessions
  async getSessions(): Promise<ApiFocusSession[]> {
    const response = await fetch(`${API_BASE_URL}${API}/focus/sessions`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch focus sessions");
    return response.json();
  },

  async startSession(data: {
    startTime: string;
    duration?: number;
    sessionType?: string;
    taskId?: string;
    notes?: string;
  }): Promise<ApiFocusSession> {
    const response = await fetch(`${API_BASE_URL}${API}/focus/sessions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to start focus session");
    return response.json();
  },

  async completeSession(id: string): Promise<ApiFocusSession> {
    const response = await fetch(`${API_BASE_URL}${API}/focus/sessions/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to complete focus session");
    return response.json();
  },

  // Quick Notes
  async getQuickNotes(): Promise<ApiQuickNote[]> {
    const response = await fetch(`${API_BASE_URL}${API}/focus/notes`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch quick notes");
    return response.json();
  },

  async createQuickNote(data: {
    content: string;
    noteType?: string;
    mediaUrl?: string;
  }): Promise<ApiQuickNote> {
    const response = await fetch(`${API_BASE_URL}${API}/focus/notes`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create quick note");
    return response.json();
  },

  async deleteQuickNote(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API}/focus/notes/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete quick note");
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
