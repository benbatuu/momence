export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'INSTRUCTOR' | 'CLIENT';

export interface UserSession {
  id: string;
  studioId: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseData extends AuthTokens {
  user: UserSession;
}