/**
 * Unit tests for Result<T> — verifies the discriminated union, helpers, and
 * TypeScript type narrowing behaviour.
 */

import { describe, it, expect, expectTypeOf } from "vitest";
import {
  ok,
  err,
  isOk,
  isErr,
  type Result,
  type AppError,
} from "../types/result";

// ---------------------------------------------------------------------------
// ok() constructor
// ---------------------------------------------------------------------------

describe("ok()", () => {
  it("creates a success result with the given data", () => {
    const result = ok(42);
    expect(result.success).toBe(true);
    expect((result as Extract<typeof result, { success: true }>).data).toBe(42);
  });

  it("works with object payloads", () => {
    const payload = { id: "abc", name: "Test Form" };
    const result = ok(payload);
    expect(result.success).toBe(true);
    expect((result as Extract<typeof result, { success: true }>).data).toEqual(
      payload
    );
  });

  it("works with null and undefined", () => {
    expect(ok(null).success).toBe(true);
    expect(ok(undefined).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// err() constructor
// ---------------------------------------------------------------------------

describe("err()", () => {
  it("creates a failure result with the given code and message", () => {
    const result = err("NOT_FOUND", "Form not found");
    expect(result.success).toBe(false);
    const failure = result as Extract<typeof result, { success: false }>;
    expect(failure.error.code).toBe("NOT_FOUND");
    expect(failure.error.message).toBe("Form not found");
    expect(failure.error.details).toBeUndefined();
  });

  it("includes optional details when provided", () => {
    const details = { id: "missing-id" };
    const result = err("NOT_FOUND", "Form not found", details);
    const failure = result as Extract<typeof result, { success: false }>;
    expect(failure.error.details).toEqual(details);
  });
});

// ---------------------------------------------------------------------------
// isOk() type guard
// ---------------------------------------------------------------------------

describe("isOk()", () => {
  it("returns true for a successful result", () => {
    expect(isOk(ok("hello"))).toBe(true);
  });

  it("returns false for a failed result", () => {
    expect(isOk(err("ERR", "something failed"))).toBe(false);
  });

  it("narrows the type to the success branch inside an if-block", () => {
    const result: Result<string> = ok("narrowed");
    if (isOk(result)) {
      // TypeScript should know result.data is a string here
      expectTypeOf(result.data).toBeString();
      expect(result.data).toBe("narrowed");
    }
  });

  it("does not access .data on an error result", () => {
    const result: Result<string> = err("ERR", "fail");
    // This branch should never execute — proves the guard works correctly
    if (isOk(result)) {
      throw new Error("Should not be reached");
    }
    // Access error safely
    expect(result.error.code).toBe("ERR");
  });
});

// ---------------------------------------------------------------------------
// isErr() type guard
// ---------------------------------------------------------------------------

describe("isErr()", () => {
  it("returns true for a failed result", () => {
    expect(isErr(err("AUTH_ERROR", "Unauthorized"))).toBe(true);
  });

  it("returns false for a successful result", () => {
    expect(isErr(ok(123))).toBe(false);
  });

  it("narrows the type to the failure branch inside an if-block", () => {
    const result: Result<number> = err("VALIDATION", "Invalid input", {
      field: "email",
    });
    if (isErr(result)) {
      // TypeScript should know result.error is AppError here
      expectTypeOf(result.error).toMatchTypeOf<AppError>();
      expect(result.error.code).toBe("VALIDATION");
    }
  });
});

// ---------------------------------------------------------------------------
// Exhaustive narrowing
// ---------------------------------------------------------------------------

describe("exhaustive narrowing with Result<T>", () => {
  function handleResult(r: Result<string>): string {
    if (isOk(r)) {
      return `ok:${r.data}`;
    }
    return `err:${r.error.code}`;
  }

  it("returns ok branch value", () => {
    expect(handleResult(ok("ping"))).toBe("ok:ping");
  });

  it("returns err branch value", () => {
    expect(handleResult(err("TIMEOUT", "timed out"))).toBe("err:TIMEOUT");
  });
});

// ---------------------------------------------------------------------------
// AppError shape
// ---------------------------------------------------------------------------

describe("AppError shape", () => {
  it("satisfies the AppError interface", () => {
    const result = err("CODE", "msg", { extra: true });
    const error: AppError = (result as Extract<typeof result, { success: false }>).error;
    expect(error.code).toBe("CODE");
    expect(error.message).toBe("msg");
    expect(error.details).toEqual({ extra: true });
  });
});
