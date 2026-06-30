import { API_BASE_URL } from "../context/AuthContext";
import type {
  CreateGoalFromDraftRequest,
  ApiGoal,
  GenerateGoalDraftRequest,
  GoalDraftResponse,
} from "./types";

const API = "/api/v1";

export const aiGoalPlannerApi = {
  async generate(data: GenerateGoalDraftRequest): Promise<GoalDraftResponse> {
    const response = await fetch(`${API_BASE_URL}${API}/ai/goals/generate`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to generate AI goal draft");
    return response.json();
  },

  async createGoalFromDraft(data: CreateGoalFromDraftRequest): Promise<ApiGoal> {
    const response = await fetch(`${API_BASE_URL}${API}/goals/create-from-draft`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create goal from AI draft");
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
