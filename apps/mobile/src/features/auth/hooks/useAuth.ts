import type { SignInDto } from "@pilotforms/shared";
import { useRouter } from "expo-router";
import { useCallback } from "react";

import { AuthRepository, AUTH_ERROR_CODES } from "../repositories/AuthRepository";
import { useAuthStore } from "../stores/authStore";
import { RegisterUseCase, type RegisterDto } from "../usecases/RegisterUseCase";
import { SignInUseCase } from "../usecases/SignInUseCase";
import { SignOutUseCase } from "../usecases/SignOutUseCase";
import { unregisterPushNotifications } from "@core/push-notifications";


const repo = new AuthRepository();
const signInUseCase = new SignInUseCase(repo);
const signOutUseCase = new SignOutUseCase(repo);
const registerUseCase = new RegisterUseCase();

export function useAuth() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { session, user, isLoading, error, mfaPending, setSession, setUser, setLoading, setError, setMfaPending, reset } =
    useAuthStore();

  const signIn = useCallback(
    async (dto: SignInDto) => {
      setLoading(true);
      setError(null);
      const result = await signInUseCase.execute(dto);
      if (result.success) {
        setSession(result.data);
        setUser({ id: result.data.userId, email: dto.email, role: result.data.role });
        setLoading(false);
        // Explicitly navigate to app after successful login
        router.replace("/(app)/forms");
      } else {
        setError(result.error);
        setLoading(false);
      }
    },
    [router, setError, setLoading, setMfaPending, setSession, setUser],
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Remove push token from DB before signing out
      await unregisterPushNotifications();
      await signOutUseCase.execute();
    } catch {
      // Sign out failed — still clear local state
    }
    reset();
    setLoading(false);
    router.replace("/(auth)/login");
  }, [router, reset, setError, setLoading]);

  const register = useCallback(
    async (dto: RegisterDto) => {
      setLoading(true);
      setError(null);
      const result = await registerUseCase.execute(dto);
      if (result.success) {
        setSession(result.data);
        setUser({ id: result.data.userId, email: dto.email, role: result.data.role });
        setLoading(false);
        // Navigation handled by root auth guard on session change
      } else {
        setError(result.error);
        setLoading(false);
      }
    },
    [router, setError, setLoading, setSession, setUser],
  );

  const verifyMFA = useCallback(
    async (code: string) => {
      setLoading(true);
      setError(null);
      const result = await repo.verifyMFA(code);
      if (result.success) {
        setMfaPending(false);
        setSession(result.data);
        setUser({ id: result.data.userId, email: user?.email ?? "", role: result.data.role });
        setLoading(false);
        // Navigation handled by root auth guard on session change
      } else {
        setError(result.error);
        setLoading(false);
      }
    },
    [router, setError, setLoading, setMfaPending, setSession, setUser, user],
  );

  return { session, user, isLoading, error, mfaPending, signIn, signOut, register, verifyMFA };
}
