import { API_BASE_URL } from "../context/AuthContext";
import type {
  ApprovePlannerDraftRequest,
  GeneratePlannerDraftRequest,
  PlannerApprovalResponse,
  PlannerDraftResponse,
} from "./types";

const API = "/api/v1";

export const aiPlannerAssistantApi = {
  async generate(data: GeneratePlannerDraftRequest): Promise<PlannerDraftResponse> {
    const response = await fetch(`${API_BASE_URL}${API}/ai/planner/generate`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, "Failed to generate planner draft"));
    }
    return response.json();
  },

  async getDraft(draftId: string): Promise<PlannerDraftResponse> {
    const response = await fetch(`${API_BASE_URL}${API}/ai/planner/drafts/${draftId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, "Failed to load planner draft"));
    }
    return response.json();
  },

  async approve(draftId: string, data: ApprovePlannerDraftRequest = {}): Promise<PlannerApprovalResponse> {
    const response = await fetch(`${API_BASE_URL}${API}/ai/planner/drafts/${draftId}/approve`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, "Failed to apply planner draft"));
    }
    return response.json();
  },
};

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  const token = localStorage.getItem("accessToken");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function getErrorMessage(response: Response, fallback: string) {
  const payload = await response.json().catch(() => null);
  if (payload && typeof payload.message === "string") {
    return payload.message;
  }
  if (response.status === 503) {
    return "AI service unavailable. Please try again later.";
  }
  return fallback;
}
