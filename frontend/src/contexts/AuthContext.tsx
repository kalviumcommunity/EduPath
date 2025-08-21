import { createContext, useState, useEffect, ReactNode, useContext } from "react";
import { authService, shortlistService } from "../services/api.service";

// Define types for responses
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

// Define types for user and auth context
interface UserProfile {
  [key: string]: string | number | boolean | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  profile?: UserProfile;
  [key: string]: string | number | boolean | null | undefined | UserProfile;
}

interface AuthResponse { token: string; user: User; refreshToken?: string }

interface ShortlistItem { _id?: string; universityId?: string; matchScore?: number; [k: string]: unknown }

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  register: (userData: RegisterData) => Promise<ApiResponse<AuthResponse>>;
  login: (credentials: LoginCredentials) => Promise<ApiResponse<AuthResponse>>;
  logout: () => void;
  updateProfile: (profileData: ProfileData) => Promise<ApiResponse<{profile: UserProfile}>>;
  refreshUser: () => Promise<ApiResponse<User> | null>;
  shortlist: ShortlistItem[];
  fetchShortlist: () => Promise<ShortlistItem[]>;
  addToShortlist: (universityId: string, matchScore: number) => Promise<ShortlistItem[]>;
  removeFromShortlist: (id: string) => Promise<ShortlistItem[]>;
  isAuthenticated: boolean;
  postSignup: boolean;
  clearPostSignup: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  [key: string]: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface ProfileData {
  [key: string]: string | number | boolean | null;
}

// Create auth context
const AuthContext = createContext<AuthContextType | null>(null);

// Auth provider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [postSignup, setPostSignup] = useState(false);
  const [shortlist, setShortlist] = useState<ShortlistItem[]>([]);

  // Load user from localStorage on component mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await authService.getProfile();
        if (response.success) {
          setUser(response.data);
        }
      } catch (err) {
        console.error("Failed to load user:", err);
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Register user
  const register = async (userData: RegisterData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.register(userData);
      console.log('Register API response:', response);
      
      if (response.success) {
        console.log('Setting auth token and user state after registration');
  localStorage.setItem("token", response.data.token);
        const rData = response.data as AuthResponse;
        if ((rData as AuthResponse & { refreshToken?: string }).refreshToken) {
          localStorage.setItem('refreshToken', (rData as AuthResponse & { refreshToken?: string }).refreshToken!);
        }
        // Set user immediately so redirects treat the user as authenticated
        setUser(response.data.user);
        setPostSignup(true);
        console.log('User state updated after registration');
        return response;
      } else {
        throw new Error(response.error || "Registration failed");
      }
    } catch (err: unknown) {
      console.error("Registration error:", err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Registration failed";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.login(credentials);
      if (response.success) {
  localStorage.setItem("token", response.data.token);
        const rData = response.data as AuthResponse;
        if ((rData as AuthResponse & { refreshToken?: string }).refreshToken) {
          localStorage.setItem('refreshToken', (rData as AuthResponse & { refreshToken?: string }).refreshToken!);
        }
        setUser(response.data.user);
        return response;
      } else {
        throw new Error(response.error || "Login failed");
      }
    } catch (err: unknown) {
      console.error("Login error:", err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Login failed";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem('refreshToken');
    setUser(null);
    setPostSignup(false);
  };

  // Update user profile
  const updateProfile = async (profileData: ProfileData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.updateProfile(profileData);
      if (response.success) {
        setUser((prev) => 
          prev ? {
            ...prev,
            profile: response.data.profile,
          } : null
        );
      }
      return response;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Profile update failed";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Force re-fetch current user (e.g., after profile update elsewhere)
  const refreshUser = async () => {
    try {
      const response = await authService.getProfile();
      if (response.success) {
        setUser(response.data);
        if (response.data.shortlist) setShortlist(response.data.shortlist);
      }
      return response;
    } catch (e) {
      console.error('Failed to refresh user', e);
      return null;
    }
  };

  // Context value
  const value: AuthContextType = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    refreshUser,
    shortlist,
    // Shortlist handlers
    fetchShortlist: async () => {
      try {
        const res = await shortlistService.getShortlist();
        if (res.shortlist) setShortlist(res.shortlist);
        return res.shortlist || [];
      } catch (e) {
        console.error('Fetch shortlist failed', e);
        return [];
      }
    },
    addToShortlist: async (universityId: string, matchScore: number) => {
      try {
        const res = await shortlistService.add(universityId, matchScore);
        if (res.shortlist) setShortlist(res.shortlist);
        return res;
      } catch (e) {
        console.error('Add to shortlist failed', e);
        throw e;
      }
    },
    removeFromShortlist: async (id: string) => {
      try {
        const res = await shortlistService.remove(id);
        if (res.shortlist) setShortlist(res.shortlist);
        return res;
      } catch (e) {
        console.error('Remove from shortlist failed', e);
        throw e;
      }
    },
    isAuthenticated: !!user,
    postSignup,
    clearPostSignup: () => setPostSignup(false),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
