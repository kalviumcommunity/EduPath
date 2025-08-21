import { createContext, useState, useEffect, useContext } from "react";
import { authService, shortlistService } from "../services/api.service";

// Create auth context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [postSignup, setPostSignup] = useState(false);
  const [shortlist, setShortlist] = useState([]);

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
          // Load shortlist after profile fetch (if exists in response)
          if (response.data.shortlist) setShortlist(response.data.shortlist);
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
  const register = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.register(userData);
      console.log('Register API response:', response);
      
      if (response.success) {
        console.log('Setting auth token and user state after registration');
        localStorage.setItem("token", response.data.token);
        setUser(response.data.user); // set immediately
  if (response.data.user.shortlist) setShortlist(response.data.user.shortlist);
        setPostSignup(true);
        console.log('User state updated after registration');
        return response;
      } else {
        throw new Error(response.error || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.response?.data?.error?.message || "Registration failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (credentials) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.login(credentials);
      if (response.success) {
        localStorage.setItem("token", response.data.token);
        setUser(response.data.user);
  if (response.data.user.shortlist) setShortlist(response.data.user.shortlist);
        return response;
      } else {
        throw new Error(response.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.error?.message || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  setPostSignup(false);
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.updateProfile(profileData);
      if (response.success) {
        setUser((prev) => ({
          ...prev,
          profile: response.data.profile,
        }));
      }
      return response;
    } catch (err) {
      setError(err.response?.data?.error?.message || "Profile update failed");
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
  const value = {
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
    addToShortlist: async (universityId, matchScore) => {
      try {
        const res = await shortlistService.add(universityId, matchScore);
        if (res.shortlist) setShortlist(res.shortlist);
        return res;
      } catch (e) {
        console.error('Add to shortlist failed', e);
        throw e;
      }
    },
    removeFromShortlist: async (id) => {
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
    clearPostSignup: () => setPostSignup(false)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
