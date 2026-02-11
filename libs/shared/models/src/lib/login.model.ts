export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface LoginRequest {
  email: string;
  password?: string; // Optional if using OAuth or other methods, but good to have
}

export interface LoginResponse {
  user: User;
  token: string;
}
