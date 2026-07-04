/**
 * SignOutUseCase — delegates sign-out to the auth repository.
 */

import type { IAuthRepository } from "@pilotforms/shared";
import type { Result } from "@pilotforms/shared";

export class SignOutUseCase {
  constructor(private readonly repo: IAuthRepository) {}

  async execute(): Promise<Result<void>> {
    return this.repo.signOut();
  }
}
