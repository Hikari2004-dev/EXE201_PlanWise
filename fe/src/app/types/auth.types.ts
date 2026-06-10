// Auth types khớp với BE AuthResponse DTO

export interface UserInfo {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  language: string;
  role: "USER" | "ADMIN";
  emailVerified: boolean;
  isPremium: boolean;
  premiumExpiresAt: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: UserInfo;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerificationResponse {
  message: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string>;
  timestamp: string;
}
