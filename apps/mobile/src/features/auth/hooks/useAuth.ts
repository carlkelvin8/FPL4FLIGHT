import { useCallback } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "../stores/authStore";
import { AuthRepository } from "../repositories/AuthRepository";
import { SignInUseCase } from "../usecases/SignInUseCase";
import { SignOutUseCase } from "../usecases/SignOutUseCase";
import { RegisterUseCase, type RegisterDto } from "../usecases/RegisterUseCase";
import { RefreshTokenUseCase } from "../usecases/RefreshTokenUseCase";
import type { SignInDto } from "@pilotforms/shared";

const repo = new AuthRepository();
const signInUseCase = new SignInUseCase(repo);
const signOutUseCase = new SignOutUseCase(repo);
const registerUseCase = new RegisterUseCase();
const refreshTokenUseCase = new RefreshTokenUseCase(repo);

export function useAuth() {
  const router = useRouter();
  const { session, user, isLoading, error, setSession, setUser, setLoading, setError, reset } =
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
        router.replace("/(app)/forms");
      } else {
        setError(result.error);
        setLoading(false);
      }
    },
    [router, setError, setLoading, setSession, setUser],
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    await signOutUseCase.execute();
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
        router.replace("/(app)/forms");
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
        setSession(result.data);
        setUser({ id: result.data.userId, email: user?.email ?? "", role: result.data.role });
        setLoading(false);
        router.replace("/(app)/forms");
      } else {
        setError(result.error);
        setLoading(false);
      }
    },
    [router, setError, setLoading, setSession, setUser, user],
  );

  return { session, user, isLoading, error, signIn, signOut, register, verifyMFA };
}
