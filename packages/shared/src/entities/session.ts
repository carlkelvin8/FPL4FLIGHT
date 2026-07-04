/**
 * Session domain entity — represents an authenticated user session.
 * Framework agnostic, no external dependencies.
 */

export interface Session {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  role: "pilot" | "admin";
}
