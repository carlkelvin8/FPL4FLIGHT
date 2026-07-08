import { describe, it, expect, jest, beforeEach } from "@jest/globals";

import { RegisterUseCase } from "../usecases/RegisterUseCase";

jest.mock("../../../core/network", () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
    },
  },
}));

jest.mock("../../../core/storage", () => ({
  secureStorage: {
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  },
  AUTH_TOKEN_KEY: "auth_token",
  REFRESH_TOKEN_KEY: "refresh_token",
  SESSION_KEY: "session",
}));

/** Helper to get the mocked supabase.auth.signUp reference. */
function mockSignUp() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const network = require("../../../core/network") as Record<string, unknown>;
  const supabase = network.supabase as Record<string, Record<string, unknown>>;
  const auth = supabase.auth as Record<string, unknown>;
  return auth.signUp as { mockResolvedValue: (v: unknown) => void };
}

describe("RegisterUseCase", () => {
  let useCase: RegisterUseCase;

  beforeEach(() => {
    useCase = new RegisterUseCase();
    jest.clearAllMocks();
  });

  it("returns success when registration succeeds", async () => {
    mockSignUp().mockResolvedValue({
      data: {
        session: {
          access_token: "new-access-token",
          refresh_token: "new-refresh-token",
          expires_at: 9999999999,
          user: {
            id: "new-user",
            app_metadata: { role: "pilot" },
          },
        },
      },
      error: null,
    });

    const result = await useCase.execute({
      email: "newpilot@example.com",
      password: "StrongPass1!",
      confirmPassword: "StrongPass1!",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accessToken).toBe("new-access-token");
    }
  });

  it("returns INVALID_EMAIL for malformed email", async () => {
    const result = await useCase.execute({
      email: "bad-email",
      password: "StrongPass1!",
      confirmPassword: "StrongPass1!",
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("INVALID_EMAIL");
  });

  it("returns INVALID_PASSWORD for weak password", async () => {
    const result = await useCase.execute({
      email: "pilot@example.com",
      password: "weak",
      confirmPassword: "weak",
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("INVALID_PASSWORD");
  });

  it("returns PASSWORD_MISMATCH when passwords do not match", async () => {
    const result = await useCase.execute({
      email: "pilot@example.com",
      password: "StrongPass1!",
      confirmPassword: "DifferentPass1!",
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("PASSWORD_MISMATCH");
  });

  it("returns EMAIL_EXISTS when email is already registered", async () => {
    mockSignUp().mockResolvedValue({
      data: { session: null },
      error: { message: "Email already in use", status: 400 },
    });

    const result = await useCase.execute({
      email: "existing@example.com",
      password: "StrongPass1!",
      confirmPassword: "StrongPass1!",
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("EMAIL_EXISTS");
  });

  it("returns EMAIL_CONFIRMATION_REQUIRED when sign-up succeeds but no session", async () => {
    mockSignUp().mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const result = await useCase.execute({
      email: "newpilot@example.com",
      password: "StrongPass1!",
      confirmPassword: "StrongPass1!",
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("EMAIL_CONFIRMATION_REQUIRED");
  });

  it("returns TOO_MANY_REQUESTS on rate limit error", async () => {
    mockSignUp().mockResolvedValue({
      data: { session: null },
      error: { message: "Rate limit exceeded", status: 429 },
    });

    const result = await useCase.execute({
      email: "pilot@example.com",
      password: "StrongPass1!",
      confirmPassword: "StrongPass1!",
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("TOO_MANY_REQUESTS");
  });
});
