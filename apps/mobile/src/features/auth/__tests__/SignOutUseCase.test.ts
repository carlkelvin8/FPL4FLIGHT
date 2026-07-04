import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import type { IAuthRepository } from "@pilotforms/shared";
import type { Result } from "@pilotforms/shared";
import { SignOutUseCase } from "../usecases/SignOutUseCase";

function createMockRepo() {
  return {
    signIn: jest.fn(),
    signOut: jest.fn<(...args: any[]) => Promise<Result<void>>>(),
    refreshSession: jest.fn(),
    verifyMFA: jest.fn(),
  };
}

describe("SignOutUseCase", () => {
  let mockRepo: ReturnType<typeof createMockRepo>;
  let useCase: SignOutUseCase;

  beforeEach(() => {
    mockRepo = createMockRepo();
    useCase = new SignOutUseCase(mockRepo as unknown as IAuthRepository);
  });

  it("returns success when sign-out succeeds", async () => {
    mockRepo.signOut.mockResolvedValue({ success: true, data: undefined });

    const result = await useCase.execute();

    expect(result.success).toBe(true);
    expect(mockRepo.signOut).toHaveBeenCalledTimes(1);
  });

  it("propagates error when sign-out fails", async () => {
    mockRepo.signOut.mockResolvedValue({
      success: false,
      error: { code: "NETWORK_ERROR", message: "Network error during sign out." },
    });

    const result = await useCase.execute();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("NETWORK_ERROR");
    }
  });

  it("delegates directly to repository without additional logic", async () => {
    mockRepo.signOut.mockResolvedValue({ success: true, data: undefined });

    await useCase.execute();

    expect(mockRepo.signOut).toHaveBeenCalledWith();
  });
});
