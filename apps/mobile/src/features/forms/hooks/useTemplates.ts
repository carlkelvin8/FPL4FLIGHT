import type { FormTemplate } from "@pilotforms/shared";
import { useQuery } from "@tanstack/react-query";

import { formTemplateRepository } from "../repositories/FormTemplateRepository";

const TEMPLATES_KEY = ["form_templates"];

export function useTemplates() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: TEMPLATES_KEY,
    queryFn: async () => {
      const result = await formTemplateRepository.findAll();
      if (!result.success) {
        console.warn("Templates fetch error:", result.error);
        return [];
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });

  return {
    templates: data ?? ([] as FormTemplate[]),
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
