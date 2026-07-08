import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import type { IAuthRepository , Result, Session } from "@pilotforms/shared";

import { RefreshTokenUseCase } from "../usecases/RefreshTokenUseCase";

const mockSession: Session = {
  userId: "user-1",
  accessToken: "refreshed-token",
  refreshToken: "refreshed-refresh-token",
  expiresAt: new Date("2099-01-01"),
  role: "pilot",
};

function createMockRepo() {
  return {
    signIn: jest.fn(),
    signOut: jest.fn(),
    refreshSession: jest.fn<(...args: any[]) => Promise<Result<Session>>>(),
    verifyMFA: jest.fn(),
  };
}

describe("RefreshTokenUseCase", () => {
  let mockRepo: ReturnType<typeof createMockRepo>;
  let useCase: RefreshTokenUseCase;

  beforeEach(() => {
    mockRepo = createMockRepo();
    useCase = new RefreshTokenUseCase(mockRepo as unknown as IAuthRepository);
  });

  it("returns success with refreshed session when token is valid", async () => {
    mockRepo.refreshSession.mockResolvedValue({ success: true, data: mockSession });

    const result = await useCase.execute();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accessToken).toBe("refreshed-token");
    }
    expect(mockRepo.refreshSession).toHaveBeenCalledTimes(1);
  });

  it("returns SESSION_EXPIRED when refresh fails", async () => {
    mockRepo.refreshSession.mockResolvedValue({
      success: false,
      error: { code: "SESSION_EXPIRED", message: "No refresh token found. Please sign in again." },
    });

    const result = await useCase.execute();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("SESSION_EXPIRED");
    }
  });

  it("propagates network errors from repository", async () => {
    mockRepo.refreshSession.mockResolvedValue({
      success: false,
      error: { code: "NETWORK_ERROR", message: "Network error during token refresh." },
    });

    const result = await useCase.execute();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("NETWORK_ERROR");
    }
  });
});
