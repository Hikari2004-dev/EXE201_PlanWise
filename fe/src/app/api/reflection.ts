import { API_BASE_URL } from "../context/AuthContext";
import type { ApiDailyReflection } from "./types";

const API = "/api/v1";

export const reflectionApi = {
  async getByDate(date: string): Promise<ApiDailyReflection | null> {
    const response = await fetch(`${API_BASE_URL}${API}/reflections/date?date=${date}`, {
      headers: getAuthHeaders(),
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Failed to fetch reflection");
    return response.json();
  },

  async createOrUpdate(date: string, data: {
    completed?: string;
    obstacles?: string;
    improvements?: string;
    energyLevel?: number;
    mood?: string;
  }): Promise<ApiDailyReflection> {
    const response = await fetch(`${API_BASE_URL}${API}/reflections`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        reflectionDate: date,
        ...data,
      }),
    });
    if (!response.ok) throw new Error("Failed to save reflection");
    return response.json();
  },

  async getHistory(): Promise<ApiDailyReflection[]> {
    const response = await fetch(`${API_BASE_URL}${API}/reflections`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch reflection history");
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
