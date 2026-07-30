import type { AppError } from "../types/result";

export type ParseErrorCode =
  | "TEMPLATE_INVALID_SCHEMA"
  | "TEMPLATE_DUPLICATE_FIELD_ID"
  | "TEMPLATE_INVALID_FIELD_TYPE"
  | "TEMPLATE_DUPLICATE_SECTION_ID"
  | "TEMPLATE_INVALID_CROSS_FIELD_REFERENCE";

export interface ParseError extends AppError {
  code: ParseErrorCode;
  /** JSON pointer path to the error location, e.g. "/sections/0/fields/2" */
  path?: string;
}

export function createParseError(
  code: ParseErrorCode,
  message: string,
  path?: string,
): ParseError {
  return { code, message, details: path ? { path } : undefined };
}
