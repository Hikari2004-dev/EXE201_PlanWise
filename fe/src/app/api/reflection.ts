import { API_BASE_URL } from "../context/AuthContext";
import type { ApiDailyReflection } from "./types";

const API = "/api/v1";

export const reflectionApi = {
  async getByDate(date: string): Promise<ApiDailyReflection | null> {
    const response = await fetch(`${API_BASE_URL}${API}/reflections/${date}`, {
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
    const response = await fetch(`${API_BASE_URL}${API}/reflections/${date}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to save reflection");
    return response.json();
  },

  async getHistory(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiDailyReflection[]> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set("startDate", params.startDate);
    if (params?.endDate) searchParams.set("endDate", params.endDate);

    const query = searchParams.toString();
    const response = await fetch(`${API_BASE_URL}${API}/reflections${query ? `?${query}` : ""}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch reflection history");
    return response.json();
  },

  async delete(date: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API}/reflections/${date}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete reflection");
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
