/**
 * IAuthRepository — domain interface for authentication operations.
 * Concrete implementation wraps Supabase Auth in the data layer.
 */

import type { Result } from "../types/result";
import type { Session } from "../entities/session";
import type { SignInDto } from "../types/dtos";

export interface IAuthRepository {
  signIn(credentials: SignInDto): Promise<Result<Session>>;
  signOut(): Promise<Result<void>>;
  refreshSession(): Promise<Result<Session>>;
  /** Verify a TOTP / SMS MFA code and return an upgraded session on success. */
  verifyMFA(code: string): Promise<Result<Session>>;
}
