import { API_BASE_URL } from "../context/AuthContext";
import type { ApiCategory } from "./types";

const API = "/api/v1";

interface ApiCategoryListResponse {
  categories: ApiCategory[];
}

export const categoryApi = {
  async getAll(): Promise<ApiCategory[]> {
    const response = await fetchWithRefresh(`${API}/categories`);
    const data = (await response.json()) as ApiCategory[] | ApiCategoryListResponse;
    return Array.isArray(data) ? data : data.categories || [];
  },

  async getById(id: string): Promise<ApiCategory> {
    const response = await fetchWithRefresh(`${API}/categories/${id}`);
    return response.json();
  },

  async create(data: { name: string; color: string }): Promise<ApiCategory> {
    const response = await fetchWithRefresh(`${API}/categories`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async update(id: string, data: { name?: string; color?: string; sortOrder?: number }): Promise<ApiCategory> {
    const response = await fetchWithRefresh(`${API}/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async delete(id: string): Promise<void> {
    await fetchWithRefresh(`${API}/categories/${id}`, {
      method: "DELETE",
    });
  },

  async reorder(ids: string[]): Promise<void> {
    await fetchWithRefresh(`${API}/categories/reorder`, {
      method: "PUT",
      body: JSON.stringify({ categoryIds: ids }),
    });
  },
};

async function fetchWithRefresh(path: string, options: RequestInit = {}): Promise<Response> {
  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: getAuthHeaders(options.headers),
  });

  if (response.status === 401) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: getAuthHeaders(options.headers, refreshedToken),
      });
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    return null;
  }

  const data = await response.json();
  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  return data.accessToken;
}

function getAuthHeaders(existingHeaders?: HeadersInit, tokenOverride?: string): HeadersInit {
  const headers = new Headers(existingHeaders || {});
  headers.set("Content-Type", "application/json");

  const token = tokenOverride || localStorage.getItem("accessToken");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}
