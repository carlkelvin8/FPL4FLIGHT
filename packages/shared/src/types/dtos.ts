/**
 * Data Transfer Objects (DTOs) — plain objects passed across layer boundaries.
 * These are the shapes accepted by use cases and repository methods as inputs.
 * Framework agnostic, no external dependencies.
 */

// ---------------------------------------------------------------------------
// Form DTOs
// ---------------------------------------------------------------------------

export interface CreateFormDto {
  templateId: string;
  templateVersion: number;
  /** Initial field values — may be empty at creation time */
  data?: Record<string, unknown>;
}

export interface UpdateFormDto {
  status?: "draft" | "completed" | "synced";
  data?: Record<string, unknown>;
  submittedAt?: Date | null;
}

// ---------------------------------------------------------------------------
// Auth DTOs
// ---------------------------------------------------------------------------

export interface SignInDto {
  email: string;
  password: string;
}

// ---------------------------------------------------------------------------
// Query / Pagination helpers
// ---------------------------------------------------------------------------

export type FormStatus = "draft" | "completed" | "synced";

export interface FormFilters {
  status?: FormStatus[];
  templateId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  /** Free-text search term applied to form data */
  search?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
