import { API_BASE_URL } from "../context/AuthContext";
import type { ApiNotification } from "./types";

const API = "/api/v1";

export const notificationApi = {
  async getAll(params?: {
    unreadOnly?: boolean;
    limit?: number;
  }): Promise<ApiNotification[]> {
    const searchParams = new URLSearchParams();
    if (params?.unreadOnly) searchParams.set("unreadOnly", "true");
    if (params?.limit) searchParams.set("limit", String(params.limit));

    const query = searchParams.toString();
    const response = await fetch(`${API_BASE_URL}${API}/notifications${query ? `?${query}` : ""}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch notifications");
    return response.json();
  },

  async getUnreadCount(): Promise<{ count: number }> {
    const response = await fetch(`${API_BASE_URL}${API}/notifications/unread/count`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch unread count");
    return response.json();
  },

  async markAsRead(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API}/notifications/${id}/read`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to mark notification as read");
  },

  async markAllAsRead(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API}/notifications/read-all`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to mark all notifications as read");
  },

  async dismiss(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API}/notifications/${id}/dismiss`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to dismiss notification");
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API}/notifications/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete notification");
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
