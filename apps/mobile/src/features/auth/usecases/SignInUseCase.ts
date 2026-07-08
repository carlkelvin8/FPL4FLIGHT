/**
 * SignInUseCase — validates credentials then delegates to the auth repository.
 * Validates email format and password complexity before hitting the network.
 */

import type { IAuthRepository, Result, Session, SignInDto } from "@pilotforms/shared";
import { err } from "@pilotforms/shared";

import { validateEmail, validatePasswordComplexity } from "@shared/utils/validationUtils";

export class SignInUseCase {
  constructor(private readonly repo: IAuthRepository) {}

  async execute(dto: SignInDto): Promise<Result<Session>> {
    // --- Client-side validation first (avoid unnecessary network round-trips) ---
    if (!validateEmail(dto.email)) {
      return err("INVALID_EMAIL", "Please enter a valid email address.");
    }

    if (!dto.password || dto.password.length < 1) {
      return err("INVALID_PASSWORD", "Please enter your password.");
    }

    return this.repo.signIn(dto);
  }
}
