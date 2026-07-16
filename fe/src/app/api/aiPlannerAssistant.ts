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
      throwPlannerAssistantError(response.status, "Failed to generate planner draft");
    }

    return response.json();
  },

  async approve(data: ApprovePlannerDraftRequest): Promise<PlannerApprovalResponse> {
    const response = await fetch(`${API_BASE_URL}${API}/ai/planner/approve`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throwPlannerAssistantError(response.status, "Failed to approve planner draft");
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
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function throwPlannerAssistantError(status: number, fallback: string): never {
  switch (status) {
    case 403:
      throw new Error("Planner limit reached. Upgrade to premium to create more plans.");
    case 503:
      throw new Error("AI service unavailable. Please try again later.");
    default:
      throw new Error(fallback);
  }
}
