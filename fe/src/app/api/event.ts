import { API_BASE_URL } from "../context/AuthContext";
import type { ApiCalendarEvent } from "./types";

const API = "/api/v1";

export const eventApi = {
  async getAll(params?: {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
  }): Promise<ApiCalendarEvent[]> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set("startDate", params.startDate);
    if (params?.endDate) searchParams.set("endDate", params.endDate);
    if (params?.categoryId) searchParams.set("categoryId", params.categoryId);

    const query = searchParams.toString();
    const response = await fetch(`${API_BASE_URL}${API}/events${query ? `?${query}` : ""}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch events");
    return response.json();
  },

  async getById(id: string): Promise<ApiCalendarEvent> {
    const response = await fetch(`${API_BASE_URL}${API}/events/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch event");
    return response.json();
  },

  async create(data: {
    title: string;
    eventDate: string;
    startHour: number;
    startMin?: number;
    duration: number;
    color?: string;
    location?: string;
    notes?: string;
    isRecurring?: boolean;
    recurrenceRule?: string;
    categoryId?: string;
  }): Promise<ApiCalendarEvent> {
    const response = await fetch(`${API_BASE_URL}${API}/events`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create event");
    return response.json();
  },

  async update(id: string, data: {
    title?: string;
    eventDate?: string;
    startHour?: number;
    startMin?: number;
    duration?: number;
    color?: string;
    location?: string;
    notes?: string;
    isRecurring?: boolean;
    recurrenceRule?: string;
    categoryId?: string;
  }): Promise<ApiCalendarEvent> {
    const response = await fetch(`${API_BASE_URL}${API}/events/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update event");
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API}/events/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete event");
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
