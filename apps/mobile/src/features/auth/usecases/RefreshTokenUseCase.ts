/**
 * RefreshTokenUseCase — delegates session refresh to the auth repository.
 */

import type { IAuthRepository , Result , Session } from "@pilotforms/shared";



export class RefreshTokenUseCase {
  constructor(private readonly repo: IAuthRepository) {}

  async execute(): Promise<Result<Session>> {
    return this.repo.refreshSession();
  }
}
