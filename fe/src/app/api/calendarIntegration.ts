import { API_BASE_URL } from "../context/AuthContext";

const API = "/api/v1/calendar-integrations";

export type CalendarConnectionState = "READY" | "DISCONNECTED" | "ERROR";

export interface CalendarIntegrationStatus {
  provider: string;
  connected: boolean;
  applicationCalendarId?: string;
  applicationCalendarName?: string;
  state: CalendarConnectionState;
  message?: string;
}

export interface CalendarSyncResponse {
  provider: string;
  total: number;
  synchronizedCount: number;
  failedCount: number;
  errors: string[];
}

export const calendarIntegrationApi = {
  async getStatuses(): Promise<CalendarIntegrationStatus[]> {
    return request<CalendarIntegrationStatus[]>(API);
  },

  async sync(provider: string): Promise<CalendarSyncResponse> {
    return request<CalendarSyncResponse>(`${API}/${provider}/sync`, {
      method: "POST",
    });
  },
};

export function getGoogleAuthorizationUrl(): string {
  const callbackUrl = `${window.location.origin}/auth/callback`;
  return `${API_BASE_URL}/api/v1/oauth2/authorize/google?redirect_uri=${encodeURIComponent(callbackUrl)}`;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("accessToken");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || `HTTP ${response.status}`);
  }
  return response.json();
}
