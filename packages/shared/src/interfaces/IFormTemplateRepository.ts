/**
 * IFormTemplateRepository — domain interface for form template persistence.
 * Concrete implementations (Supabase, SQLite cache) live in the data layer.
 */

import type { FormTemplate } from "../entities/form";
import type { Result } from "../types/result";

export interface IFormTemplateRepository {
  findAll(): Promise<Result<FormTemplate[]>>;
  findById(id: string): Promise<Result<FormTemplate>>;
  findByVersion(id: string, version: number): Promise<Result<FormTemplate>>;
}
