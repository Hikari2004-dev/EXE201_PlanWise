import { API_BASE_URL } from "../context/AuthContext";
import type {
  ApiVisionItem,
  CreateVisionItemRequest,
  UpdateVisionItemRequest,
  VisionImageUploadRequest,
  VisionImageUploadResponse,
} from "./types";

const API = "/api/v1";

export const visionApi = {
  async getAll(): Promise<ApiVisionItem[]> {
    const response = await fetch(`${API_BASE_URL}${API}/vision`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch vision items");
    return response.json();
  },

  async getById(id: string): Promise<ApiVisionItem> {
    const response = await fetch(`${API_BASE_URL}${API}/vision/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch vision item");
    return response.json();
  },

  async create(data: CreateVisionItemRequest): Promise<ApiVisionItem> {
    const response = await fetch(`${API_BASE_URL}${API}/vision`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create vision item");
    return response.json();
  },

  async update(id: string, data: UpdateVisionItemRequest): Promise<ApiVisionItem> {
    const response = await fetch(`${API_BASE_URL}${API}/vision/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update vision item");
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API}/vision/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete vision item");
  },

  async presignImageUpload(data: VisionImageUploadRequest): Promise<VisionImageUploadResponse> {
    const response = await fetch(`${API_BASE_URL}${API}/vision/images/presign`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to presign vision image upload");
    return response.json();
  },

  async reorder(ids: string[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API}/vision/reorder`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ itemIds: ids }),
    });
    if (!response.ok) throw new Error("Failed to reorder vision items");
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
