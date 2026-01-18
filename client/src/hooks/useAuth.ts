import { create } from "zustand";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User, AuthState } from "@/types";

// We'll use zustand for auth state management
interface AuthStore extends AuthState {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// API functions
async function fetchCurrentUser(): Promise<User | null> {
  const response = await fetch("/api/auth/me", {
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      return null;
    }
    throw new Error("Failed to fetch user");
  }

  const data = await response.json();
  return data.user;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface PinCredentials {
  pin: string;
  userId?: number;
}

async function loginWithPassword(credentials: LoginCredentials): Promise<User> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Login failed");
  }

  const data = await response.json();
  return data.user;
}

async function loginWithPin(credentials: PinCredentials): Promise<User> {
  const response = await fetch("/api/auth/pin-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "PIN login failed");
  }

  const data = await response.json();
  return data.user;
}

async function logout(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}

// Main hook
export function useAuth() {
  const { user, isAuthenticated, setUser } = useAuthStore();
  const queryClient = useQueryClient();

  // Initial auth check - single query that updates the store
  const { isLoading, refetch } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        const userData = await fetchCurrentUser();
        setUser(userData);
        return userData;
      } catch {
        setUser(null);
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: loginWithPassword,
    onSuccess: (userData) => {
      setUser(userData);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });

  // PIN login mutation
  const pinLoginMutation = useMutation({
    mutationFn: loginWithPin,
    onSuccess: (userData) => {
      setUser(userData);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated,
    login: loginMutation.mutateAsync,
    loginWithPin: pinLoginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoginPending: loginMutation.isPending,
    isPinLoginPending: pinLoginMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
    loginError: loginMutation.error,
    pinLoginError: pinLoginMutation.error,
    refetch,
  };
}

// Hook to check module access
export function useModuleAccess(module: 'hr' | 'leaderboard' | 'training' | 'field') {
  const { user } = useAuth();

  if (!user) return false;

  switch (module) {
    case 'hr':
      return user.hasHRAccess;
    case 'leaderboard':
      return user.hasLeaderboardAccess;
    case 'training':
      return user.hasTrainingAccess;
    case 'field':
      return user.hasFieldAccess;
    default:
      return false;
  }
}
