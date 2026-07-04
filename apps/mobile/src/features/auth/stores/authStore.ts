/**
 * Zustand auth store — tracks the current auth session, user identity,
 * loading state, and any auth errors.
 */

import { create } from "zustand";
import type { Session, AppError } from "@pilotforms/shared";

export interface AuthUser {
  id: string;
  email: string;
  role: "pilot" | "admin";
}

interface AuthState {
  session: Session | null;
  user: AuthUser | null;
  isLoading: boolean;
  error: AppError | null;

  setSession(session: Session | null): void;
  setUser(user: AuthUser | null): void;
  setLoading(isLoading: boolean): void;
  setError(error: AppError | null): void;
  reset(): void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: false,
  error: null,

  setSession(session) {
    set({ session });
  },

  setUser(user) {
    set({ user });
  },

  setLoading(isLoading) {
    set({ isLoading });
  },

  setError(error) {
    set({ error });
  },

  reset() {
    set({ session: null, user: null, isLoading: false, error: null });
  },
}));
