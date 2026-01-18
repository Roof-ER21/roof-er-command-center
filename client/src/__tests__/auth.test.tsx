import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth, useModuleAccess } from '@/hooks/useAuth';
import type { User } from '@/types';

// Mock fetch globally
global.fetch = vi.fn();

// Helper to create wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication State', () => {
    it('should start with loading state', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should fetch and set user when authenticated', async () => {
      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'EMPLOYEE',
        hasHRAccess: false,
        hasLeaderboardAccess: true,
        hasTrainingAccess: true,
        hasFieldAccess: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle unauthenticated state', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Login Flow', () => {
    it('should login with password successfully', async () => {
      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'EMPLOYEE',
        hasHRAccess: false,
        hasLeaderboardAccess: true,
        hasTrainingAccess: true,
        hasFieldAccess: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Mock initial auth check (unauthenticated)
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock login request
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      });

      // Perform login
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle login failure', async () => {
      // Mock initial auth check
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock failed login
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid credentials' }),
      });

      await expect(
        result.current.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow();

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should login with PIN successfully', async () => {
      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'EMPLOYEE',
        hasHRAccess: false,
        hasLeaderboardAccess: false,
        hasTrainingAccess: true,
        hasFieldAccess: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Mock initial auth check
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock PIN login
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      });

      await result.current.loginWithPin({ pin: '1234' });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Logout Flow', () => {
    it('should logout successfully', async () => {
      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'EMPLOYEE',
        hasHRAccess: false,
        hasLeaderboardAccess: true,
        hasTrainingAccess: true,
        hasFieldAccess: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Mock authenticated state
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Mock logout
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await result.current.logout();

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});

describe('useModuleAccess Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return false when user is not authenticated', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    const { result } = renderHook(() => useModuleAccess('training'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('should return true when user has module access', async () => {
    const mockUser: User = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      role: 'EMPLOYEE',
      hasHRAccess: false,
      hasLeaderboardAccess: true,
      hasTrainingAccess: true,
      hasFieldAccess: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    });

    const { result } = renderHook(() => useModuleAccess('training'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('should return false when user lacks module access', async () => {
    const mockUser: User = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      role: 'EMPLOYEE',
      hasHRAccess: false,
      hasLeaderboardAccess: false,
      hasTrainingAccess: false,
      hasFieldAccess: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    });

    const { result } = renderHook(() => useModuleAccess('hr'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('should check different module permissions correctly', async () => {
    const mockUser: User = {
      id: 1,
      email: 'admin@example.com',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      role: 'SYSTEM_ADMIN',
      hasHRAccess: true,
      hasLeaderboardAccess: true,
      hasTrainingAccess: true,
      hasFieldAccess: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ user: mockUser }),
    });

    const { result: hrResult } = renderHook(() => useModuleAccess('hr'), {
      wrapper: createWrapper(),
    });
    const { result: leaderboardResult } = renderHook(() => useModuleAccess('leaderboard'), {
      wrapper: createWrapper(),
    });
    const { result: trainingResult } = renderHook(() => useModuleAccess('training'), {
      wrapper: createWrapper(),
    });
    const { result: fieldResult } = renderHook(() => useModuleAccess('field'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(hrResult.current).toBe(true);
      expect(leaderboardResult.current).toBe(true);
      expect(trainingResult.current).toBe(true);
      expect(fieldResult.current).toBe(true);
    });
  });
});
