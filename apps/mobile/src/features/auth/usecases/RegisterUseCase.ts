/**
 * RegisterUseCase — validates registration inputs and creates a new account.
 * Uses the Supabase client directly for signUp (not part of IAuthRepository).
 */

import type { Result , Session } from "@pilotforms/shared";
import { ok, err } from "@pilotforms/shared";

import { supabase } from "@core/network";
import {
  secureStorage,
  AUTH_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  SESSION_KEY,
} from "@core/storage";
import { validateEmail, validatePasswordComplexity } from "@shared/utils/validationUtils";
import { AUTH_ERROR_CODES } from "../repositories/AuthRepository";

export interface RegisterDto {
  email: string;
  password: string;
  confirmPassword: string;
}

export class RegisterUseCase {
  async execute(dto: RegisterDto): Promise<Result<Session>> {
    // --- Client-side validation ---
    if (!validateEmail(dto.email)) {
      return err("INVALID_EMAIL", "Please enter a valid email address.");
    }

    const passwordError = validatePasswordComplexity(dto.password);
    if (passwordError) {
      return err("INVALID_PASSWORD", passwordError);
    }

    if (dto.password !== dto.confirmPassword) {
      return err("PASSWORD_MISMATCH", "Passwords do not match. Please re-enter your password.");
    }

    // --- Create account via Supabase ---
    try {
      const { data, error } = await supabase.auth.signUp({
        email: dto.email,
        password: dto.password,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("already registered") || msg.includes("email already in use")) {
          return err(AUTH_ERROR_CODES.EMAIL_EXISTS, "An account with this email already exists.");
        }
        if (error.status === 429 || msg.includes("rate limit")) {
          return err(AUTH_ERROR_CODES.TOO_MANY_REQUESTS, "Too many requests. Please wait and try again.");
        }
        return err(AUTH_ERROR_CODES.UNKNOWN, error.message, error);
      }

      if (!data.session) {
        // Email confirmation required — sign-up succeeded but no session yet
        return err(
          "EMAIL_CONFIRMATION_REQUIRED",
          "Account created! Please check your email to confirm your address before signing in."
        );
      }

      const session: Session = {
        userId: data.session.user.id,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at
          ? new Date(data.session.expires_at * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        role:
          (data.session.user.app_metadata?.role as "pilot" | "admin" | undefined) ??
          "pilot",
      };

      await Promise.all([
        secureStorage.set(AUTH_TOKEN_KEY, session.accessToken),
        secureStorage.set(REFRESH_TOKEN_KEY, session.refreshToken),
        secureStorage.set(SESSION_KEY, JSON.stringify(session)),
      ]);

      return ok(session);
    } catch (e) {
      return err(AUTH_ERROR_CODES.NETWORK_ERROR, "Network error during registration.", e);
    }
  }
}
