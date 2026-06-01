import { API_BASE_URL } from "../context/AuthContext";
import type { ApiCategory } from "./types";

const API = "/api/v1";

interface ApiCategoryListResponse {
  categories: ApiCategory[];
}

export const categoryApi = {
  async getAll(): Promise<ApiCategory[]> {
    const response = await fetch(`${API_BASE_URL}${API}/categories`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch categories");
    const data = (await response.json()) as ApiCategory[] | ApiCategoryListResponse;
    return Array.isArray(data) ? data : data.categories || [];
  },

  async getById(id: string): Promise<ApiCategory> {
    const response = await fetch(`${API_BASE_URL}${API}/categories/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch category");
    return response.json();
  },

  async create(data: { name: string; color: string }): Promise<ApiCategory> {
    const response = await fetch(`${API_BASE_URL}${API}/categories`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create category");
    return response.json();
  },

  async update(id: string, data: { name?: string; color?: string; sortOrder?: number }): Promise<ApiCategory> {
    const response = await fetch(`${API_BASE_URL}${API}/categories/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update category");
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API}/categories/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete category");
  },

  async reorder(ids: string[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API}/categories/reorder`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ categoryIds: ids }),
    });
    if (!response.ok) throw new Error("Failed to reorder categories");
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
