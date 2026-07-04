import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import type { IAuthRepository } from "@pilotforms/shared";
import type { Result, Session, SignInDto } from "@pilotforms/shared";
import { SignInUseCase } from "../usecases/SignInUseCase";

const mockSession: Session = {
  userId: "user-1",
  accessToken: "access-token",
  refreshToken: "refresh-token",
  expiresAt: new Date("2099-01-01"),
  role: "pilot",
};

function createMockRepo() {
  return {
    signIn: jest.fn<(...args: any[]) => Promise<Result<Session>>>(),
    signOut: jest.fn<(...args: any[]) => Promise<Result<void>>>(),
    refreshSession: jest.fn<(...args: any[]) => Promise<Result<Session>>>(),
    verifyMFA: jest.fn<(...args: any[]) => Promise<Result<Session>>>(),
  };
}

describe("SignInUseCase", () => {
  let mockRepo: ReturnType<typeof createMockRepo>;
  let useCase: SignInUseCase;

  beforeEach(() => {
    mockRepo = createMockRepo();
    useCase = new SignInUseCase(mockRepo as unknown as IAuthRepository);
  });

  it("returns success when credentials are valid", async () => {
    mockRepo.signIn.mockResolvedValue({ success: true, data: mockSession });

    const dto: SignInDto = { email: "pilot@example.com", password: "ValidPass1!" };
    const result = await useCase.execute(dto);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userId).toBe("user-1");
      expect(result.data.role).toBe("pilot");
    }
    expect(mockRepo.signIn).toHaveBeenCalledWith(dto);
  });

  it("returns INVALID_EMAIL error for malformed email", async () => {
    const dto: SignInDto = { email: "not-an-email", password: "ValidPass1!" };
    const result = await useCase.execute(dto);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("INVALID_EMAIL");
    }
    expect(mockRepo.signIn).not.toHaveBeenCalled();
  });

  it("returns INVALID_PASSWORD error for weak password", async () => {
    const dto: SignInDto = { email: "pilot@example.com", password: "short" };
    const result = await useCase.execute(dto);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("INVALID_PASSWORD");
    }
    expect(mockRepo.signIn).not.toHaveBeenCalled();
  });

  it("propagates auth repository error", async () => {
    mockRepo.signIn.mockResolvedValue({
      success: false,
      error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." },
    });

    const dto: SignInDto = { email: "pilot@example.com", password: "WrongPass1!" };
    const result = await useCase.execute(dto);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("INVALID_CREDENTIALS");
    }
  });

  it("accepts valid email with leading/trailing whitespace", async () => {
    mockRepo.signIn.mockResolvedValue({ success: true, data: mockSession });

    const dto: SignInDto = { email: "  pilot@example.com  ", password: "ValidPass1!" };
    const result = await useCase.execute(dto);

    expect(result.success).toBe(true);
    expect(mockRepo.signIn).toHaveBeenCalledWith(dto);
  });
});
