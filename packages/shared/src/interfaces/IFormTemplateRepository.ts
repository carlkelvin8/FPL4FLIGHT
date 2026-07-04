/**
 * IFormTemplateRepository — domain interface for form template persistence.
 * Concrete implementations (Supabase, SQLite cache) live in the data layer.
 */

import type { Result } from "../types/result";
import type { FormTemplate } from "../entities/form";

export interface IFormTemplateRepository {
  findAll(): Promise<Result<FormTemplate[]>>;
  findById(id: string): Promise<Result<FormTemplate>>;
  findByVersion(id: string, version: number): Promise<Result<FormTemplate>>;
}
