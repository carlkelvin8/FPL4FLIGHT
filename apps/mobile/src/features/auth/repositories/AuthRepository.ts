/**
 * AuthRepository — concrete Supabase implementation of IAuthRepository.
 * Maps Supabase Auth responses to domain Session entities and
 * stores/clears JWT tokens in expo-secure-store.
 */

import type { IAuthRepository } from "@pilotforms/shared";
import type { Result } from "@pilotforms/shared";
import type { Session } from "@pilotforms/shared";
import type { SignInDto } from "@pilotforms/shared";
import { ok, err } from "@pilotforms/shared";
import { supabase } from "../../../core/network";
import {
  secureStorage,
  AUTH_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  SESSION_KEY,
} from "../../../core/storage";

// ---------------------------------------------------------------------------
// Error code constants
// ---------------------------------------------------------------------------
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
  NETWORK_ERROR: "NETWORK_ERROR",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  MFA_REQUIRED: "MFA_REQUIRED",
  MFA_FAILED: "MFA_FAILED",
  UNKNOWN: "UNKNOWN_AUTH_ERROR",
  EMAIL_EXISTS: "EMAIL_EXISTS",
  WEAK_PASSWORD: "WEAK_PASSWORD",
} as const;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Map a raw Supabase auth error message/status to a typed error code. */
function mapSupabaseError(
  error: { message: string; status?: number | undefined } | null
): { code: string; message: string } {
  if (!error) {
    return {
      code: AUTH_ERROR_CODES.UNKNOWN,
      message: "An unknown authentication error occurred.",
    };
  }

  const msg = error.message.toLowerCase();
  const status = error.status ?? 0;

  if (msg.includes("invalid login credentials") || msg.includes("invalid email or password")) {
    return {
      code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
      message: "Invalid email or password. Please try again.",
    };
  }
  if (status === 429 || msg.includes("too many requests") || msg.includes("rate limit")) {
    return {
      code: AUTH_ERROR_CODES.TOO_MANY_REQUESTS,
      message: "Too many failed attempts. Please wait 15 minutes before trying again.",
    };
  }
  if (msg.includes("network") || msg.includes("fetch") || status === 0) {
    return {
      code: AUTH_ERROR_CODES.NETWORK_ERROR,
      message: "Network error. Please check your connection and try again.",
    };
  }
  if (msg.includes("token is expired") || msg.includes("session expired")) {
    return {
      code: AUTH_ERROR_CODES.SESSION_EXPIRED,
      message: "Your session has expired. Please sign in again.",
    };
  }
  if (msg.includes("mfa") || msg.includes("multi-factor")) {
    return {
      code: AUTH_ERROR_CODES.MFA_REQUIRED,
      message: "Multi-factor authentication is required.",
    };
  }
  if (msg.includes("already registered") || msg.includes("email already in use")) {
    return {
      code: AUTH_ERROR_CODES.EMAIL_EXISTS,
      message: "An account with this email address already exists.",
    };
  }
  if (msg.includes("password") && msg.includes("weak")) {
    return {
      code: AUTH_ERROR_CODES.WEAK_PASSWORD,
      message: "Password does not meet complexity requirements.",
    };
  }

  return {
    code: AUTH_ERROR_CODES.UNKNOWN,
    message: error.message,
  };
}

/** Map a Supabase session object to our domain Session entity. */
function mapSupabaseSession(supabaseSession: {
  access_token: string;
  refresh_token: string;
  expires_at?: number | undefined;
  user: { id: string; email?: string; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> };
}): Session {
  const role =
    (supabaseSession.user.app_metadata?.role as "pilot" | "admin" | undefined) ??
    (supabaseSession.user.user_metadata?.role as "pilot" | "admin" | undefined) ??
    "pilot";

  return {
    userId: supabaseSession.user.id,
    accessToken: supabaseSession.access_token,
    refreshToken: supabaseSession.refresh_token,
    expiresAt: supabaseSession.expires_at
      ? new Date(supabaseSession.expires_at * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
    role,
  };
}

/** Persist session tokens to SecureStore. */
async function persistSession(session: Session): Promise<void> {
  await Promise.all([
    secureStorage.set(AUTH_TOKEN_KEY, session.accessToken),
    secureStorage.set(REFRESH_TOKEN_KEY, session.refreshToken),
    secureStorage.set(SESSION_KEY, JSON.stringify(session)),
  ]);
}

/** Remove session tokens from SecureStore. */
async function clearSession(): Promise<void> {
  await Promise.all([
    secureStorage.delete(AUTH_TOKEN_KEY),
    secureStorage.delete(REFRESH_TOKEN_KEY),
    secureStorage.delete(SESSION_KEY),
  ]);
}

// ---------------------------------------------------------------------------
// AuthRepository implementation
// ---------------------------------------------------------------------------

export class AuthRepository implements IAuthRepository {
  /** Sign in with email and password. Stores tokens on success. */
  async signIn(credentials: SignInDto): Promise<Result<Session>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error || !data.session) {
        const mapped = mapSupabaseError(error);
        return err(mapped.code, mapped.message, error);
      }

      const session = mapSupabaseSession(data.session);
      await persistSession(session);
      return ok(session);
    } catch (e) {
      return err(AUTH_ERROR_CODES.NETWORK_ERROR, "Network error during sign in.", e);
    }
  }

  /** Sign out the current user and clear stored tokens. */
  async signOut(): Promise<Result<void>> {
    try {
      const { error } = await supabase.auth.signOut();
      // Always clear local tokens regardless of server response
      await clearSession();

      if (error) {
        const mapped = mapSupabaseError(error);
        return err(mapped.code, mapped.message, error);
      }

      return ok(undefined);
    } catch (e) {
      // Still clear local state even if request fails
      await clearSession().catch(() => undefined);
      return err(AUTH_ERROR_CODES.NETWORK_ERROR, "Network error during sign out.", e);
    }
  }

  /** Refresh the current session using the stored refresh token. */
  async refreshSession(): Promise<Result<Session>> {
    try {
      const refreshToken = await secureStorage.get(REFRESH_TOKEN_KEY);

      if (!refreshToken) {
        return err(AUTH_ERROR_CODES.SESSION_EXPIRED, "No refresh token found. Please sign in again.");
      }

      const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

      if (error || !data.session) {
        const mapped = mapSupabaseError(error);
        await clearSession();
        return err(mapped.code, mapped.message, error);
      }

      const session = mapSupabaseSession(data.session);
      await persistSession(session);
      return ok(session);
    } catch (e) {
      return err(AUTH_ERROR_CODES.NETWORK_ERROR, "Network error during token refresh.", e);
    }
  }

  /** Verify a TOTP / SMS OTP code for MFA and return an upgraded session. */
  async verifyMFA(code: string): Promise<Result<Session>> {
    try {
      // Use Supabase MFA challenge-and-verify
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();

      if (factorsError) {
        const mapped = mapSupabaseError(factorsError);
        return err(mapped.code, mapped.message, factorsError);
      }

      const totpFactor = factorsData?.totp?.[0];
      const phoneFactor = factorsData?.phone?.[0];
      const factor = totpFactor ?? phoneFactor;

      if (!factor) {
        return err(AUTH_ERROR_CODES.MFA_FAILED, "No MFA factor enrolled on this account.");
      }

      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factor.id,
        code,
      });

      if (error || !data?.access_token) {
        const mapped = mapSupabaseError(error);
        return err(mapped.code, mapped.message ?? "MFA verification failed.", error);
      }

      // Re-fetch the full session after MFA verification
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        return err(AUTH_ERROR_CODES.MFA_FAILED, "Could not retrieve session after MFA verification.");
      }

      const session = mapSupabaseSession(sessionData.session);
      await persistSession(session);
      return ok(session);
    } catch (e) {
      return err(AUTH_ERROR_CODES.NETWORK_ERROR, "Network error during MFA verification.", e);
    }
  }
}

/** Singleton instance for use across the app. */
export const authRepository = new AuthRepository();
