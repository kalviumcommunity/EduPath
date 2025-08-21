// Define types for responses
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

// Define types for user and auth context
export interface UserProfile {
  [key: string]: string | number | boolean | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  profile?: UserProfile;
  [key: string]: string | number | boolean | null | undefined | UserProfile;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  register: (userData: RegisterData) => Promise<ApiResponse<AuthResponse>>;
  login: (credentials: LoginCredentials) => Promise<ApiResponse<AuthResponse>>;
  logout: () => void;
  updateProfile: (profileData: ProfileData) => Promise<ApiResponse<{profile: UserProfile}>>;
  isAuthenticated: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  [key: string]: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ProfileData {
  [key: string]: string | number | boolean | null;
}
