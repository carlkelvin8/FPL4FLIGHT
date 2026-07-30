/**
 * IFormRepository — domain interface for form instance persistence.
 * Concrete implementations (Supabase, SQLite) live in the data layer.
 */

import type { FormInstance } from "../entities/form";
import type {
  CreateFormDto,
  UpdateFormDto,
  FormFilters,
  PaginatedResult,
} from "../types/dtos";
import type { Result } from "../types/result";

export interface IFormRepository {
  create(form: CreateFormDto): Promise<Result<FormInstance>>;
  findById(id: string): Promise<Result<FormInstance>>;
  findByUser(
    userId: string,
    filters: FormFilters
  ): Promise<Result<PaginatedResult<FormInstance>>>;
  update(id: string, data: UpdateFormDto): Promise<Result<FormInstance>>;
  delete(id: string): Promise<Result<void>>;
  /** Returns all form instances with status 'draft' that have not yet been synced. */
  findPendingSync(): Promise<Result<FormInstance[]>>;
}
