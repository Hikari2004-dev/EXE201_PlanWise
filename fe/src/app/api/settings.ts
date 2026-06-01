import { API_BASE_URL } from "../context/AuthContext";
import type { ApiUserSettings } from "./types";

const API = "/api/v1";

export const settingsApi = {
  async get(): Promise<ApiUserSettings> {
    const response = await fetch(`${API_BASE_URL}${API}/settings`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch settings");
    return response.json();
  },

  async update(data: {
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
  }): Promise<ApiUserSettings> {
    const response = await fetch(`${API_BASE_URL}${API}/settings`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update settings");
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
