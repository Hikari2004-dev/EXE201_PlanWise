import { API_BASE_URL } from "../context/AuthContext";
import type { ApiDailyFocus, ApiFocusSession, ApiQuickNote } from "./types";

const API = "/api/v1";

export const focusApi = {
  // Daily Focus
  async getDailyFocus(date: string): Promise<ApiDailyFocus | null> {
    const response = await fetch(`${API_BASE_URL}${API}/focus/daily/${date}`, {
      headers: getAuthHeaders(),
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Failed to fetch daily focus");
    return response.json();
  },

  async createOrUpdateDailyFocus(date: string, data: {
    notes?: string;
    topTaskIds?: string[];
  }): Promise<ApiDailyFocus> {
    const response = await fetch(`${API_BASE_URL}${API}/focus/daily/${date}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update daily focus");
    return response.json();
  },

  // Focus Sessions
  async getSessions(params?: {
    startDate?: string;
    endDate?: string;
    taskId?: string;
  }): Promise<ApiFocusSession[]> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set("startDate", params.startDate);
    if (params?.endDate) searchParams.set("endDate", params.endDate);
    if (params?.taskId) searchParams.set("taskId", params.taskId);

    const query = searchParams.toString();
    const response = await fetch(`${API_BASE_URL}${API}/focus/sessions${query ? `?${query}` : ""}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch focus sessions");
    return response.json();
  },

  async startSession(data: {
    startTime: string;
    duration: number;
    sessionType?: string;
    taskId?: string;
  }): Promise<ApiFocusSession> {
    const response = await fetch(`${API_BASE_URL}${API}/focus/sessions/start`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to start focus session");
    return response.json();
  },

  async endSession(id: string, completed: boolean): Promise<ApiFocusSession> {
    const response = await fetch(`${API_BASE_URL}${API}/focus/sessions/${id}/end`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ completed }),
    });
    if (!response.ok) throw new Error("Failed to end focus session");
    return response.json();
  },

  async deleteSession(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API}/focus/sessions/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete focus session");
  },

  // Quick Notes
  async getQuickNotes(dailyFocusId: string): Promise<ApiQuickNote[]> {
    const response = await fetch(`${API_BASE_URL}${API}/focus/daily/${dailyFocusId}/notes`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch quick notes");
    return response.json();
  },

  async createQuickNote(data: {
    dailyFocusId?: string;
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
